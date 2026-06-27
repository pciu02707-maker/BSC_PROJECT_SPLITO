import Avatar from '../common/Avatar';

export default function BalancePanel({ balanceData, currency='BDT', currentUserId }) {
  if (!balanceData) return (
    <div className="card text-center py-12 text-white/30">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      Calculating balances...
    </div>
  );

  const { settlements=[], summary=[], totalExpense=0 } = balanceData;

  return (
    <div className="space-y-4">
      {/* Total hero */}
      <div className="card relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,rgba(191,101,77,0.18),rgba(228,139,107,0.1))', borderColor:'rgba(191,101,77,0.22)' }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,rgba(191,101,77,0.15) 0%,transparent 70%)', transform:'translate(30%,-30%)' }} />
        <p className="text-xs text-white/35 uppercase tracking-widest mb-1">Total Trip Expense</p>
        <p className="text-3xl sm:text-4xl font-bold" style={{ fontFamily:'DM Sans,sans-serif' }}>
          <span className="text-white/50 text-xl">{currency} </span>
          <span className="grad-text">{totalExpense?.toLocaleString()}</span>
        </p>
      </div>

      {/* Per person */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Per Person</h2>
        <div className="space-y-2">
          {summary?.map((s, i) => {
            const isMe = s.user?._id===currentUserId;
            const net  = s.netBalance;
            return (
              <div key={s.user?._id}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl transition-all"
                style={{
                  background: isMe?'rgba(191,101,77,0.1)':'rgba(25,30,15,0.04)',
                  border:`1px solid ${isMe?'rgba(191,101,77,0.25)':'rgba(25,30,15,0.06)'}`,
                }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={s.user} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {s.user?.name}
                      {isMe && <span className="text-xs text-violet-400 ml-1">(you)</span>}
                    </p>
                    <p className="text-xs text-white/30 truncate">
                      Paid {currency} {s.totalPaid?.toFixed(2)} · Share {currency} {s.totalShare?.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <span className={`text-sm sm:text-base font-bold ${net>0?'text-emerald-400':net<0?'text-rose-400':'text-white/30'}`}>
                    {net>0?'+':''}{net===0?'✓':`${currency} ${Math.abs(net).toFixed(2)}`}
                  </span>
                  {net!==0 && <p className="text-[10px] text-white/20">{net>0?'gets back':'owes'}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlements */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Settlement Plan</h2>
          <span className="badge badge-active">{settlements.length} transaction{settlements.length!==1?'s':''}</span>
        </div>
        {!settlements.length ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-sm font-semibold text-white/50">Everyone's settled up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((s, i) => {
              const fromMe = s.from===currentUserId;
              const toMe   = s.to===currentUserId;
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: fromMe?'rgba(214,63,63,0.07)':toMe?'rgba(95,126,68,0.07)':'rgba(25,30,15,0.04)',
                    border:`1px solid ${fromMe?'rgba(214,63,63,0.18)':toMe?'rgba(95,126,68,0.18)':'rgba(25,30,15,0.06)'}`,
                  }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[80px] sm:max-w-none">
                      {fromMe?'You':s.fromName}
                    </span>
                    <svg className="w-4 h-4 text-white/25 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[80px] sm:max-w-none">
                      {toMe?'You':s.toName}
                    </span>
                  </div>
                  <span className={`font-bold text-sm shrink-0 ml-2 ${fromMe?'text-rose-400':toMe?'text-emerald-400':'text-white/70'}`}>
                    {currency} {s.amount?.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
