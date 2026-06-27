import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('All fields are required.');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(191,101,77,0.1) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 anim-slide-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: 'linear-gradient(135deg,#bf654d,#e48b6b)', boxShadow: '0 4px 20px rgba(191,101,77,0.5)' }}>S</div>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Sans,sans-serif' }}>Splito</span>
          </Link>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Sans,sans-serif' }}>Welcome back</h1>
          <p className="text-sm text-white/40 mt-1">Sign in to your account</p>
        </div>

        <div className="card anim-slide-up d200">
          {params.get('error') && (
            <div className="mb-4 p-3 rounded-xl text-sm text-rose-400" style={{ background: 'rgba(214,63,63,0.1)', border: '1px solid rgba(214,63,63,0.2)' }}>
              Google login failed. Please try again.
            </div>
          )}

          <button onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-2.5 px-4 text-sm font-semibold transition-all hover:bg-white/5 mb-5"
            style={{ background: 'rgba(25,30,15,0.05)', border: '1px solid rgba(25,30,15,0.12)', color: 'rgba(25,30,15,0.85)' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(25,30,15,0.08)' }} />
            <span className="text-xs text-white/25">or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(25,30,15,0.08)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} className="input" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/35 mt-5">
          No account?{' '}
          <Link to="/register" className="text-violet-400 font-semibold hover:text-violet-300 transition">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
