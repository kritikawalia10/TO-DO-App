import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://to-do-app-1-syp2.onrender.com/api';

const client = axios.create({ baseURL: API_BASE, withCredentials: false });

client.setAuthToken = (token) => {
  if (token) client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete client.defaults.headers.common['Authorization'];
};

// Parse free-form task text with backend AI endpoint
client.parseTaskWithAI = async (text) => {
  const res = await client.post('/ai/parse-task', { text });
  return res.data;
};

export default client;
