import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Modal({ title, onClose, children, size = 'md' }) {
  const { isClassic } = useTheme();

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', h);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', h); };
  }, [onClose]);

  const maxW = size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 anim-fade-in" onClick={onClose}
        style={{
          background: isClassic ? 'rgba(0, 0, 0, 0.6)' : 'rgba(61,49,40,0.28)',
          backdropFilter: 'blur(8px)'
        }} />
      <div className={`relative w-full ${maxW} max-h-[90vh] overflow-y-auto z-10 anim-slide-up rounded-2xl`}
        style={{
          background: isClassic ? '#1a1a2e' : '#ffffff',
          border: isClassic ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(216, 207, 194, 0.9)',
          boxShadow: isClassic ? '0 30px 80px rgba(0, 0, 0, 0.5)' : '0 30px 80px rgba(61, 49, 40, 0.16)'
        }}>
        <div className="sticky top-0 px-5 pt-5 pb-4 flex items-center justify-between"
          style={{
            background: isClassic ? '#1a1a2e' : '#ffffff',
            borderBottom: isClassic ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(216, 207, 194, 0.72)',
            zIndex: 1
          }}>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans,sans-serif' }}>{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
