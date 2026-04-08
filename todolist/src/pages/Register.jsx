import React, { useState, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post('/auth/register', { name, email, password });
      // auto-login not provided by server; call login endpoint
      const loginRes = await client.post('/auth/login', { email, password });
      login(loginRes.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create account</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-2 border rounded text-white placeholder-gray-300 bg-transparent" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full p-2 border rounded text-white placeholder-gray-300 bg-transparent" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 border rounded text-white placeholder-gray-300 bg-transparent" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full btn btn-primary">Register</button>
      </form>
    </div>
  );
}
