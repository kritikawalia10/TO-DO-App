import React, { useEffect, useState, useRef } from 'react';
import client from '../api/client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const defaultSettings = { work: 25 * 60, short: 5 * 60, long: 15 * 60, cyclesBeforeLong: 4 };

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Pomodoro() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pomodoroSettings')) || defaultSettings; } catch { return defaultSettings; }
  });
  const [phase, setPhase] = useState('work');
  const [timeLeft, setTimeLeft] = useState(settings.work);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [attachedTask, setAttachedTask] = useState('');

  const tickRef = useRef(null);

  useEffect(() => { localStorage.setItem('pomodoroSettings', JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    setTimeLeft(phase === 'work' ? settings.work : (phase === 'short' ? settings.short : settings.long));
  }, [phase, settings]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await client.get('/tasks');
        setTasks(res.data.tasks || []);
      } catch (e) { console.warn('Load tasks for pomodoro', e); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isRunning) { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } return; }
    tickRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // complete phase
          clearInterval(tickRef.current); tickRef.current = null; setIsRunning(false);
          handlePhaseComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handlePhaseComplete = async () => {
    // record work sessions only when a work phase ends
    try {
      // play sound and notify user
      playSound();
      notifyUser(phase === 'work' ? 'Work session complete' : 'Break complete');

      if (phase === 'work') {
        const startedAt = new Date(Date.now() - (settings.work * 1000)).toISOString();
        const endedAt = new Date().toISOString();
        await client.post('/pomodoro', { taskId: attachedTask || null, durationSeconds: settings.work, startedAt, endedAt, phase: 'work' });
        setCycleCount(c => c + 1);
        // start break automatically
        if ((cycleCount + 1) % settings.cyclesBeforeLong === 0) setPhase('long'); else setPhase('short');
        setIsRunning(true);
      } else {
        // break finished, go to work
        setPhase('work');
        setIsRunning(true);
      }
    } catch (e) { console.warn('Failed to record pomodoro session', e); }
  };

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      o.stop(ctx.currentTime + 0.7);
    } catch (e) { /* silently ignore */ }
  };

  const notifyUser = (message) => {
    try {
      if (window.Notification && Notification.permission === 'granted') {
        new Notification(message);
      } else if (window.Notification && Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') new Notification(message); });
      }
    } catch (e) { /* ignore */ }
  };

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => { setIsRunning(false); setPhase('work'); setTimeLeft(settings.work); setCycleCount(0); };

  // progress ring calculation
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const totalSeconds = phase === 'work' ? settings.work : (phase === 'short' ? settings.short : settings.long);
  const progress = totalSeconds > 0 ? (1 - (timeLeft / totalSeconds)) : 0;
  const dash = Math.max(0, Math.min(circumference * progress, circumference));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Pomodoro</h1>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">Close</button>
      </div>

      <div className="card p-6 text-center">
        <div className="flex justify-center mb-4">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="g1" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <g transform="translate(90,90)">
              <circle r="72" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle r="72" fill="none" stroke="url(#g1)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={`${circumference - dash}`} transform="rotate(-90)" />
              <text x="0" y="6" textAnchor="middle" fontSize="20" fill="#fff" fontFamily="monospace">{formatTime(timeLeft)}</text>
            </g>
          </svg>
        </div>
        <div className="text-sm text-white/80 mb-2">Phase</div>
        <div className="text-xl font-bold mb-4">{phase === 'work' ? 'Focus' : (phase === 'short' ? 'Short Break' : 'Long Break')}</div>
        <div className="text-6xl font-mono mb-4">{formatTime(timeLeft)}</div>
        <div className="flex items-center justify-center gap-3 mb-4">
          {!isRunning ? <button onClick={start} className="btn btn-primary px-4 py-2">Start</button> : <button onClick={pause} className="btn btn-ghost px-4 py-2">Pause</button>}
          <button onClick={reset} className="btn btn-ghost px-4 py-2">Reset</button>
        </div>

        <div className="mt-4 text-left">
          <label className="text-sm text-white/80">Attach to task (optional)</label>
          <select value={attachedTask} onChange={(e)=>setAttachedTask(e.target.value)} className="w-full p-2 rounded bg-white/5 text-white mt-2">
            <option value="">(No task)</option>
            {tasks.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.title}</option>)}
          </select>
        </div>

        <div className="mt-4">
          <h3 className="text-sm text-white/80 mb-2">Settings</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-white/70">Work (min)</label>
              <input type="number" min={1} value={Math.round(settings.work/60)} onChange={(e)=>setSettings(s => ({ ...s, work: Math.max(60, Number(e.target.value)*60) }))} className="w-full p-2 rounded bg-white/5 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/70">Short (min)</label>
              <input type="number" min={1} value={Math.round(settings.short/60)} onChange={(e)=>setSettings(s => ({ ...s, short: Math.max(60, Number(e.target.value)*60) }))} className="w-full p-2 rounded bg-white/5 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/70">Long (min)</label>
              <input type="number" min={1} value={Math.round(settings.long/60)} onChange={(e)=>setSettings(s => ({ ...s, long: Math.max(60, Number(e.target.value)*60) }))} className="w-full p-2 rounded bg-white/5 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <label className="text-xs text-white/70">Cycles before long break</label>
            <input type="number" min={1} value={settings.cyclesBeforeLong} onChange={(e)=>setSettings(s => ({ ...s, cyclesBeforeLong: Math.max(1, Number(e.target.value)) }))} className="w-24 p-2 rounded bg-white/5 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
