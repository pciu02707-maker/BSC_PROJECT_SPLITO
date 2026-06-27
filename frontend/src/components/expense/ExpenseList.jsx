import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import EditExpenseModal from './EditExpenseModal';
import Avatar from '../common/Avatar';
import ConfirmDialog from '../common/ConfirmDialog';

const CAT       = { food:'🍜', hotel:'🏨', transport:'🚌', entertainment:'🎉', shopping:'🛍️', other:'💳' };
const CAT_COLOR = { food:'rgba(95,126,68,0.08)', hotel:'rgba(191,101,77,0.08)', transport:'rgba(111,140,81,0.08)', entertainment:'rgba(245,158,11,0.08)', shopping:'rgba(178,111,73,0.08)', other:'rgba(237,230,219,0.45)' };

function timeAgo(d) {
  const s=(Date.now()-new Date(d))/1000;
  if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

function PayerChips({ payers, currency }) {
  if (!payers?.length) return null;
  if (payers.length===1) return <span className="text-white/70 font-medium">{payers[0].user?.name}</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {payers.map((p,i)=>(
        <span key={i} className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium"
          style={{ background:'rgba(191,101,77,0.12)', color:'#bf654d', border:'1px solid rgba(191,101,77,0.2)' }}>
          <Avatar user={p.user} size="xs" />{p.user?.name}
          <span className="text-white/35">{currency} {Number(p.amount).toFixed(2)}</span>
        </span>
      ))}
    </span>
  );
}

export default function ExpenseList({ expenses, members, isHost, tripActive, currentUser, currency, onDeleted, onUpdated }) {
  const [editing,  setEditing]  = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [deleting, setDeleting] = useState(null);

  const doDelete = async (expense) => {
    setDeleting(expense._id); setConfirm(null);
    try {
      await api.delete(`/expenses/${expense._id}`);
      toast.success('Expense deleted.'); onDeleted(expense._id);
    } catch (err) { toast.error(err.response?.data?.message||'Failed.'); }
    finally { setDeleting(null); }
  };

  if (!expenses?.length) return (
    <div className="card text-center py-14">
      <div className="text-5xl mb-3">💸</div>
      <p className="text-sm text-white/30">No expenses yet. Add the first one!</p>
    </div>
  );

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense) => {
          const myId    = currentUser?._id;
          const isCreator = expense.addedBy?._id===myId;
          const isPayer   = expense.paidBy?.some(p=>(p.user?._id||p.user)===myId);
          const canEdit   = tripActive && (isCreator||isPayer||isHost);
          const perPerson = expense.splitType==='equal' ? expense.amount/(expense.participants?.length||1) : null;

          return (
            <div key={expense._id} className="card group transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
              style={{ background:CAT_COLOR[expense.category]||CAT_COLOR.other, border:'1px solid rgba(216,207,194,0.72)' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105"
                  style={{background:'rgba(237,230,219,0.7)'}}>
                  {CAT[expense.category]||'💳'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{expense.title}</h3>
                        <span className="badge capitalize text-[10px]"
                          style={{background:'rgba(237,230,219,0.75)',color:'rgba(61,49,40,0.52)',border:'1px solid rgba(216,207,194,0.72)'}}>
                          {expense.category}
                        </span>
                        {expense.splitType==='custom'&&(
                          <span className="badge text-[10px]"
                            style={{background:'rgba(191,101,77,0.14)',color:'#bf654d',border:'1px solid rgba(191,101,77,0.24)'}}>
                            custom
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-wrap mb-1 text-xs text-white/35">
                        <span>Paid by</span>
                        <PayerChips payers={expense.paidBy} currency={currency} />
                        <span className="text-white/15 mx-0.5">·</span>
                        <span>{timeAgo(expense.createdAt)}</span>
                      </div>

                      {expense.note && <p className="text-xs text-white/25 mb-1.5 italic">"{expense.note}"</p>}

                      {/* Participants with avatars */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-white/20">Split:</span>
                        <div className="flex -space-x-1">
                          {expense.participants?.slice(0,6).map((p,i)=>(
                            <div key={i} title={p.user?.name} className="ring-1" style={{ringColor:'rgba(248,245,239,1)'}}>
                              <Avatar user={p.user} size="xs" />
                            </div>
                          ))}
                          {expense.participants?.length > 6 && (
                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] text-white/50"
                              style={{background:'rgba(237,230,219,0.9)'}}>
                              +{expense.participants.length-6}
                            </div>
                          )}
                        </div>
                        {expense.splitType==='custom' && (
                          <span className="text-[10px] text-white/25 ml-1">custom amounts</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <p className="text-base sm:text-xl font-bold text-white" style={{fontFamily:'DM Sans,sans-serif'}}>
                        {currency} {expense.amount?.toLocaleString()}
                      </p>
                      {perPerson&&(
                        <p className="text-[10px] text-white/25">{currency} {perPerson.toFixed(2)}/person</p>
                      )}
                      {canEdit&&(
                        <div className="flex items-center gap-1.5 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>setEditing(expense)}
                            className="text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                            style={{background:'rgba(191,101,77,0.14)',color:'#bf654d'}}>
                            Edit
                          </button>
                          <button
                            disabled={deleting===expense._id}
                            onClick={()=>setConfirm({ expense, title:'Delete Expense', message:`Delete "${expense.title}"? This cannot be undone.`, variant:'danger', confirmText:'Delete' })}
                            className="text-xs font-semibold px-2 py-1 rounded-lg transition-all"
                            style={{background:'rgba(214,63,63,0.1)',color:'#d63f3f'}}>
                            {deleting===expense._id?'...':'Del'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing&&(
        <EditExpenseModal expense={editing} members={members} currency={currency}
          onClose={()=>setEditing(null)}
          onUpdated={u=>{onUpdated(u);setEditing(null);}} />
      )}

      {confirm&&(
        <ConfirmDialog title={confirm.title} message={confirm.message}
          variant={confirm.variant} confirmText={confirm.confirmText}
          onConfirm={()=>doDelete(confirm.expense)}
          onCancel={()=>setConfirm(null)} />
      )}
    </>
  );
}
