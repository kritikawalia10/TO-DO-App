import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { motion } from 'framer-motion';

function humanTime(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function PomodoroSessions(){
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalMinutes:0, count:0 });

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true);
      try{
        const res = await client.get('/pomodoro');
        const items = res.data.sessions || [];
        setSessions(items);
        const today = new Date();
        const totalToday = items.filter(s => {
          const d = new Date(s.createdAt);
          return d.toDateString() === today.toDateString();
        }).reduce((acc, s)=> acc + (Number(s.durationSeconds)||0), 0);
        setStats({ totalMinutes: Math.round(totalToday/60), count: items.length });
      }catch(e){ console.warn('Load pomodoro sessions', e); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Pomodoro Sessions</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-white/80">Today's Focus (min)</div>
          <div className="text-2xl font-bold">{stats.totalMinutes}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-white/80">Total Sessions</div>
          <div className="text-2xl font-bold">{stats.count}</div>
        </div>
      </div>

      <div className="card p-4">
        {loading ? <div>Loading...</div> : (
          <div className="space-y-2">
            {sessions.length === 0 ? <div className="text-sm text-white/80">No sessions recorded.</div> : (
              sessions.map(s => (
                <div key={s.id} className="p-2 rounded hover:bg-white/6 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{s.taskId ? `Task ${s.taskId}` : 'No task'}</div>
                    <div className="text-xs text-white/70">{humanTime(s.createdAt)}</div>
                  </div>
                  <div className="text-sm">{Math.round((s.durationSeconds||0)/60)} min</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
