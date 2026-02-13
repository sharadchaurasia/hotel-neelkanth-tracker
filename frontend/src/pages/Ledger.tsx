import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import type { Booking } from '../types';
import { formatCurrency, formatDate } from '../hooks/useApi';

interface AksOfficePayment {
  id: number;
  refBookingId: string;
  guestName: string;
  roomNo: string;
  amount: number;
  subCategory: string;
  date: string;
  context: string;
  createdBy: string;
}

export default function Ledger() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [aksPayments, setAksPayments] = useState<AksOfficePayment[]>([]);
  const [editingPayment, setEditingPayment] = useState<number | null>(null);
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editHotelShare, setEditHotelShare] = useState(0);
  const [editCollections, setEditCollections] = useState<Array<{
    amount: number;
    paymentMode: string;
    type: string;
    subCategory: string;
    date: string;
  }>>([{ amount: 0, paymentMode: '', type: 'Room Rent', subCategory: '', date: new Date().toISOString().split('T')[0] }]);

  useEffect(() => {
    // Fetch all agents from agents master table
    api.get('/agents').then(res => {
      const names = res.data.map((a: any) => a.name);
      setAgents(names.sort());
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (agent) params.set('agent', agent);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api.get('/reports/ledger?' + params).then(res => {
      const data = res.data;
      setBookings(data.bookings || data);
    }).catch(() => {});
  }, [agent, from, to]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api.get('/bookings/aks-office-payments?' + params).then(res => {
      setAksPayments(res.data);
    }).catch(() => {});
  }, [from, to]);

  const handleEditSubCategory = (payment: AksOfficePayment) => {
    setEditingPayment(payment.id);
    setEditSubCategory(payment.subCategory || '');
  };

  const handleSaveSubCategory = async (paymentId: number) => {
    if (!editSubCategory) {
      toast.error('Please select a sub-category');
      return;
    }
    try {
      await api.patch(`/bookings/aks-office-payments/${paymentId}`, { subCategory: editSubCategory });
      toast.success('Sub-category updated successfully');
      setEditingPayment(null);
      // Refresh AKS payments
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get('/bookings/aks-office-payments?' + params);
      setAksPayments(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update sub-category');
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditHotelShare(Number(booking.hotelShare) || 0);
    const totalCollection = (Number(booking.advanceReceived) || 0) + (Number(booking.balanceReceived) || 0);
    setEditCollections([{
      amount: totalCollection,
      paymentMode: '', // Always start with empty selection for fresh choice
      type: 'Room Rent',
      subCategory: '',
      date: new Date().toISOString().split('T')[0]
    }]);
    setEditModal(true);
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;
    const bookingId = editingBooking.id;
    // Validate collections
    for (const col of editCollections) {
      if (!col.amount || col.amount <= 0) {
        toast.error('Please enter valid amount for all collections');
        return;
      }
      if (!col.date) {
        toast.error('Please select date for all collections');
        return;
      }
      if (!col.paymentMode) {
        toast.error('Please select payment mode for all collections');
        return;
      }
      if (col.paymentMode === 'AKS Office' && !col.subCategory) {
        toast.error('Please select sub-category for AKS Office payments');
        return;
      }
    }

    try {
      // Backend should handle:
      // 1. AKS Office payments → Count as zero in ledger & daybook (no entry)
      // 2. KOT/Add-on → Create daybook income entry with specified date
      // 3. Room Rent → Normal collection handling
      await api.put(`/bookings/${bookingId}`, {
        hotelShare: editHotelShare,
        collections: editCollections
      });
      toast.success('Booking updated successfully');
      setEditModal(false);
      setEditingBooking(null);
      setEditCollections([{ amount: 0, paymentMode: '', type: 'Room Rent', subCategory: '', date: new Date().toISOString().split('T')[0] }]);
      // Refresh bookings
      const params = new URLSearchParams();
      if (agent) params.set('agent', agent);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get('/reports/ledger?' + params);
      setBookings(res.data.bookings || res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const addCollectionEntry = () => {
    // Calculate remaining balance
    const totalEntered = editCollections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const remaining = Math.max(0, editHotelShare - totalEntered);

    setEditCollections([...editCollections, {
      amount: remaining, // Auto-fill remaining balance
      paymentMode: '',
      type: 'Room Rent',
      subCategory: '',
      date: new Date().toISOString().split('T')[0]
    }]);
  };

  const removeCollectionEntry = (index: number) => {
    if (editCollections.length > 1) {
      setEditCollections(editCollections.filter((_, i) => i !== index));
    }
  };

  const updateCollectionEntry = (index: number, field: string, value: any) => {
    const updated = [...editCollections];
    updated[index] = { ...updated[index], [field]: value };
    setEditCollections(updated);
  };

  const agentSums: Record<string, { total: number; received: number; pending: number; count: number }> = {};
  const grandTotal = { total: 0, received: 0, pending: 0, count: 0 };

  bookings.forEach(b => {
    const name = b.sourceName || 'Unknown';
    if (!agentSums[name]) agentSums[name] = { total: 0, received: 0, pending: 0, count: 0 };
    const hotelShare = Number(b.hotelShare) || 0;
    const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
    const pend = hotelShare - recv; // Can be negative (extra) or positive (pending)
    agentSums[name].total += hotelShare;
    agentSums[name].received += recv;
    agentSums[name].pending += pend;
    agentSums[name].count++;
    grandTotal.total += hotelShare;
    grandTotal.received += recv;
    grandTotal.pending += pend;
    grandTotal.count++;
  });

  // Calculate AKS Office totals by sub-category
  const aksSums: Record<string, { amount: number; count: number }> = {};
  const aksGrandTotal = { amount: 0, count: 0 };
  aksPayments.forEach(p => {
    const cat = p.subCategory || 'Unassigned';
    if (!aksSums[cat]) aksSums[cat] = { amount: 0, count: 0 };
    aksSums[cat].amount += Number(p.amount);
    aksSums[cat].count++;
    aksGrandTotal.amount += Number(p.amount);
    aksGrandTotal.count++;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">account_balance</span>
          {agent ? `${agent} - Ledger` : 'All Agents - Ledger'}
        </h2>
        <button
          onClick={() => navigate('/agent-ledger')}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>assessment</span>
          Agent Ledger Report
        </button>
      </div>

      {/* Filters Card */}
      <div className="filters-card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <span className="material-icons">filter_list</span>
          Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Agent</label>
            <select value={agent} onChange={(e) => setAgent(e.target.value)}>
              <option value="">All Agents</option>
              {agents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>From Date</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>To Date</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="monthly-grid">
        {agent ? (
          <>
            <div className="monthly-card"><div className="mc-label">{agent} — Bookings</div><div className="mc-value blue">{grandTotal.count}</div></div>
            <div className="monthly-card"><div className="mc-label">Hotel Share</div><div className="mc-value blue">{formatCurrency(grandTotal.total)}</div></div>
            <div className="monthly-card"><div className="mc-label">Total Collection</div><div className="mc-value green">{formatCurrency(grandTotal.received)}</div></div>
            <div className="monthly-card"><div className="mc-label">Total Pending</div><div className={`mc-value ${grandTotal.pending > 0 ? 'red' : grandTotal.pending < 0 ? 'green' : 'blue'}`}>{formatCurrency(Math.abs(grandTotal.pending))}{grandTotal.pending < 0 ? ' (extra)' : ''}</div></div>
          </>
        ) : (
          Object.entries(agentSums).sort(([, a], [, b]) => b.pending - a.pending).map(([name, s]) => (
            <div className="monthly-card" key={name}>
              <div className="mc-label">{name} ({s.count})</div>
              <div className={`mc-value ${s.pending > 0 ? 'red' : s.pending < 0 ? 'green' : 'blue'}`}>{formatCurrency(Math.abs(s.pending))}{s.pending < 0 ? ' (extra)' : ''}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Hotel Share: {formatCurrency(s.total)} | Collected: {formatCurrency(s.received)}</div>
            </div>
          ))
        )}
      </div>

      {/* Detail Table */}
      {bookings.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No bookings found for selected filters</p>
      ) : (
        <div className="table-card">
          <div className="table-header">
            <span className="material-icons">list_alt</span>
            Booking Details
          </div>
          <table className="report-table">
            <thead><tr><th>ID</th><th>Guest</th><th>Agent</th><th>Room</th><th>Check-in</th><th>Checkout</th><th>Hotel Share</th><th>Total Collection</th><th>Total Pending</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {bookings.map(b => {
                const hotelShare = (Number(b.hotelShare) || 0);
                const totalCollection = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
                const totalPending = hotelShare - totalCollection;
                const statusClass = b.status === 'COLLECTED' ? 'badge-collected' : b.status === 'PARTIAL' ? 'badge-partial' : 'badge-pending';

                // Find AKS Office payments for this booking
                const aksPaymentsForBooking = aksPayments.filter(p => p.refBookingId === b.bookingId);
                const aksTotal = aksPaymentsForBooking.reduce((sum, p) => sum + Number(p.amount), 0);
                const aksSubCategories = [...new Set(aksPaymentsForBooking.map(p => p.subCategory).filter(Boolean))].join(', ');

                return (
                  <tr key={b.id}>
                    <td><strong>{b.bookingId}</strong></td>
                    <td>{b.guestName}</td>
                    <td>{b.sourceName || '-'}</td>
                    <td>{b.roomNo || '-'}</td>
                    <td>{formatDate(b.checkIn)}</td>
                    <td>{formatDate(b.checkOut)}</td>
                    <td className="amount" style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>
                      {formatCurrency(hotelShare)}
                    </td>
                    <td className="amount amount-received">{formatCurrency(totalCollection)}</td>
                    <td className={`amount ${totalPending > 0 ? 'amount-pending' : totalPending < 0 ? 'amount-received' : ''}`}>
                      {formatCurrency(Math.abs(totalPending))}
                      {totalPending < 0 && <span style={{ fontSize: '11px', marginLeft: '4px' }}>(extra)</span>}
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>{b.status}</span>
                      {totalCollection > 0 ? (
                        // Show payment mode if collection at hotel
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#6b7280' }}>
                          ({b.balancePaymentMode || b.paymentMode || 'Cash'}) {formatCurrency(totalCollection)}
                        </div>
                      ) : aksPaymentsForBooking.length > 0 ? (
                        // Show AKS Office if no collection at hotel
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#6b7280' }}>
                          AKS Office ({aksSubCategories}) {formatCurrency(aksTotal)}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <button
                        onClick={() => handleEditBooking(b)}
                        className="btn-icon btn-primary"
                        title="Edit Booking"
                      >
                        <span className="material-icons">edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td colSpan={6}>TOTAL ({grandTotal.count} bookings)</td>
                <td className="amount">{formatCurrency(grandTotal.total)}</td>
                <td className="amount amount-received">{formatCurrency(grandTotal.received)}</td>
                <td className={`amount ${grandTotal.pending > 0 ? 'amount-pending' : grandTotal.pending < 0 ? 'amount-received' : ''}`}>
                  {formatCurrency(Math.abs(grandTotal.pending))}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* AKS Office Ledger Section */}
      <div className="page-header" style={{ marginTop: '48px' }}>
        <h2>
          <span className="material-icons">business_center</span>
          AKS Office Ledger
        </h2>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
          Hotel's pending share from AKS Office payments
        </div>
      </div>

      {/* AKS Office Summary Cards */}
      <div className="monthly-grid">
        {Object.entries(aksSums).sort(([, a], [, b]) => b.amount - a.amount).map(([cat, s]) => (
          <div className="monthly-card" key={cat}>
            <div className="mc-label">{cat} ({s.count})</div>
            <div className="mc-value red">{formatCurrency(s.amount)}</div>
          </div>
        ))}
        {aksGrandTotal.count > 0 && (
          <div className="monthly-card" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '2px solid #ef4444' }}>
            <div className="mc-label" style={{ fontWeight: '700' }}>TOTAL ({aksGrandTotal.count})</div>
            <div className="mc-value red" style={{ fontSize: '24px', fontWeight: '700' }}>{formatCurrency(aksGrandTotal.amount)}</div>
          </div>
        )}
      </div>

      {/* AKS Office Detail Table */}
      {aksPayments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No AKS Office payments found for the selected period</p>
      ) : (
        <div className="table-card">
          <div className="table-header">
            <span className="material-icons">receipt_long</span>
            AKS Office Payment Details
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Booking ID</th>
                <th>Guest Name</th>
                <th>Room No</th>
                <th>Amount</th>
                <th>Sub-Category</th>
                <th>Context</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
          <tbody>
            {aksPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                <td><strong>{payment.refBookingId || '-'}</strong></td>
                <td>{payment.guestName}</td>
                <td>{payment.roomNo || '-'}</td>
                <td className="amount amount-pending"><strong>{formatCurrency(Number(payment.amount))}</strong></td>
                <td>
                  {editingPayment === payment.id ? (
                    <select
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '13px' }}
                    >
                      <option value="">Select Category</option>
                      <option value="Rajat">Rajat</option>
                      <option value="Happy">Happy</option>
                      <option value="Vishal">Vishal</option>
                      <option value="Fyra">Fyra</option>
                      <option value="Gateway">Gateway</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="badge badge-info">{payment.subCategory || 'Unassigned'}</span>
                  )}
                </td>
                <td>{payment.context || '-'}</td>
                <td>{payment.createdBy}</td>
                <td>
                  {editingPayment === payment.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleSaveSubCategory(payment.id)}
                        className="btn-icon btn-success"
                        title="Save"
                      >
                        <span className="material-icons">check</span>
                      </button>
                      <button
                        onClick={() => setEditingPayment(null)}
                        className="btn-icon btn-secondary"
                        title="Cancel"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditSubCategory(payment)}
                      className="btn-icon btn-primary"
                      title="Edit Category"
                    >
                      <span className="material-icons">edit</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
              <tr className="total-row">
                <td colSpan={4}>TOTAL ({aksGrandTotal.count} payments)</td>
                <td className="amount amount-pending"><strong>{formatCurrency(aksGrandTotal.amount)}</strong></td>
                <td colSpan={4}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editModal && editingBooking && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>Edit Booking - {editingBooking.bookingId}</h3>
              <button onClick={() => setEditModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              {/* Hotel Share */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Hotel Share</label>
                <input
                  type="number"
                  value={editHotelShare}
                  onChange={(e) => setEditHotelShare(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '600', border: '2px solid #e2e8f0', borderRadius: '8px' }}
                  placeholder="Amount"
                />
              </div>

              {/* Collections */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', display: 'block' }}>Collections</label>
                {editCollections.map((col, idx) => (
                  <div key={idx} style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '2px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Entry {idx + 1}</span>
                      {editCollections.length > 1 && (
                        <button
                          onClick={() => removeCollectionEntry(idx)}
                          style={{
                            background: '#fee2e2',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >Remove</button>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: '#64748b' }}>Amount</label>
                      <input
                        type="number"
                        value={col.amount || ''}
                        onChange={(e) => updateCollectionEntry(idx, 'amount', Number(e.target.value))}
                        style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: '#64748b' }}>Date</label>
                      <input
                        type="date"
                        value={col.date}
                        onChange={(e) => updateCollectionEntry(idx, 'date', e.target.value)}
                        style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: '#64748b' }}>Type</label>
                      <select
                        value={col.type}
                        onChange={(e) => updateCollectionEntry(idx, 'type', e.target.value)}
                        style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="Room Rent">Room Rent</option>
                        <option value="KOT">KOT</option>
                        <option value="Add-on">Add-on</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: '#64748b' }}>Payment Mode</label>
                      <select
                        value={col.paymentMode || ''}
                        onClick={() => {
                          console.log('Select CLICKED!');
                        }}
                        onFocus={() => {
                          console.log('Select FOCUSED!');
                        }}
                        onChange={(e) => {
                          console.log('onChange FIRED! New value:', e.target.value);
                          const newValue = e.target.value;
                          const updated = [...editCollections];
                          updated[idx] = { ...updated[idx], paymentMode: newValue };
                          if (newValue !== 'AKS Office') {
                            updated[idx].subCategory = '';
                          }
                          setEditCollections(updated);
                        }}
                        style={{ width: '100%', padding: '8px', fontSize: '13px', border: '2px solid #f97316', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}
                      >
                        <option value="">Select Mode</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="SBI Neelkanth">SBI Neelkanth</option>
                        <option value="AKS Office">AKS Office</option>
                      </select>
                    </div>
                    {col.paymentMode === 'AKS Office' && (
                      <div className="form-group">
                        <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: '#64748b' }}>Sub-Category</label>
                        <select
                          value={col.subCategory}
                          onChange={(e) => updateCollectionEntry(idx, 'subCategory', e.target.value)}
                          style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        >
                          <option value="">Select Person</option>
                          <option value="Rajat">Rajat</option>
                          <option value="Happy">Happy</option>
                          <option value="Vishal">Vishal</option>
                          <option value="Fyra">Fyra</option>
                          <option value="Gateway">Gateway</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={addCollectionEntry}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#f0fdf4',
                    border: '2px dashed #86efac',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#16a34a',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >+ Add Collection Entry</button>
                <div style={{
                  marginTop: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#475569',
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '2px solid #cbd5e1'
                }}>
                  <span>Total Collection:</span>
                  <span>{formatCurrency(editCollections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0))}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveBooking} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
