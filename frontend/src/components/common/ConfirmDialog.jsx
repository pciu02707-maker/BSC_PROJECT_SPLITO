import { useEffect } from 'react';

const VARIANTS = {
  danger:  { gradient: 'linear-gradient(135deg,#d63f3f,#bd3434)', glow: 'rgba(214,63,63,0.24)',  bg: 'rgba(214,63,63,0.1)',  border: 'rgba(214,63,63,0.2)',  icon: '🗑️' },
  warning: { gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: '⚠️' },
  info:    { gradient: 'linear-gradient(135deg,#bf654d,#e48b6b)', glow: 'rgba(191,101,77,0.24)', bg: 'rgba(191,101,77,0.1)', border: 'rgba(191,101,77,0.2)', icon: '💬' },
};

export default function ConfirmDialog({ title, message, confirmText='Confirm', cancelText='Cancel', variant='danger', onConfirm, onCancel }) {
  const v = VARIANTS[variant] || VARIANTS.danger;

  useEffect(() => {
    const h = e => { if (e.key==='Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 anim-fade-in" onClick={onCancel}
        style={{ background:'rgba(61,49,40,0.28)', backdropFilter:'blur(8px)' }} />

      <div className="relative z-10 w-full max-w-sm anim-slide-up rounded-2xl overflow-hidden"
        style={{ background:'#ffffff', border:'1px solid rgba(216,207,194,0.9)', boxShadow:'0 30px 80px rgba(61,49,40,0.16)' }}>

        <div className="h-0.5 w-full" style={{ background: v.gradient }} />

        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto"
            style={{ background: v.bg, border:`1px solid ${v.border}` }}>
            {v.icon}
          </div>
          <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily:'DM Sans,sans-serif' }}>{title}</h3>
          <p className="text-sm text-white/45 leading-relaxed mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
              style={{ background:'rgba(237,230,219,0.75)', border:'1px solid rgba(216,207,194,0.9)', color:'rgba(61,49,40,0.7)' }}>
              {cancelText}
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: v.gradient, boxShadow:`0 4px 15px ${v.glow}` }}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
