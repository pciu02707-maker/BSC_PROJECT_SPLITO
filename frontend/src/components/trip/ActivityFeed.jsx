import Avatar from '../common/Avatar';

const TYPE_META = {
  expense_added:   { icon:'💸', color:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.22)' },
  expense_edited:  { icon:'✏️', color:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.18)' },
  expense_deleted: { icon:'🗑️', color:'rgba(244,63,94,0.08)', border:'rgba(244,63,94,0.16)' },
  member_joined:   { icon:'👋', color:'rgba(191,101,77,0.1)',  border:'rgba(191,101,77,0.22)' },
  member_left:     { icon:'🚪', color:'rgba(255,255,255,0.04)',border:'rgba(255,255,255,0.08)' },
  trip_created:    { icon:'🧳', color:'rgba(191,101,77,0.12)', border:'rgba(191,101,77,0.25)' },
  trip_closed:     { icon:'✅', color:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.18)' },
  trip_locked:     { icon:'🔒', color:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.16)' },
};

function timeAgo(d) {
  const s=(Date.now()-new Date(d))/1000;
  if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function ActivityFeed({ activities }) {
  if (!activities?.length) return (
    <div className="card text-center py-14">
      <div className="text-4xl mb-3">📜</div>
      <p className="text-sm text-white/30">No activity yet. Start adding expenses!</p>
    </div>
  );

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-5">Activity Feed</h2>
      <div className="space-y-2">
        {activities.map((a, i) => {
          const meta = TYPE_META[a.type] || { icon:'📌', color:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)' };
          return (
            <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-white/3"
              style={{ background: i===0 ? meta.color : 'transparent', border:`1px solid ${i===0 ? meta.border : 'transparent'}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                style={{ background: meta.color, border:`1px solid ${meta.border}` }}>
                {meta.icon}
              </div>
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {a.user && <Avatar user={a.user} size="xs" className="shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/75 leading-snug">{a.message}</p>
                  <p className="text-xs text-white/25 mt-0.5">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
