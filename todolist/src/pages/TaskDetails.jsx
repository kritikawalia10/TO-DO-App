import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useParams } from 'react-router-dom';

export default function TaskDetails(){
  const { id } = useParams();
  const [task, setTask] = useState(null);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const res = await client.get(`/tasks/${id}`);
        setTask(res.data);
      }catch(e){ }
    };
    load();
  },[id]);

  if (!task) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2 text-white">{task.title}</h1>
      <p className="text-white/80 mb-4">{task.description}</p>
      <div className="text-white/90">Priority: {task.priority}</div>
    </div>
  );
}
