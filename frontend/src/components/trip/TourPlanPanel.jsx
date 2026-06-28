import { useMemo, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const CATEGORIES = [
  { id: 'sightseeing', icon: '🏛️', label: 'Sightseeing' },
  { id: 'food', icon: '🍽️', label: 'Food' },
  { id: 'hotel', icon: '🏨', label: 'Hotel' },
  { id: 'transport', icon: '🚌', label: 'Transport' },
  { id: 'activity', icon: '🎟️', label: 'Activity' },
  { id: 'other', icon: '📍', label: 'Other' },
];

const categoryMap = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, cat]));

const cleanId = (value) => (typeof value === 'object' ? value?._id : value) || '';

const toInputDate = (date) => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const formatDate = (date) => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatTime = (time) => {
  if (!time) return '';
  const [hh, mm] = time.split(':');
  const hour = Number(hh);
  if (Number.isNaN(hour)) return time;
  return `${hour % 12 || 12}:${mm || '00'} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const normalizeDays = (days = []) => days.map((day) => ({
  _id: day._id,
  label: day.label || '',
  date: toInputDate(day.date),
  stops: (day.stops || []).map((stop) => ({
    _id: stop._id,
    name: stop.name || '',
    time: stop.time || '',
    category: stop.category || 'sightseeing',
    notes: stop.notes || '',
    expense: cleanId(stop.expense),
    completed: Boolean(stop.completed),
  })),
}));

export default function TourPlanPanel({ trip, expenses, tripActive, onTripUpdated }) {
  const [openDays, setOpenDays] = useState(() => new Set((trip?.itinerary?.days || []).map((day) => day._id)));
  const [dayModal, setDayModal] = useState(null);
  const [stopModal, setStopModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => normalizeDays(trip?.itinerary?.days || []), [trip?.itinerary?.days]);
  const canEdit = trip?.status !== 'closed';

  const expenseById = useMemo(() => {
    const entries = expenses.map((expense) => [expense._id, expense]);
    return Object.fromEntries(entries);
  }, [expenses]);

  const saveDays = async (nextDays, message) => {
    setSaving(true);
    try {
      const res = await api.patch(`/trips/${trip._id}/itinerary`, { days: nextDays });
      onTripUpdated(res.data.trip);
      toast.success(message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update tour plan.');
    } finally {
      setSaving(false);
    }
  };

  const openDayForm = (day = null, index = null) => {
    setDayModal({
      index,
      label: day?.label || '',
      date: day?.date || '',
    });
  };

  const saveDay = async (event) => {
    event.preventDefault();
    const label = dayModal.label.trim();
    if (!label) return toast.error('Day label is required.');
    const nextDays = [...days];
    const payload = { label, date: dayModal.date || undefined, stops: [] };
    if (dayModal.index === null) {
      nextDays.push(payload);
    } else {
      nextDays[dayModal.index] = { ...nextDays[dayModal.index], label, date: dayModal.date || undefined };
    }
    setDayModal(null);
    await saveDays(nextDays, dayModal.index === null ? 'Day added.' : 'Day updated.');
  };

  const deleteDay = async (index) => {
    const nextDays = days.filter((_, i) => i !== index);
    await saveDays(nextDays, 'Day removed.');
  };

  const openStopForm = (dayIndex, stop = null, stopIndex = null) => {
    setStopModal({
      dayIndex,
      stopIndex,
      name: stop?.name || '',
      time: stop?.time || '',
      category: stop?.category || 'sightseeing',
      notes: stop?.notes || '',
      expense: stop?.expense || '',
      completed: stop?.completed || false,
    });
  };

  const saveStop = async (event) => {
    event.preventDefault();
    const name = stopModal.name.trim();
    if (!name) return toast.error('Stop name is required.');
    const nextDays = [...days];
    const day = { ...nextDays[stopModal.dayIndex], stops: [...nextDays[stopModal.dayIndex].stops] };
    const payload = {
      name,
      time: stopModal.time,
      category: stopModal.category,
      notes: stopModal.notes.trim(),
      expense: stopModal.expense || null,
      completed: stopModal.completed || false,
    };

    if (stopModal.stopIndex === null) {
      day.stops.push(payload);
    } else {
      day.stops[stopModal.stopIndex] = { ...day.stops[stopModal.stopIndex], ...payload };
    }

    nextDays[stopModal.dayIndex] = day;
    setStopModal(null);
    await saveDays(nextDays, stopModal.stopIndex === null ? 'Stop added.' : 'Stop updated.');
  };

  const deleteStop = async (dayIndex, stopIndex) => {
    const nextDays = [...days];
    nextDays[dayIndex] = {
      ...nextDays[dayIndex],
      stops: nextDays[dayIndex].stops.filter((_, i) => i !== stopIndex),
    };
    await saveDays(nextDays, 'Stop removed.');
  };

  const toggleStopCompleted = async (dayIndex, stopIndex) => {
    const nextDays = [...days];
    const day = { ...nextDays[dayIndex], stops: [...nextDays[dayIndex].stops] };
    const stop = day.stops[stopIndex];
    const isCompleted = !stop.completed;
    day.stops[stopIndex] = {
      ...stop,
      completed: isCompleted,
    };
    nextDays[dayIndex] = day;
    await saveDays(nextDays, isCompleted ? 'Stop completed.' : 'Stop marked active.');
  };

  const toggleDay = (dayId) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans,sans-serif' }}>Tour Plan</h2>
            <p className="text-sm text-white/40">Build the itinerary day by day and link stops to trip expenses.</p>
          </div>
          {canEdit && (
            <button onClick={() => openDayForm()} disabled={saving} className="btn-primary">
              + Add Day
            </button>
          )}
        </div>

        {!tripActive && trip?.status === 'closed' && (
          <div className="px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', color: '#fbbf24' }}>
            This trip is closed. The tour plan is read-only.
          </div>
        )}

        {!days.length ? (
          <div className="card text-center py-12">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-xl font-bold mb-4"
              style={{ background: 'rgba(var(--brand-rgb),0.12)', color: 'var(--brand-hex)' }}>
              TP
            </div>
            <h3 className="text-base font-bold text-white mb-1">No tour plan yet</h3>
            <p className="text-sm text-white/40 mb-5">Add Day 1, then add hotel, transport, food, and sightseeing stops.</p>
            {canEdit && <button onClick={() => openDayForm()} className="btn-primary mx-auto">+ Plan Day 1</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {days.map((day, dayIndex) => {
              const dayKey = day._id || `${day.label}-${dayIndex}`;
              const isOpen = openDays.has(dayKey) || !day._id;
              return (
                <div key={dayKey} className="card p-0 overflow-hidden">
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 hover:bg-white/5 transition-all">
                    <div onClick={() => toggleDay(dayKey)} className="flex flex-1 items-center gap-4 min-w-0 cursor-pointer w-full">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
                        style={{ background: 'var(--gradient-warm)' }}>
                        {dayIndex + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-white truncate">Day {dayIndex + 1}: {day.label}</span>
                        <span className="block text-xs text-white/35">{formatDate(day.date) || 'No date'} · {day.stops.length} stop{day.stops.length === 1 ? '' : 's'}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 shrink-0 w-full sm:w-auto mt-2.5 sm:mt-0">
                      {canEdit && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openStopForm(dayIndex)}
                            className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                            style={{ background:'rgba(25,30,15,0.06)', border:'1px solid rgba(25,30,15,0.1)', color:'rgba(25,30,15,0.6)' }}
                            title="Add Stop">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Add Stop</span>
                          </button>
                          <button onClick={() => openDayForm(day, dayIndex)}
                            className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                            style={{ background:'rgba(25,30,15,0.06)', border:'1px solid rgba(25,30,15,0.1)', color:'rgba(25,30,15,0.6)' }}
                            title="Edit Day">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button onClick={() => deleteDay(dayIndex)}
                            className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                            style={{ background:'rgba(214,63,63,0.06)', border:'1px solid rgba(214,63,63,0.15)', color:'#d63f3f' }}
                            title="Delete Day">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      )}
                      <button onClick={() => toggleDay(dayKey)}
                        className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                        style={{ background:'rgba(25,30,15,0.06)', border:'1px solid rgba(25,30,15,0.1)', color:'rgba(25,30,15,0.6)' }}
                        title={isOpen ? "Collapse" : "Expand"}>
                        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span>{isOpen ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3">
                      {day.stops.map((stop, stopIndex) => {
                        const cat = categoryMap[stop.category] || categoryMap.other;
                        const expense = expenseById[stop.expense];
                        return (
                          <div key={stop._id || `${stop.name}-${stopIndex}`} className={`tour-stop-card flex items-start gap-4 rounded-xl p-3 transition-opacity duration-200 ${stop.completed ? 'opacity-60' : ''}`}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                              style={stop.completed ? { background: 'rgba(var(--success-rgb),0.12)', color: 'var(--success-hex)' } : { background: 'rgba(var(--brand-rgb),0.12)', color: 'var(--brand-hex)' }}>
                              {stop.completed ? '✓' : cat.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <h4 className={`text-sm font-bold transition-all ${stop.completed ? 'line-through text-white/40' : 'text-white'}`}>{stop.name}</h4>
                                <span className="text-xs font-semibold text-white/35">{cat.label}</span>
                              </div>
                              <div className={`text-xs mt-1 transition-all ${stop.completed ? 'text-white/20' : 'text-white/35'}`}>
                                {formatTime(stop.time) || 'Any time'}
                                {expense ? ` · ${expense.title} (${trip.currency} ${expense.amount})` : ''}
                              </div>
                              {stop.notes && <p className={`text-xs mt-1 transition-all ${stop.completed ? 'text-white/25' : 'text-white/45'}`}>{stop.notes}</p>}
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => toggleStopCompleted(dayIndex, stopIndex)}
                                  className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                                  style={stop.completed ? {
                                    background: 'rgba(16,185,129,0.06)',
                                    border: '1px solid rgba(16,185,129,0.18)',
                                    color: '#10b981'
                                  } : {
                                    background: 'rgba(25,30,15,0.06)',
                                    border: '1px solid rgba(25,30,15,0.1)',
                                    color: 'rgba(25,30,15,0.6)'
                                  }}
                                  title={stop.completed ? "Mark Active" : "Mark Completed"}>
                                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="hidden sm:inline">{stop.completed ? 'Done' : 'Complete'}</span>
                                </button>
                                <button onClick={() => openStopForm(dayIndex, stop, stopIndex)}
                                  className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                                  style={{ background: 'rgba(25,30,15,0.06)', border: '1px solid rgba(25,30,15,0.1)', color: 'rgba(25,30,15,0.6)' }}
                                  title="Edit Stop">
                                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button onClick={() => deleteStop(dayIndex, stopIndex)}
                                  className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                                  style={{ background: 'rgba(214,63,63,0.06)', border: '1px solid rgba(214,63,63,0.15)', color: '#d63f3f' }}
                                  title="Delete Stop">
                                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!day.stops.length && (
                        <p className="text-xs text-white/35 text-center py-3">No stops added yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dayModal && (
        <Modal title={dayModal.index === null ? 'Add Day' : 'Edit Day'} onClose={() => setDayModal(null)}>
          <form onSubmit={saveDay} className="space-y-4">
            <div>
              <label className="label">Day label</label>
              <input className="input" value={dayModal.label}
                onChange={(e) => setDayModal((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Cox's Bazar beach day" autoFocus />
            </div>
            <div>
              <label className="label">Date optional</label>
              <input className="input" type="date" value={dayModal.date}
                onChange={(e) => setDayModal((prev) => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDayModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Day'}</button>
            </div>
          </form>
        </Modal>
      )}

      {stopModal && (
        <Modal title={stopModal.stopIndex === null ? 'Add Stop' : 'Edit Stop'} onClose={() => setStopModal(null)} size="lg">
          <form onSubmit={saveStop} className="space-y-4">
            <div>
              <label className="label">Stop name</label>
              <input className="input" value={stopModal.name}
                onChange={(e) => setStopModal((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Hotel check-in, lunch, viewpoint..." autoFocus />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Time optional</label>
                <input className="input" type="time" value={stopModal.time}
                  onChange={(e) => setStopModal((prev) => ({ ...prev, time: e.target.value }))} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={stopModal.category}
                  onChange={(e) => setStopModal((prev) => ({ ...prev, category: e.target.value }))}>
                  {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Linked expense optional</label>
              <select className="input" value={stopModal.expense}
                onChange={(e) => setStopModal((prev) => ({ ...prev, expense: e.target.value }))}>
                <option value="">No linked expense</option>
                {expenses.map((expense) => (
                  <option key={expense._id} value={expense._id}>
                    {expense.title} - {trip.currency} {expense.amount}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes optional</label>
              <textarea className="input min-h-[90px]" value={stopModal.notes}
                onChange={(e) => setStopModal((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Booking info, meeting point, reminders..." />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStopModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Stop'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
