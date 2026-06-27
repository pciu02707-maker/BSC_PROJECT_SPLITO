import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(191,101,77,0.08) 0%, transparent 70%)' }} />
      </div>
      <div className="text-center relative z-10 anim-slide-up">
        <div className="text-8xl mb-6 anim-float inline-block">🗺️</div>
        <h1 className="text-6xl font-bold grad-text mb-3" style={{ fontFamily: 'DM Sans,sans-serif' }}>404</h1>
        <p className="text-white/40 text-lg mb-8">This page doesn't exist — wrong turn!</p>
        <Link to="/dashboard" className="btn-primary text-base py-3 px-8">Back to Dashboard →</Link>
      </div>
    </div>
  );
}
