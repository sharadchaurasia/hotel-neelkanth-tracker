import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { Booking, DashboardStats } from '../types';
import { ALL_ROOMS, ROOM_TYPE } from '../types';
import { formatCurrency, formatDate, getToday, getCurrentMonth, calculateNights } from '../hooks/useApi';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const emptyBooking = {
  guestName: '', phone: '', pax: 1, kot: '', roomNo: '', noOfRooms: 1,
  roomCategory: '', checkIn: getToday(), checkOut: '', mealPlan: '', source: 'Walk-in',
  sourceName: '', complimentary: '', actualRoomRent: 0, totalAmount: 0,
  paymentType: 'Postpaid', advanceReceived: 0, paymentMode: '', remarks: '',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterDate, setFilterDate] = useState(getToday());
  const [filterViewBy, setFilterViewBy] = useState('checkout');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  // Summary
  const [summaryStart, setSummaryStart] = useState(getCurrentMonth() + '-01');
  const [summaryEnd, setSummaryEnd] = useState(getToday());

  // Modals
  const [bookingModal, setBookingModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyBooking);
  const [collectModal, setCollectModal] = useState(false);
  const [collectBooking, setCollectBooking] = useState<Booking | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectMode, setCollectMode] = useState('');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelAction, setCancelAction] = useState('cancel');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [checkinModal, setCheckinModal] = useState(false);
  const [checkinBooking, setCheckinBooking] = useState<Booking | null>(null);
  const [checkinRooms, setCheckinRooms] = useState<string[]>(['']);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [kotAmount, setKotAmount] = useState(0);
  const [addOns, setAddOns] = useState<{type: string; amount: number}[]>([]);
  const [checkoutPayMode, setCheckoutPayMode] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/bookings/dashboard/stats');
      setStats(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterViewBy) params.set('viewBy', filterViewBy);
      if (filterStatus) params.set('status', filterStatus);
      if (filterSource) params.set('source', filterSource);
      if (filterAgent) params.set('agent', filterAgent);
      const res = await api.get('/bookings?' + params.toString());
      setBookings(res.data);
    } catch { /* ignore */ }
  }, [filterDate, filterViewBy, filterStatus, filterSource, filterAgent]);

  useEffect(() => { fetchDashboard(); fetchBookings(); }, [fetchDashboard, fetchBookings]);

  const refreshAll = () => { fetchDashboard(); fetchBookings(); };

  // Summary calculation
  const summaryBookings = bookings.filter(b => {
    if (b.status === 'CANCELLED') return false;
    return b.checkOut && b.checkOut >= summaryStart && b.checkOut <= summaryEnd;
  });
  const summaryData = summaryBookings.reduce((acc, b) => {
    const total = Number(b.totalAmount) || 0;
    const kotAmt = Number(b.kotAmount) || 0;
    const addOnAmt = (b.addOns || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const baseRoom = Math.max(total - kotAmt - addOnAmt, 0);
    const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
    const pend = Math.max(total - recv, 0);
    return {
      count: acc.count + 1, roomCharge: acc.roomCharge + baseRoom, kot: acc.kot + kotAmt,
      addOn: acc.addOn + addOnAmt, collection: acc.collection + total,
      collected: acc.collected + recv, pending: acc.pending + pend,
    };
  }, { count: 0, roomCharge: 0, kot: 0, addOn: 0, collection: 0, collected: 0, pending: 0 });

  // Booking CRUD
  const openNewBooking = () => {
    setEditId(null);
    setForm({ ...emptyBooking, checkIn: getToday() });
    setBookingModal(true);
  };

  const openEditBooking = (b: Booking) => {
    setEditId(b.id);
    setForm({
      guestName: b.guestName, phone: b.phone || '', pax: b.pax || 1, kot: b.kot || '',
      roomNo: b.roomNo || '', noOfRooms: b.noOfRooms || 1, roomCategory: b.roomCategory || '',
      checkIn: b.checkIn, checkOut: b.checkOut, mealPlan: b.mealPlan || '',
      source: b.source || 'Walk-in', sourceName: b.sourceName || '',
      complimentary: b.complimentary || '', actualRoomRent: Number(b.actualRoomRent) || 0,
      totalAmount: Number(b.totalAmount), paymentType: b.paymentType || 'Postpaid',
      advanceReceived: Number(b.advanceReceived) || 0, paymentMode: b.paymentMode || '',
      remarks: b.remarks || '',
    });
    setBookingModal(true);
  };

  const saveBooking = async () => {
    if (!form.guestName || !form.checkIn || !form.checkOut || !form.totalAmount) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      if (editId) {
        await api.put(`/bookings/${editId}`, form);
        toast.success('Booking updated!');
      } else {
        await api.post('/bookings', form);
        toast.success('Booking added!');
      }
      setBookingModal(false);
      refreshAll();
    } catch { toast.error('Error saving booking'); }
  };

  const deleteBooking = async (id: number) => {
    if (!confirm('Permanently delete this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      toast.success('Booking deleted');
      refreshAll();
    } catch { toast.error('Error deleting booking'); }
  };

  // Collect
  const openCollect = (b: Booking) => {
    const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
    const pend = Number(b.totalAmount) - recv;
    setCollectBooking(b);
    setCollectAmount(pend > 0 ? pend : 0);
    setCollectMode('');
    setCollectModal(true);
  };

  const doCollect = async () => {
    if (!collectBooking || collectAmount <= 0) return;
    try {
      await api.post(`/bookings/${collectBooking.id}/collect`, { amount: collectAmount, paymentMode: collectMode });
      toast.success('Payment collected!');
      setCollectModal(false);
      refreshAll();
    } catch { toast.error('Error collecting payment'); }
  };

  // Cancel/Reschedule
  const openCancel = (b: Booking) => {
    setCancelBooking(b);
    setCancelAction('cancel');
    setRescheduleDate('');
    setCancelModal(true);
  };

  const doCancel = async () => {
    if (!cancelBooking) return;
    try {
      if (cancelAction === 'cancel') {
        await api.post(`/bookings/${cancelBooking.id}/cancel`);
        toast.success('Booking cancelled');
      } else {
        if (!rescheduleDate) { toast.error('Select new date'); return; }
        await api.post(`/bookings/${cancelBooking.id}/reschedule`, { newCheckOut: rescheduleDate });
        toast.success('Booking rescheduled');
      }
      setCancelModal(false);
      refreshAll();
    } catch { toast.error('Error'); }
  };

  // Check-in
  const openCheckin = (b: Booking) => {
    setCheckinBooking(b);
    const existing = (b.roomNo || '').split(',').map(r => r.trim()).filter(Boolean);
    setCheckinRooms(existing.length > 0 ? existing : ['']);
    setCheckinModal(true);
  };

  const doCheckin = async () => {
    if (!checkinBooking) return;
    const rooms = checkinRooms.filter(Boolean);
    if (rooms.length === 0) { toast.error('Select at least one room'); return; }
    try {
      await api.post(`/bookings/${checkinBooking.id}/checkin`, { roomNo: rooms.join(','), noOfRooms: rooms.length });
      toast.success(`${checkinBooking.guestName} checked in!`);
      setCheckinModal(false);
      refreshAll();
    } catch { toast.error('Error'); }
  };

  // Checkout
  const openCheckout = (b: Booking) => {
    setCheckoutBooking(b);
    setKotAmount(Number(b.kotAmount) || 0);
    setAddOns(b.addOns?.map(a => ({ type: a.type, amount: Number(a.amount) })) || []);
    setCheckoutPayMode('');
    setCheckoutModal(true);
  };

  const doCheckout = async () => {
    if (!checkoutBooking) return;
    try {
      await api.post(`/bookings/${checkoutBooking.id}/checkout`, {
        kotAmount, addOns, paymentMode: checkoutPayMode || undefined,
      });
      toast.success('Guest checked out!');
      setCheckoutModal(false);
      refreshAll();
    } catch { toast.error('Error'); }
  };

  const getCheckoutTotals = () => {
    if (!checkoutBooking) return { origTotal: 0, grandTotal: 0, received: 0, balance: 0 };
    const origTotal = Number(checkoutBooking.totalAmount) || 0;
    const addOnTotal = addOns.reduce((s, a) => s + (a.amount || 0), 0);
    const grandTotal = origTotal + kotAmount + addOnTotal;
    const received = (Number(checkoutBooking.advanceReceived) || 0) + (Number(checkoutBooking.balanceReceived) || 0);
    return { origTotal, grandTotal, received, balance: Math.max(grandTotal - received, 0) };
  };

  const renderGuestTable = (title: string, guests: Booking[], type: 'checkin' | 'inhouse' | 'checkout') => {
    return (
      <div className={`guest-list-section ${type === 'checkin' ? 'checkin-section' : type === 'inhouse' ? 'inhouse-section' : 'checkout-section'}`}>
        <div className="section-title">
          <span className="material-icons">{type === 'checkin' ? 'login' : type === 'inhouse' ? 'hotel' : 'logout'}</span>
          {title} ({guests.length})
        </div>
        {guests.length === 0 ? (
          <div className="guest-list-empty">No {type === 'checkin' ? 'check-ins' : type === 'inhouse' ? 'in-house guests' : 'check-outs'} today</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="guest-list-table">
              <thead><tr>
                <th>Guest</th><th>Pax</th><th>Room</th><th>Source</th>
                {type !== 'inhouse' && <th>Collection</th>}
                {type === 'inhouse' && <><th>Check-in</th><th>Checkout</th><th>Collection</th><th>Received</th></>}
                <th>Pending</th><th>Status</th>
                {type !== 'inhouse' && <th>Actions</th>}
              </tr></thead>
              <tbody>
                {guests.map((b) => {
                  const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
                  const pend = Number(b.totalAmount) - recv;
                  const statusClass = b.status === 'COLLECTED' ? 'badge-collected' : b.status === 'PARTIAL' ? 'badge-partial' : 'badge-pending';
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.guestName}</strong>{b.phone && <><br /><small style={{ color: 'var(--text-muted)' }}>{b.phone}</small></>}</td>
                      <td>{b.pax || 1}</td>
                      <td>{b.roomNo ? <strong>{b.roomNo.replace(/,/g, ' / ')}</strong> : <em style={{ color: 'var(--accent-orange)', fontSize: '12px' }}>Not assigned</em>}</td>
                      <td>{b.source}{b.sourceName && <><br /><small>{b.sourceName}</small></>}</td>
                      {type !== 'inhouse' && <td className="amount">{formatCurrency(b.totalAmount)}</td>}
                      {type === 'inhouse' && <><td>{formatDate(b.checkIn)}</td><td>{formatDate(b.checkOut)}</td><td className="amount">{formatCurrency(b.totalAmount)}</td><td className="amount amount-received">{formatCurrency(recv)}</td></>}
                      <td className={`amount ${pend > 0 ? 'amount-pending' : ''}`}>{formatCurrency(pend)}</td>
                      <td><span className={`badge ${statusClass}`}>{b.status}</span></td>
                      {type === 'checkin' && (
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-small" onClick={() => openCheckin(b)}>
                              <span className="material-icons" style={{ fontSize: '14px' }}>login</span> Check-in
                            </button>
                            {pend > 0 && <button className="btn btn-secondary btn-small" onClick={() => openCollect(b)}>Collect</button>}
                          </div>
                        </td>
                      )}
                      {type === 'checkout' && (
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className="btn btn-warning btn-small" onClick={() => openCheckout(b)}>
                              <span className="material-icons" style={{ fontSize: '14px' }}>logout</span> Checkout
                            </button>
                            {pend > 0 && <button className="btn btn-primary btn-small" onClick={() => openCollect(b)}>Collect</button>}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={openNewBooking}>
          <span className="material-icons">add</span> New Booking
        </button>
      </div>

      {/* Guest Lists */}
      <div className="guest-lists">
        {stats && renderGuestTable('Today Check-in', stats.checkinGuests, 'checkin')}
        {stats && renderGuestTable('In-House Guests', stats.inhouseGuests, 'inhouse')}
        {stats && renderGuestTable('Today Check-out', stats.checkoutGuests, 'checkout')}
      </div>

      {/* Stat Cards */}
      {stats && (
        <>
          <div className="dashboard">
            <StatCard label="Today Collection" value={formatCurrency(stats.todayCollectionAmt)} color="blue" />
            <StatCard label="Collected" value={formatCurrency(stats.todayCollectedAmt)} color="green" />
            <StatCard label="Pending" value={formatCurrency(stats.todayPendingAmt)} color="red" />
            <StatCard label="Ledger Due" value={formatCurrency(stats.ledgerDueAmt)} color="orange" />
          </div>
          {stats.todayPendingAmt > 0 && (
            <div className="alert-box">
              <span className="material-icons">warning</span>
              <div><h4>Pending Collection</h4><p>Checkout today: {formatCurrency(stats.todayPendingAmt)} pending</p></div>
            </div>
          )}
          {Object.keys(stats.ledgerByAgent).length > 0 && (
            <div className="ledger-summary">
              <h3><span className="material-icons">account_balance</span> Ledger Due by Agent</h3>
              <div className="ledger-grid">
                {Object.entries(stats.ledgerByAgent).map(([agent, amt]) => (
                  <div className="ledger-item" key={agent}><span className="name">{agent}</span><span className="amount">{formatCurrency(amt)}</span></div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary */}
      <div className="monthly-summary">
        <div className="section-header">
          <h3><span className="material-icons">bar_chart</span> Summary</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input type="date" value={summaryStart} onChange={(e) => setSummaryStart(e.target.value)} className="month-selector" />
            <span>to</span>
            <input type="date" value={summaryEnd} onChange={(e) => setSummaryEnd(e.target.value)} className="month-selector" />
          </div>
        </div>
        <div className="monthly-grid">
          <div className="monthly-card"><div className="mc-label">Bookings</div><div className="mc-value blue">{summaryData.count}</div></div>
          <div className="monthly-card"><div className="mc-label">Room Charge</div><div className="mc-value blue">{formatCurrency(summaryData.roomCharge)}</div></div>
          <div className="monthly-card"><div className="mc-label">KOT</div><div className="mc-value blue">{formatCurrency(summaryData.kot)}</div></div>
          <div className="monthly-card"><div className="mc-label">Add-On</div><div className="mc-value blue">{formatCurrency(summaryData.addOn)}</div></div>
          <div className="monthly-card"><div className="mc-label">Total Collection</div><div className="mc-value blue">{formatCurrency(summaryData.collection)}</div></div>
          <div className="monthly-card"><div className="mc-label">Collected</div><div className="mc-value green">{formatCurrency(summaryData.collected)}</div></div>
          <div className="monthly-card"><div className="mc-label">Pending</div><div className="mc-value red">{formatCurrency(summaryData.pending)}</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>View By</label>
            <select value={filterViewBy} onChange={(e) => setFilterViewBy(e.target.value)}>
              <option value="checkout">Checkout Date</option>
              <option value="checkin">Check-in Date</option>
              <option value="sameday">Same Day</option>
            </select>
          </div>
          <div className="filter-group"><label>Date</label><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /></div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="PENDING">Pending</option><option value="PARTIAL">Partial</option>
              <option value="COLLECTED">Collected</option><option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Source</label>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">All</option>
              <option value="Walk-in">Walk-in</option><option value="OTA">OTA</option><option value="Agent">Agent</option>
            </select>
          </div>
          <div className="filter-group"><label>Agent</label><input type="text" value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} placeholder="Agent name" /></div>
          <button className="btn btn-secondary" onClick={() => { setFilterDate(''); setFilterStatus(''); setFilterSource(''); setFilterAgent(''); }}>Clear</button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-card">
        <div className="table-header">
          <h2>Bookings</h2>
          <span className="record-count">{bookings.length} records</span>
        </div>
        {bookings.length === 0 ? (
          <div className="empty-state"><span className="material-icons">inbox</span><h3>No bookings found</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>ID</th><th>Guest</th><th>Pax</th><th>Room</th><th>Source</th>
                <th>Check-in</th><th>Checkout</th><th>Nights</th><th>Payment</th>
                <th>Rent</th><th>Total</th><th>Received</th><th>Pending</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {bookings.map((b) => {
                  const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
                  const pend = Number(b.totalAmount) - recv;
                  const isCR = b.status === 'CANCELLED' || b.status === 'RESCHEDULED';
                  const sourceClass = b.source === 'Walk-in' ? 'badge-walkin' : b.source === 'OTA' ? 'badge-ota' : 'badge-agent';
                  const statusClass = b.status === 'COLLECTED' ? 'badge-collected' : b.status === 'PARTIAL' ? 'badge-partial' : b.status === 'CANCELLED' ? 'badge-cancelled' : b.status === 'RESCHEDULED' ? 'badge-rescheduled' : 'badge-pending';
                  return (
                    <tr key={b.id} style={isCR ? { opacity: 0.6 } : undefined}>
                      <td><strong>{b.bookingId}</strong></td>
                      <td><div className="guest-info"><div className="name">{b.guestName}{b.kot === 'Yes' && <span className="badge-kot">KOT</span>}</div>{b.phone && <div className="phone">{b.phone}</div>}</div></td>
                      <td>{b.pax || 1}</td>
                      <td>{b.roomNo ? <strong>{b.roomNo.replace(/,/g, ' / ')}</strong> : <em style={{ color: 'var(--accent-orange)', fontSize: '12px' }}>Not assigned</em>}</td>
                      <td><span className={`badge ${sourceClass}`}>{b.source}</span>{b.sourceName && <><br /><small style={{ color: 'var(--text-muted)' }}>{b.sourceName}</small></>}</td>
                      <td>{formatDate(b.checkIn)}</td>
                      <td><strong>{formatDate(b.checkOut)}</strong>{b.rescheduledFrom && <><br /><small style={{ color: 'var(--text-muted)' }}>was {formatDate(b.rescheduledFrom)}</small></>}</td>
                      <td><strong>{calculateNights(b.checkIn, b.checkOut)}</strong></td>
                      <td><span className="payment-type">{b.paymentType}</span></td>
                      <td className="amount">{formatCurrency(b.actualRoomRent)}</td>
                      <td className="amount">{formatCurrency(b.totalAmount)}</td>
                      <td className="amount amount-received">{formatCurrency(recv)}</td>
                      <td className={`amount ${pend > 0 ? 'amount-pending' : ''}`}>{formatCurrency(pend)}</td>
                      <td><span className={`badge ${statusClass}`}>{b.status}</span></td>
                      <td>
                        <div className="actions">
                          {!isCR && pend > 0 && <button className="btn btn-primary btn-small" onClick={() => openCollect(b)}>Collect</button>}
                          {!isCR && <button className="btn btn-warning btn-small" onClick={() => openCheckout(b)}><span className="material-icons" style={{ fontSize: '14px' }}>logout</span></button>}
                          {!isCR && <button className="btn btn-secondary btn-small" onClick={() => openEditBooking(b)}>Edit</button>}
                          {!isCR && <button className="btn btn-danger btn-small" onClick={() => openCancel(b)}>Cancel</button>}
                          <button className="btn btn-danger btn-small" onClick={() => deleteBooking(b.id)} title="Delete"><span className="material-icons" style={{ fontSize: '14px' }}>delete</span></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Modal open={bookingModal} onClose={() => setBookingModal(false)} title={editId ? 'Edit Booking' : 'New Booking'}
        footer={<><button className="btn btn-secondary" onClick={() => setBookingModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveBooking}><span className="material-icons">save</span> Save</button></>}>
        <div className="form-row">
          <div className="form-group"><label>Guest Name *</label><input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Pax</label><input type="number" min="1" value={form.pax} onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })} /></div>
          <div className="form-group"><label>KOT</label><select value={form.kot} onChange={(e) => setForm({ ...form, kot: e.target.value })}><option value="">No</option><option value="Yes">Yes</option></select></div>
          <div className="form-group"><label>No. of Rooms</label><input type="number" min="1" value={form.noOfRooms} onChange={(e) => setForm({ ...form, noOfRooms: Number(e.target.value) })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Room No</label><input value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} placeholder="e.g. 201,202" /></div>
          <div className="form-group"><label>Room Category</label>
            <select value={form.roomCategory} onChange={(e) => setForm({ ...form, roomCategory: e.target.value })}>
              <option value="">Select</option><option value="Non-Balcony">Non-Balcony</option><option value="Balcony">Balcony</option>
              <option value="Mini Family">Mini Family</option><option value="Royal Suite Duplex">Royal Suite Duplex</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Check-in *</label><input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
          <div className="form-group"><label>Check-out *</label><input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
          {form.checkIn && form.checkOut && <div className="form-group"><label>Nights</label><input readOnly value={calculateNights(form.checkIn, form.checkOut)} /></div>}
        </div>
        <div className="form-row">
          <div className="form-group"><label>Meal Plan</label>
            <select value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })}>
              <option value="">Select</option><option value="EP">EP</option><option value="CP">CP</option><option value="MAP">MAP</option><option value="AP">AP</option>
            </select>
          </div>
          <div className="form-group"><label>Source</label>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="Walk-in">Walk-in</option><option value="OTA">OTA</option><option value="Agent">Agent</option>
            </select>
          </div>
          {(form.source === 'OTA' || form.source === 'Agent') && (
            <div className="form-group"><label>Source Name</label><input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} /></div>
          )}
        </div>
        <div className="form-row">
          <div className="form-group"><label>Complimentary</label><input value={form.complimentary} onChange={(e) => setForm({ ...form, complimentary: e.target.value })} /></div>
          <div className="form-group"><label>Actual Room Rent</label><input type="number" value={form.actualRoomRent || ''} onChange={(e) => setForm({ ...form, actualRoomRent: Number(e.target.value) })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Total Amount *</label><input type="number" value={form.totalAmount || ''} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} /></div>
          <div className="form-group"><label>Payment Type</label>
            <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}>
              <option value="Postpaid">Postpaid</option><option value="Prepaid">Prepaid</option><option value="Ledger">Ledger</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Advance Received</label><input type="number" value={form.advanceReceived || ''} onChange={(e) => setForm({ ...form, advanceReceived: Number(e.target.value) })} /></div>
          <div className="form-group"><label>Payment Mode</label>
            <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
              <option value="">Select</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label>Remarks</label><input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
      </Modal>

      {/* Collect Modal */}
      <Modal open={collectModal} onClose={() => setCollectModal(false)} title="Collect Payment"
        footer={<><button className="btn btn-secondary" onClick={() => setCollectModal(false)}>Cancel</button><button className="btn btn-primary" onClick={doCollect}>Collect</button></>}>
        {collectBooking && (
          <>
            <p style={{ marginBottom: '16px' }}>Pending: <strong style={{ color: 'var(--accent-red)' }}>{formatCurrency(Number(collectBooking.totalAmount) - (Number(collectBooking.advanceReceived) || 0) - (Number(collectBooking.balanceReceived) || 0))}</strong></p>
            <div className="form-group"><label>Amount</label><input type="number" value={collectAmount} onChange={(e) => setCollectAmount(Number(e.target.value))} /></div>
            <div className="form-group" style={{ marginTop: '12px' }}><label>Payment Mode</label>
              <select value={collectMode} onChange={(e) => setCollectMode(e.target.value)}>
                <option value="">Select</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </>
        )}
      </Modal>

      {/* Cancel/Reschedule Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel / Reschedule"
        footer={<><button className="btn btn-secondary" onClick={() => setCancelModal(false)}>Close</button>
          <button className={cancelAction === 'cancel' ? 'btn btn-danger' : 'btn btn-warning'} onClick={doCancel}>
            {cancelAction === 'cancel' ? 'Cancel Booking' : 'Reschedule'}
          </button></>}>
        {cancelBooking && (
          <>
            <p><strong>{cancelBooking.guestName}</strong> ({cancelBooking.bookingId}) — Checkout: {formatDate(cancelBooking.checkOut)}</p>
            <div className="form-group" style={{ marginTop: '16px' }}><label>Action</label>
              <select value={cancelAction} onChange={(e) => setCancelAction(e.target.value)}>
                <option value="cancel">Cancel</option><option value="reschedule">Reschedule</option>
              </select>
            </div>
            {cancelAction === 'reschedule' && (
              <div className="form-group" style={{ marginTop: '12px' }}><label>New Checkout Date</label><input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} /></div>
            )}
          </>
        )}
      </Modal>

      {/* Check-in Modal */}
      <Modal open={checkinModal} onClose={() => setCheckinModal(false)} title="Check-in & Room Allotment"
        footer={<><button className="btn btn-secondary" onClick={() => setCheckinModal(false)}>Cancel</button><button className="btn btn-primary" onClick={doCheckin}>Confirm Check-in</button></>}>
        {checkinBooking && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div><small style={{ color: 'var(--text-muted)' }}>Guest</small><br /><strong>{checkinBooking.guestName}</strong></div>
              <div><small style={{ color: 'var(--text-muted)' }}>Pax</small><br /><strong>{checkinBooking.pax || 1}</strong></div>
              <div><small style={{ color: 'var(--text-muted)' }}>Check-in</small><br />{formatDate(checkinBooking.checkIn)}</div>
              <div><small style={{ color: 'var(--text-muted)' }}>Check-out</small><br />{formatDate(checkinBooking.checkOut)}</div>
            </div>
            {checkinRooms.map((rm, i) => (
              <div className="form-group" key={i} style={{ marginBottom: '8px' }}>
                <label>Room {i + 1}</label>
                <select value={rm} onChange={(e) => { const nr = [...checkinRooms]; nr[i] = e.target.value; setCheckinRooms(nr); }}>
                  <option value="">Select Room</option>
                  {ALL_ROOMS.map(r => <option key={r} value={r}>{r} - {ROOM_TYPE[r] || ''}</option>)}
                </select>
              </div>
            ))}
            <button className="btn btn-secondary btn-small" onClick={() => setCheckinRooms([...checkinRooms, ''])} style={{ marginTop: '8px' }}>+ Add Room</button>
          </>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal open={checkoutModal} onClose={() => setCheckoutModal(false)} title="Checkout" wide
        footer={<><button className="btn btn-secondary" onClick={() => setCheckoutModal(false)}>Cancel</button><button className="btn btn-warning" onClick={doCheckout}><span className="material-icons">logout</span> Process Checkout</button></>}>
        {checkoutBooking && (() => {
          const t = getCheckoutTotals();
          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <div><small style={{ color: 'var(--text-muted)' }}>Guest</small><br /><strong>{checkoutBooking.guestName}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Room</small><br /><strong>{checkoutBooking.roomNo || 'N/A'}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Check-in</small><br />{formatDate(checkoutBooking.checkIn)}</div>
                <div><small style={{ color: 'var(--text-muted)' }}>Check-out</small><br />{formatDate(checkoutBooking.checkOut)}</div>
              </div>
              <div className="form-group"><label>KOT Amount</label><input type="number" value={kotAmount || ''} onChange={(e) => setKotAmount(Number(e.target.value))} /></div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontWeight: 600 }}>Add-On Charges</label>
                {addOns.map((ao, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <select value={ao.type} onChange={(e) => { const na = [...addOns]; na[i].type = e.target.value; setAddOns(na); }} style={{ flex: 1, padding: '8px', border: '1px solid var(--input-border)', borderRadius: '8px' }}>
                      <option value="">Select</option><option value="Heater">Heater</option><option value="Bonfire">Bonfire</option><option value="BJ">BJ</option>
                      <option value="Honeymoon">Honeymoon</option><option value="Birthday">Birthday</option><option value="DJ">DJ</option><option value="Cake">Cake</option><option value="Other">Other</option>
                    </select>
                    <input type="number" placeholder="Amount" value={ao.amount || ''} onChange={(e) => { const na = [...addOns]; na[i].amount = Number(e.target.value); setAddOns(na); }} style={{ width: '120px', padding: '8px', border: '1px solid var(--input-border)', borderRadius: '8px' }} />
                    <button onClick={() => setAddOns(addOns.filter((_, j) => j !== i))} style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer' }}>
                      <span className="material-icons" style={{ fontSize: '16px', color: 'var(--accent-red)' }}>close</span>
                    </button>
                  </div>
                ))}
                <button className="btn btn-secondary btn-small" style={{ marginTop: '8px' }} onClick={() => setAddOns([...addOns, { type: '', amount: 0 }])}>+ Add Charge</button>
              </div>
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Original Total</span><strong>{formatCurrency(t.origTotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>KOT</span><strong>{formatCurrency(kotAmount)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Add-Ons</span><strong>{formatCurrency(addOns.reduce((s, a) => s + (a.amount || 0), 0))}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700, fontSize: '16px', borderTop: '2px solid var(--accent-cyan)', paddingTop: '8px' }}><span>Grand Total</span><strong>{formatCurrency(t.grandTotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--accent-green)' }}><span>Received</span><strong>{formatCurrency(t.received)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-red)', fontWeight: 700 }}><span>Balance</span><strong>{formatCurrency(t.balance)}</strong></div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}><label>Collect Balance Via</label>
                <select value={checkoutPayMode} onChange={(e) => setCheckoutPayMode(e.target.value)}>
                  <option value="">Don't collect now</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
