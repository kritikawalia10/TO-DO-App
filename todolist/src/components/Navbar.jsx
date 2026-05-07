import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { FiBell, FiMenu, FiX } from 'react-icons/fi';
import { initSocket, getSocket } from '../lib/socket';

export default function Navbar(){
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const ref = useRef();

  const handleLogout = () => { logout(); navigate('/login'); };

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const res = await client.get('/notifications');
      setNotifications(res.data || []);
    } catch (e) { console.warn('Notif load', e); }
  };

  useEffect(() => {
    if (token) {
      initSocket(token);
      loadNotifications();
      const socket = getSocket();
      if (socket) {
        socket.on('taskCreated', () => loadNotifications());
        socket.on('taskUpdated', () => loadNotifications());
        socket.on('taskDueSoon', () => loadNotifications());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowProfile(false);
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id) => {
    try {
      await client.put(`/notifications/${id}/read`);
      setNotifications((v) => v.map(n => n.id === id || n._id === id ? { ...n, read: true } : n));
    } catch (e) { console.warn(e); }
  };

  return (
    <header className="sticky top-0 z-30 navbar page-fade shadow-sm" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-white/80 hover:bg-white/5 rounded-lg">
            {showMobileMenu ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <Link to="/" className="font-bold text-lg" style={{ color: 'var(--text)' }}>TaskManager</Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/tasks" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tasks</Link>
            <Link to="/analytics" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analytics</Link>
            <Link to="/pomodoro/sessions" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sessions</Link>
            <Link to="/ai/create" className="text-sm" style={{ color: 'var(--text-secondary)' }}>AI</Link>
          </nav>
        </div>

          <div className="flex items-center gap-4 relative" ref={ref}>
          <div className="relative">
            <button onClick={() => setOpen(v => !v)} className="p-2 rounded-full bg-transparent hover:bg-white/4 transition flex items-center" aria-label="notifications">
              <FiBell className="text-lg" style={{ color: 'var(--text-secondary)' }} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 glass rounded-lg p-2 z-50">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="text-sm font-semibold text-white">Notifications</div>
                  <button className="text-xs text-white/70" onClick={() => { setNotifications([]); }}>Clear</button>
                </div>
                <div className="max-h-60 overflow-auto mt-2">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-white/80">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id || n._id} className={`p-2 rounded-md hover:bg-white/10 cursor-pointer flex items-start gap-2 ${n.read ? 'opacity-70' : ''}`} onClick={() => markRead(n.id || n._id)}>
                        <div className="w-2 h-2 rounded-full bg-white/60 mt-1" />
                        <div className="text-sm text-white/90">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/80 hidden sm:block">{user.name || user.email}</div>
              <button onClick={() => setShowProfile(v => !v)} className="p-0 bg-transparent border-0">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6366F1&color=fff`} alt="avatar" className="w-9 h-9 rounded-full border-2 border-white/10" />
              </button>
              <button onClick={handleLogout} className="text-sm text-white/80">Logout</button>

              {showProfile && (
                <div className="profile-panel" role="dialog" aria-label="Profile panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6366F1&color=fff`} alt="avatar" className="w-12 h-12 rounded-full" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{user.name || user.email}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={() => { setShowProfile(false); navigate('/profile'); }}>View Profile</button>
                    <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={handleLogout}>Logout</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
              <div className="flex items-center gap-3">
              <Link to="/login" className="text-white/80">Login</Link>
              <Link to="/register" className="text-white/80">Register</Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-full left-0 w-full glass shadow-xl border-t border-white/5 py-4 px-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <Link to="/tasks" onClick={() => setShowMobileMenu(false)} className="text-lg font-medium text-white/90 py-2 border-b border-white/5">Tasks</Link>
          <Link to="/analytics" onClick={() => setShowMobileMenu(false)} className="text-lg font-medium text-white/90 py-2 border-b border-white/5">Analytics</Link>
          <Link to="/pomodoro/sessions" onClick={() => setShowMobileMenu(false)} className="text-lg font-medium text-white/90 py-2 border-b border-white/5">Sessions</Link>
          <Link to="/ai/create" onClick={() => setShowMobileMenu(false)} className="text-lg font-medium text-white/90 py-2 border-b border-white/5">AI Quick Create</Link>
          {!user && (
            <div className="flex flex-col gap-3 mt-4">
              <Link to="/login" onClick={() => setShowMobileMenu(false)} className="btn btn-ghost w-full">Login</Link>
              <Link to="/register" onClick={() => setShowMobileMenu(false)} className="btn btn-primary w-full">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
