import React, { useEffect, useState } from 'react';
import client from '../api/client';
import TaskCard from '../components/TaskCard';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ title: '', description: '', priority: 'low', dueDate: '' });

  const load = async () => {
    try {
      const res = await client.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (e) {
      console.warn('Load tasks', e);
    }
  };

  useEffect(()=>{ load(); }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const navigate = useNavigate();

  const createTask = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = { ...form };
      const res = await client.post('/tasks', payload);
      // prepend new task
      setTasks(t => [res.data, ...t]);
      // navigate to task details (handle lowdb id or mongoose _id)
      const newId = res.data.id || res.data._id;
      if (newId) navigate(`/tasks/${newId}`);
      setOpen(false);
      setForm({ title: '', description: '', priority: 'low', dueDate: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  const handleUpdate = async (updated) => {
    try {
      const id = updated.id || updated._id;
      const res = await client.put(`/tasks/${id}`, updated);
      setTasks(t => t.map(x => (x.id === id || x._id === id ? res.data : x)));
    } catch (e) { console.warn('Update task', e); }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/tasks/${id}`);
      setTasks(t => t.filter(x => !(x.id === id || x._id === id)));
    } catch (e) { console.warn('Delete task', e); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Tasks</h1>
        <button onClick={() => setOpen(true)} className="px-4 py-2 btn-gradient text-white rounded-lg shadow hover:scale-95 transition">New Task</button>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-12 text-center text-white/80">
          <div className="text-2xl mb-3">No tasks yet 🚀</div>
          <div>Add your first task to get started.</div>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4">
          {tasks.map((t, idx) => (
            <motion.div key={t.id || t._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.06 } }}>
              <TaskCard task={t} onUpdate={handleUpdate} onDelete={handleDelete} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <motion.form onSubmit={createTask} className="relative w-full max-w-lg bg-white/6 glass p-6 rounded-2xl z-50" onClick={(e)=>e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Create Task</h2>
            {error && <div className="text-sm text-red-300 mb-2">{error}</div>}
            <div className="space-y-3">
              <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full p-3 rounded bg-white/5 text-white" required />
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full p-3 rounded bg-white/5 text-white" rows={4} />
              <div className="flex gap-3">
                <select name="priority" value={form.priority} onChange={handleChange} className="p-2 rounded bg-white/5 text-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input name="dueDate" value={form.dueDate} onChange={handleChange} type="date" className="p-2 rounded bg-white/5 text-white" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded bg-white/5 text-white">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded btn-gradient text-white">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </motion.div>
  );
}
