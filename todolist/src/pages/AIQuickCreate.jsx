import React, { useState } from 'react';
import client from '../api/client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AIQuickCreate() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleParse = async () => {
    if (!text || text.trim().length === 0) return;
    setLoading(true); setError(null); setParsed(null);
    try {
      const res = await client.parseTaskWithAI(text);
      if (res && res.task) setParsed(res.task);
      else setError('No structured result returned');
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'AI parse failed';
      const raw = e.response?.data?.raw;
      setError(msg + (raw ? ' (see raw output below)' : ''));
      if (raw) setParsed({ __raw: raw });
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!parsed || !parsed.title) return setError('Parsed title missing');
    setLoading(true); setError(null);
    try {
      const payload = {
        title: parsed.title || '',
        description: parsed.description || '',
        priority: parsed.priority || 'low',
        dueDate: parsed.dueDate || '' ,
        tags: Array.isArray(parsed.tags) ? parsed.tags : (parsed.tags ? String(parsed.tags).split(',').map(t=>t.trim()) : [])
      };
      const res = await client.post('/tasks', payload);
      const newId = res.data.id || res.data._id;
      navigate(`/tasks/${newId}`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">AI Quick Create</h1>
      </div>

      <div className="card p-6">
        <label className="text-sm text-white/80">Describe the task in natural language</label>
        <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={4} className="w-full p-3 rounded bg-white/5 text-white my-3" placeholder="e.g. Remind me to email John next Monday morning about the budget, high priority, tag: work" />
        <div className="flex gap-2 justify-end">
          <button onClick={handleParse} disabled={loading} className="btn btn-ghost">{loading ? 'Parsing...' : 'Parse'}</button>
        </div>

        {loading && (
          <div className="mt-4 text-sm text-white/70">Parsing with AI — this may take a few seconds...</div>
        )}

        {error && <div className="mt-4 text-sm text-red-300">{error}</div>}

        {parsed && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Parsed Result</h3>
            <div className="mt-2">
              <div><strong>Title:</strong> {parsed.title || <span className="text-yellow-300">(missing)</span>}</div>
              <div><strong>Description:</strong> {parsed.description || '—'}</div>
              <div><strong>Due Date:</strong> {parsed.dueDate || '—'}</div>
              <div><strong>Priority:</strong> {parsed.priority || '—'}</div>
              <div><strong>Tags:</strong> {Array.isArray(parsed.tags) ? parsed.tags.join(', ') : (parsed.tags || '—')}</div>
              {parsed.__raw && (
                <div className="mt-3 p-2 rounded bg-black/30 text-xs text-white/70">
                  <div className="font-semibold">Raw AI output (for debugging):</div>
                  <pre className="whitespace-pre-wrap break-words mt-1">{parsed.__raw}</pre>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>{ setParsed(null); setText(''); setError(null); }} className="btn btn-ghost">Clear</button>
              <button onClick={handleCreate} className="btn btn-primary" disabled={!parsed.title}>Create Task</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
