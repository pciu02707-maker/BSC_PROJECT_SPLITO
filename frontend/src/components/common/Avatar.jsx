// Unified avatar component — shows photo if available, falls back to styled initials
export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs:  { box:'w-6 h-6',  text:'text-[9px]',  radius:'rounded-md' },
    sm:  { box:'w-8 h-8',  text:'text-xs',     radius:'rounded-lg' },
    md:  { box:'w-10 h-10',text:'text-sm',     radius:'rounded-xl' },
    lg:  { box:'w-12 h-12',text:'text-base',   radius:'rounded-xl' },
    xl:  { box:'w-16 h-16',text:'text-xl',     radius:'rounded-2xl' },
    '2xl':{ box:'w-20 h-20',text:'text-2xl',  radius:'rounded-2xl' },
  };
  const s = sizes[size] || sizes.md;
  const name = user?.name || '?';
  const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  // Pick a consistent color based on name
  const colors = [
    'linear-gradient(135deg,#bf654d,#e48b6b)',
    'linear-gradient(135deg,#8a6f45,#b9925b)',
    'linear-gradient(135deg,#c27845,#dfad6a)',
    'linear-gradient(135deg,#5f7e44,#7b9657)',
    'linear-gradient(135deg,#6f8c51,#94a868)',
    'linear-gradient(135deg,#b36b4b,#d68963)',
    'linear-gradient(135deg,#d63f3f,#bd3434)',
    'linear-gradient(135deg,#6a7c46,#8a9a5d)',
  ];
  const colorIndex = name.split('').reduce((s,c)=>s+c.charCodeAt(0),0) % colors.length;

  if (user?.avatar) {
    return (
      <img src={user.avatar} alt={name}
        className={`${s.box} ${s.radius} object-cover shrink-0 ${className}`}
        onError={e => { e.target.style.display='none'; e.target.nextSibling?.style.removeProperty('display'); }} />
    );
  }

  return (
    <div className={`${s.box} ${s.radius} ${s.text} flex items-center justify-center font-bold text-white shrink-0 ${className}`}
      style={{ background: colors[colorIndex] }}>
      {initials}
    </div>
  );
}
