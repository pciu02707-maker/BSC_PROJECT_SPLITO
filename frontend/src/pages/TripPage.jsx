import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ExpenseList from '../components/expense/ExpenseList';
import AddExpenseModal from '../components/expense/AddExpenseModal';
import BalancePanel from '../components/trip/BalancePanel';
import ActivityFeed from '../components/trip/ActivityFeed';
import MembersPanel from '../components/trip/MembersPanel';
import TripHeader from '../components/trip/TripHeader';
import TourPlanPanel from '../components/trip/TourPlanPanel';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TABS = [
  { id:'Expenses', icon:'💸' },
  { id:'Balances', icon:'⚖️' },
  { id:'Members',  icon:'👥' },
  { id:'Activity', icon:'📜' },
  { id:'Tour Plan', icon:'🗺️' },
];

export default function TripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinTrip, leaveTrip, on } = useSocket();

  const [trip, setTrip]             = useState(null);
  const [expenses, setExpenses]     = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('Expenses');
  const [showAdd, setShowAdd]       = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [tR, eR, bR, aR] = await Promise.all([
        api.get(`/trips/${id}`),
        api.get(`/expenses/trip/${id}`),
        api.get(`/trips/${id}/balances`),
        api.get(`/trips/${id}/activities`),
      ]);
      setTrip(tR.data.trip);
      setExpenses(eR.data.expenses);
      setBalanceData(bR.data);
      setActivities(aR.data.activities);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        toast.error('Trip not found or access denied.');
        navigate('/dashboard');
      }
    } finally { setLoading(false); }
  }, [id, navigate]);

  const refreshBalances = useCallback(async () => {
    try {
      const [bR, aR] = await Promise.all([
        api.get(`/trips/${id}/balances`),
        api.get(`/trips/${id}/activities`),
      ]);
      setBalanceData(bR.data);
      setActivities(aR.data.activities);
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchAll();
    joinTrip(id);
    return () => leaveTrip(id);
  }, [id]);

  // Socket events
  useEffect(() => {
    const offs = [
      on('expense:added',   ({ expense }) => { setExpenses(p => [expense, ...p]); refreshBalances(); }),
      on('expense:updated', ({ expense }) => { setExpenses(p => p.map(e => e._id===expense._id ? expense : e)); refreshBalances(); }),
      on('expense:deleted', ({ expenseId }) => { setExpenses(p => p.filter(e => e._id!==expenseId)); refreshBalances(); }),
      on('member:joined',   () => fetchAll()),
      on('member:left',     () => fetchAll()),
      on('trip:updated',    ({ trip: t }) => setTrip(t)),
      on('trip:closed',     () => fetchAll()),
      on('trip:locked',     () => fetchAll()),
      on('trip:itinerary-updated', ({ trip: t }) => setTrip(t)),
      on('balance:updated', () => refreshBalances()),
    ];
    return () => offs.forEach(fn => typeof fn==='function' && fn());
  }, [on, refreshBalances, fetchAll]);

  if (loading) return (
    <div className="min-h-screen">
      <Navbar tripStatus={trip?.status} />
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  // Robust isHost check — handles both populated and non-populated states
  const hostId = trip?.host?._id?.toString() || trip?.host?.toString();
  const isHost = hostId === user?._id?.toString();
  const tripActive = trip?.status === 'active';
  const members = trip?.members?.map(m => m.user).filter(Boolean) || [];

  return (
    <div className="min-h-screen">
      <Navbar tripStatus={trip?.status} />
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20">

        <TripHeader
          trip={trip} isHost={isHost}
          expenses={expenses} balanceData={balanceData}
          onTripUpdated={setTrip}
          onTripDeleted={() => navigate('/dashboard')} />

        {/* Tabs */}
        <div className="flex gap-1 mt-4 mb-5 rounded-2xl p-1"
          style={{ background:'rgba(25,30,15,0.04)', border:'1px solid rgba(25,30,15,0.06)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1 px-1 xs:px-2 sm:px-3 py-2 rounded-xl text-[10px] xs:text-xs sm:text-sm font-semibold transition-all duration-200"
              style={activeTab===tab.id ? {
                background:'linear-gradient(135deg,rgba(191,101,77,0.25),rgba(228,139,107,0.15))',
                border:'1px solid rgba(191,101,77,0.3)', color:'#bf654d',
              } : { color:'rgba(25,30,15,0.35)' }}>
              <span className="hidden sm:inline">{tab.icon}</span>
              <span>{tab.id}</span>
            </button>
          ))}
        </div>

        {/* Add expense CTA moved to Navbar */}
        {activeTab==='Expenses' && !tripActive && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm anim-fade-in"
            style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.18)', color:'#fbbf24' }}>
            🔒 Trip is {trip?.status}. No new expenses can be added.
          </div>
        )}

        {/* Tab content */}
        <div className="anim-slide-up">
          {activeTab==='Expenses' && (
            <ExpenseList expenses={expenses} members={members} isHost={isHost}
              tripActive={tripActive} currentUser={user} currency={trip?.currency}
              onDeleted={eid => setExpenses(p => p.filter(e => e._id!==eid))}
              onUpdated={u => setExpenses(p => p.map(e => e._id===u._id ? u : e))} />
          )}
          {activeTab==='Balances' && <BalancePanel balanceData={balanceData} currency={trip?.currency} currentUserId={user?._id} />}
          {activeTab==='Members'  && <MembersPanel trip={trip} isHost={isHost} currentUserId={user?._id} onUpdated={setTrip} />}
          {activeTab==='Activity' && <ActivityFeed activities={activities} />}
          {activeTab==='Tour Plan' && (
            <TourPlanPanel
              trip={trip}
              expenses={expenses}
              tripActive={tripActive}
              onTripUpdated={setTrip}
            />
          )}
        </div>
      </div>

      {/* Sticky Bottom Footer */}
      {tripActive && (
        <div className="fixed bottom-0 left-0 right-0 p-3 z-40 flex items-center justify-center border-t"
             style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(16px)', borderColor: 'var(--nav-border)', boxShadow: '0 -4px 12px rgba(var(--ink-rgb),0.05)' }}>
          <button onClick={() => setShowAdd(true)} className="btn-primary w-full sm:w-auto sm:px-8 py-2 text-sm shadow-md">
            + Add Expense
          </button>
        </div>
      )}

      {showAdd && (
        <AddExpenseModal
          trip={trip} members={members} currentUser={user}
          onClose={() => setShowAdd(false)}
          onAdded={exp => { setExpenses(p => [exp,...p]); setShowAdd(false); refreshBalances(); }} />
      )}
    </div>
  );
}
