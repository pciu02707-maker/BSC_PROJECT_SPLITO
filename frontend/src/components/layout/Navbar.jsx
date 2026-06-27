import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../common/Avatar';

export default function Navbar({ action }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { isClassic, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = e => { if (!dropRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = async () => { setOpen(false); await logout(); navigate('/'); };
  const isOnTrip = location.pathname.startsWith('/trips/');

  return (
    <nav className="sticky top-0 z-40 border-b"
      style={{ background:'var(--nav-bg)', backdropFilter:'blur(16px)', borderColor:'var(--nav-border)' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">
          {/* Back button on trip pages (mobile) */}
          {isOnTrip && (
            <button onClick={() => navigate('/dashboard')}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-white/10"
              style={{ border:'1px solid rgba(var(--border-rgb),0.35)' }}>
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs transition-transform group-hover:scale-110"
              style={{ background:'var(--gradient-warm)', boxShadow:'0 4px 12px rgba(var(--brand-rgb),0.32)' }}>S</div>
            <span className="font-bold text-white hidden sm:block" style={{ fontFamily:'DM Sans,sans-serif' }}>Splito</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {action && <div className="flex items-center">{action}</div>}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${connected?'bg-emerald-400':'bg-white/20'}`}
              style={connected?{boxShadow:'0 0 6px var(--success-hex)'}:{}} />
            <span className="text-xs text-white/25">{connected?'Live':'Offline'}</span>
          </div>

          {/* <button type="button" onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
            <span className="theme-toggle-dot" />
          </button> */}

          <div className="relative" ref={dropRef}>
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-white/5">
              <Avatar user={user} size="sm" />
              <span className="hidden sm:block text-sm font-medium text-white/80 max-w-[100px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <svg className={`w-3.5 h-3.5 text-white/30 transition-transform ${open?'rotate-180':''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl py-2 z-50 anim-fade-in"
                style={{ background:'var(--menu-bg)', border:'1px solid rgba(var(--border-rgb),0.18)', boxShadow:'var(--floating-shadow)' }}>
                <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor:'rgba(var(--border-rgb),0.12)' }}>
                  <Avatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-white/30 truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  <span>👤</span> Profile Settings
                </Link>
                <Link to="/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  <span>🧳</span> My Trips
                </Link>
                <div className="border-t my-1" style={{ borderColor:'rgba(var(--border-rgb),0.12)' }} />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <span>🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
