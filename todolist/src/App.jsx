import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Analytics from './pages/Analytics';
import Pomodoro from './pages/Pomodoro';
import PomodoroSessions from './pages/PomodoroSessions';
import AIQuickCreate from './pages/AIQuickCreate';
import './index.css';
import './App.css';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
  const { token } = React.useContext(AuthContext);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
            <Route path="/tasks/:id" element={<PrivateRoute><TaskDetails /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/pomodoro" element={<PrivateRoute><Pomodoro /></PrivateRoute>} />
            <Route path="/pomodoro/sessions" element={<PrivateRoute><PomodoroSessions /></PrivateRoute>} />
            <Route path="/ai/create" element={<PrivateRoute><AIQuickCreate /></PrivateRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
