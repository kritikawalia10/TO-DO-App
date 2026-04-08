import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { FaCircle } from 'react-icons/fa';
import { FaCheck } from 'react-icons/fa';

const priorityClass = (p) => {
  if (p === 'high') return 'bg-red-500';
  if (p === 'medium') return 'bg-yellow-400';
  return 'bg-green-400';
};

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: task.title || '', description: task.description || '', priority: task.priority || 'low', dueDate: task.dueDate || '' });

  const id = task.id || task._id;

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const updated = { ...task, ...form };
    if (onUpdate) onUpdate(updated);
    setEditing(false);
  };

  const remove = async () => {
    if (onDelete) onDelete(id);
  };

  const changePriority = async (e) => {
    const updated = { ...task, priority: e.target.value };
    setForm(f => ({ ...f, priority: e.target.value }));
    if (onUpdate) onUpdate(updated);
  };

  const completed = (task.status === 'done' || task.completed === true);

  const toggleCompleted = () => {
    const updated = { ...task, status: completed ? 'todo' : 'done' };
    if (onUpdate) onUpdate(updated);
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-4 bg-white/6 glass rounded-xl card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <input name="title" value={form.title} onChange={handleChange} className="w-full p-2 rounded bg-white/5 text-white" />
              <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 rounded bg-white/5 text-white" rows={3} />
              <div className="flex items-center gap-2">
                <select name="priority" value={form.priority} onChange={handleChange} className="p-2 rounded bg-white/5 text-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input name="dueDate" value={form.dueDate ? form.dueDate.split('T')[0] : ''} onChange={handleChange} type="date" className="p-2 rounded bg-white/5 text-white" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={toggleCompleted} aria-pressed={completed} className={`w-6 h-6 flex items-center justify-center rounded ${completed ? 'bg-green-600' : 'bg-white/5'} focus:outline-none`}>
                  {completed ? <FaCheck className="text-white text-sm" /> : null}
                </button>
                <div>
                  <h3 className={`text-lg font-semibold ${completed ? 'line-through text-white/60' : 'text-white'}`}>{task.title}</h3>
                  <p className="text-sm text-white/80 mt-1">{task.description}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className={clsx('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white', priorityClass(task.priority))}>{task.priority}</span>
                <div className="text-sm text-white/80">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          {!editing && (
            <select value={form.priority} onChange={changePriority} className="p-1 rounded bg-white/5 text-white text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          )}
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={save} className="btn btn-primary btn-sm">Save</button>
                <button onClick={() => { setEditing(false); setForm({ title: task.title || '', description: task.description || '', priority: task.priority || 'low', dueDate: task.dueDate || '' }); }} className="btn btn-ghost btn-sm">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm">Edit</button>
                <button onClick={remove} className="btn btn-danger btn-sm">Delete</button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
