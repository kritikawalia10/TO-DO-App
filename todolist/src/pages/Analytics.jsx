import React, { useEffect, useState, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../lib/socket';

const COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function formatDateKey(d) {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

export default function Analytics(){
  const { token } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/tasks');
      const items = res.data.tasks || res.data || [];
      setTasks(items);
    } catch (e) { console.warn('Load analytics tasks', e); }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    load();
    const socket = initSocket(token);
    if (socket) {
      socket.on('taskCreated', load);
      socket.on('taskUpdated', load);
      socket.on('taskDeleted', load);
    }
    return () => {
      const s = getSocket();
      if (s) {
        s.off('taskCreated', load);
        s.off('taskUpdated', load);
        s.off('taskDeleted', load);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // compute stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done' || t.completed).length;
  const pending = total - completed;
  const productivity = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';

  const priorityCounts = tasks.reduce((acc, t) => {
    const p = t.priority || 'low';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  // last 7 days created
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDateKey(d));
  }
  const perDay = days.map(day => tasks.filter(t => {
    const key = t.createdAt ? formatDateKey(t.createdAt) : (t.createdAt || t.createdAt === 0 ? formatDateKey(t.createdAt) : null);
    return key === day;
  }).length);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-white">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 glass rounded-lg">
          <div className="text-sm text-white/80">Total Tasks</div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="p-4 glass rounded-lg">
          <div className="text-sm text-white/80">Completed</div>
          <div className="text-2xl font-bold text-white">{completed}</div>
        </div>
        <div className="p-4 glass rounded-lg">
          <div className="text-sm text-white/80">Pending</div>
          <div className="text-2xl font-bold text-white">{pending}</div>
        </div>
        <div className="p-4 glass rounded-lg">
          <div className="text-sm text-white/80">Productivity</div>
          <div className="text-2xl font-bold text-white">{productivity}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white/6 glass p-4 rounded-lg">
          <div className="text-sm text-white/80 mb-3">Tasks in last 7 days</div>
          {loading ? <div className="text-white/80">Loading...</div> : (
            <svg viewBox="0 0 700 160" className="w-full h-40">
              {perDay.map((count, i) => {
                const x = 20 + i * 95;
                const max = Math.max(...perDay, 1);
                const h = (count / max) * 100;
                return (
                  <g key={i}>
                    <rect x={x} y={120 - h} width={60} height={h} rx={6} fill="#6366F1" opacity={0.9}></rect>
                    <text x={x + 30} y={138} fontSize="10" fill="#d1d5db" textAnchor="middle">{days[i].slice(5)}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        <div className="bg-white/6 glass p-4 rounded-lg">
          <div className="text-sm text-white/80 mb-3">Priority distribution</div>
          <div className="space-y-3">
            {['high','medium','low'].map(p => {
              const cnt = priorityCounts[p] || 0;
              const pct = total > 0 ? Math.round((cnt/total)*100) : 0;
              return (
                <div key={p} className="text-white/90">
                  <div className="flex justify-between mb-1 text-sm"><div className="capitalize">{p}</div><div>{cnt} ({pct}%)</div></div>
                  <div className="w-full bg-white/5 rounded h-3 overflow-hidden">
                    <div style={{ width: `${pct}%`, background: COLORS[p], height: '100%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white/6 glass p-4 rounded-lg">
        <h2 className="text-lg text-white mb-2">Recent completed tasks</h2>
        {tasks.filter(t => t.status === 'done' || t.completed).slice(0,6).map(t => (
          <div key={t.id || t._id} className="p-2 border-b border-white/6 last:border-b-0">
            <div className="text-white/90">{t.title}</div>
            <div className="text-xs text-white/70">Completed at: {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : (t.updatedAt || t.updatedAt === 0 ? new Date(t.updatedAt).toLocaleString() : '—')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
