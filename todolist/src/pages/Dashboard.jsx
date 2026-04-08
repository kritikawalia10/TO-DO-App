import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaTasks, FaCheckCircle, FaClock, FaPercent } from 'react-icons/fa';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../lib/socket';

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i = 1) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } })
};

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, productivity: '0%' });

  const load = async () => {
    try {
      const res = await client.get('/tasks');
      const items = res.data.tasks || res.data || [];
      setTasks(items);
      const total = Array.isArray(items) ? items.length : (res.data.total || 0);
      const completed = (Array.isArray(items) ? items.filter(t => (t.status === 'done' || t.completed === true)).length : 0);
      const pending = total - completed;
      const productivity = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';
      setStats({ total, completed, pending, productivity });
    } catch (e) {
      console.warn('Load dashboard tasks', e);
    }
  };

  useEffect(() => {
    if (!token) return;
    load();
    const socket = initSocket(token);
    if (socket) {
      socket.on('taskCreated', load);
      socket.on('taskUpdated', load);
      socket.on('taskDeleted', load);
      socket.on('taskDueSoon', load);
    }
    return () => {
      const s = getSocket();
      if (s) {
        s.off('taskCreated', load);
        s.off('taskUpdated', load);
        s.off('taskDeleted', load);
        s.off('taskDueSoon', load);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const cards = [
    { id: 'total', title: 'Total Tasks', value: stats.total, icon: FaTasks, gradient: 'from-purple-500 to-indigo-500' },
    { id: 'completed', title: 'Completed', value: stats.completed, icon: FaCheckCircle, gradient: 'from-green-400 to-teal-400' },
    { id: 'pending', title: 'Pending', value: stats.pending, icon: FaClock, gradient: 'from-yellow-400 to-orange-400' },
    { id: 'productivity', title: 'Productivity', value: stats.productivity, icon: FaPercent, gradient: 'from-pink-400 to-rose-400' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-6xl mx-auto page-fade">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost">Today</button>
          <button className="btn btn-ghost">This Week</button>
          <button className="btn btn-primary">New Task</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.id} custom={idx} variants={cardVariants} initial="hidden" animate="visible">
              <div className={`card p-4`}> 
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>{s.title}</div>
                    <div className="text-2xl font-semibold mt-1" style={{ color: 'var(--text)' }}>{s.value}</div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br" style={{ background: `linear-gradient(90deg, ${'var(--primary-start)'}, ${'var(--primary-end)'})` }}>
                    <div className="flex items-center justify-center h-full"><Icon className="text-white text-xl" /></div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="col-span-2 card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Recent Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No recent tasks.</p>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 6).map(t => (
                <div key={t.id || t._id} className="p-3 rounded-lg flex items-center justify-between hover:bg-gray-50 transition">
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text)' }}>{t.title}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>Due: {t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    {t.status === 'done' || t.completed ? (
                      <span className="tag-done">Done</span>
                    ) : (
                      <span className="tag-pending">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Focus</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Start a Pomodoro session to boost your productivity.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary">Start</button>
            <button className="btn btn-ghost">Settings</button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
