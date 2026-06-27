import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const brandRgb = getComputedStyle(document.documentElement).getPropertyValue('--brand-rgb').trim() || '191,101,77';
        ctx.fillStyle = `rgba(${brandRgb},${p.alpha})`;
        ctx.fill();
      });
      // draw connections
      particles.forEach((a, i) => particles.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 100) {
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          const brandRgb = getComputedStyle(document.documentElement).getPropertyValue('--brand-rgb').trim() || '191,101,77';
          ctx.strokeStyle = `rgba(${brandRgb},${0.15*(1-d/100)})`; ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const features = [
  { icon: '🧳', title: 'Trip Rooms', desc: 'Create a room, set the currency, invite your crew via a code.', color: 'from-violet-500/20 to-purple-500/10' },
  { icon: '💸', title: 'Smart Splitting', desc: 'Equal or fully custom splits. Every share auto-calculated.', color: 'from-blue-500/20 to-cyan-500/10' },
  { icon: '⚡', title: 'Real-Time Sync', desc: 'Every expense update appears instantly for all members.', color: 'from-amber-500/20 to-orange-500/10' },
  { icon: '🧠', title: 'Debt Optimizer', desc: 'Minimizes transactions needed to settle up completely.', color: 'from-rose-500/20 to-pink-500/10' },
  { icon: '📜', title: 'Activity Feed', desc: 'Full timestamped log — transparent, no disputes.', color: 'from-emerald-500/20 to-teal-500/10' },
  { icon: '🔐', title: 'Secure Auth', desc: 'Google login or email/password. JWT-secured sessions.', color: 'from-indigo-500/20 to-violet-500/10' },
];

export default function LandingPage() {
  const { isClassic, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--gradient-warm)', boxShadow: '0 4px 15px rgba(var(--brand-rgb),0.45)' }}>
            S
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>Splito</span>
        </div>
        <div className="flex items-center gap-3">
          {/* <button type="button" onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
            <span className="theme-toggle-dot" />
            <span className="hidden sm:inline">{isClassic ? 'Classic' : 'Tripsy'}</span>
          </button> */}
          <Link to="/login" className="text-sm font-medium text-white/60 hover:text-white transition">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <ParticleCanvas />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(var(--brand-rgb),0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(var(--brand-glow-rgb),0.1) 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 anim-fade-in"
            style={{ background: 'rgba(var(--brand-rgb),0.15)', border: '1px solid rgba(var(--brand-rgb),0.3)' }}>
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-semibold text-violet-300 tracking-wide">REAL-TIME EXPENSE SPLITTING</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-[1.05] anim-slide-up"
            style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Split Expenses,<br />
            <span className="grad-text">Not Friendships</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 anim-slide-up d200">
            Create a trip room, add shared expenses, and Splito calculates
            who owes whom — synced live for everyone in the group.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 anim-slide-up d300">
            <Link to="/register" className="btn-primary text-base py-3.5 px-8 w-full sm:w-auto">
              Start a Trip Free →
            </Link>
            <Link to="/login" className="btn-secondary text-base py-3.5 px-8 w-full sm:w-auto">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Everything your trip needs
            </h2>
            <p className="text-white/40 text-lg">Built for the chaos of group travel.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title}
                className={`card card-hover anim-slide-up d${(i+1)*100 > 400 ? 400 : (i+1)*100} group cursor-default`}
                style={{ background: `linear-gradient(135deg, ${f.color.replace('from-','').replace(' to-',' , ')})`.replace('from-','').replace('to-','') }}>
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
                <h3 className="font-bold text-white mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto glass p-10">
          <div className="text-5xl mb-4 anim-float">✈️</div>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Ready to go?</h2>
          <p className="text-white/40 mb-6">Create your first trip in under 30 seconds.</p>
          <Link to="/register" className="btn-primary text-base py-3.5 px-10">Create Free Account →</Link>
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-white/20 border-t border-white/5">
        © {new Date().getFullYear()} Splito · Built with ❤️
      </footer>
    </div>
  );
}
