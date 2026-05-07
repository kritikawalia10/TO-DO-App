import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaTasks, FaCheckCircle, FaClock, FaPercent } from 'react-icons/fa';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { initSocket, getSocket } from '../lib/socket';
import { useNavigate } from 'react-router-dom';

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

  const navigate = useNavigate();

  const goToday = () => navigate('/tasks', { state: { filter: 'today' } });
  const goWeek = () => navigate('/tasks', { state: { filter: 'week' } });
  const goNewTask = () => navigate('/tasks', { state: { openNew: true } });

  const cards = [
    { id: 'total', title: 'Total Tasks', value: stats.total, icon: FaTasks, gradient: 'from-purple-500 to-indigo-500' },
    { id: 'completed', title: 'Completed', value: stats.completed, icon: FaCheckCircle, gradient: 'from-green-400 to-teal-400' },
    { id: 'pending', title: 'Pending', value: stats.pending, icon: FaClock, gradient: 'from-yellow-400 to-orange-400' },
    { id: 'productivity', title: 'Productivity', value: stats.productivity, icon: FaPercent, gradient: 'from-pink-400 to-rose-400' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-6xl mx-auto page-fade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          <button onClick={goToday} className="btn-black">Today</button>
          <button onClick={goWeek} className="btn-black">This Week</button>
          <button onClick={goNewTask} className="btn-black">New Task</button>
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
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg group-hover:border-purple-500/50 transition-all duration-300">
                    <Icon className="text-purple-400 text-xl group-hover:scale-110 transition-transform" />
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
              {tasks.slice(0, 6).map((t, i) => (
                <motion.div 
                  key={t.id || t._id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl flex items-center justify-between bg-white text-gray-900 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {t.title ? t.title[0].toUpperCase() : 'T'}
                    </div>
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-xs text-gray-500">Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</div>
                    </div>
                  </div>
                  <div>
                    {t.status === 'done' || t.completed ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">Done</span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Focus</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Start a Pomodoro session to boost your productivity.</p>
            <div className="mt-6 flex gap-3">
            <button onClick={() => navigate('/pomodoro')} className="btn-black flex-1">Start</button>
            <button onClick={() => navigate('/pomodoro')} className="btn-black flex-1">Settings</button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
