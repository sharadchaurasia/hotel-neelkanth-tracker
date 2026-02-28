import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { getToday, calculateNights } from '../hooks/useApi';
import { THEME } from '../styles/theme';

const emptyBooking = {
  guestName: '',
  phone: '',
  pax: 1,
  noOfRooms: 1,
  roomCategory: '',
  checkIn: getToday(),
  checkOut: '',
  mealPlan: '',
  source: 'Walk-in',
  sourceName: '',
  actualRoomRent: 0,
  totalAmount: 0,
  hotelShare: 0,
  paymentType: 'Postpaid',
  advanceReceived: 0,
  paymentMode: '',
  remarks: '',
  collectionAmount: 0,
  agentId: undefined as number | undefined,
};

interface Agent {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  status: string;
}

export default function NewBooking() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyBooking);
  const [bookingAddOns, setBookingAddOns] = useState<{ type: string; amount: number }[]>([]);
  const [paymentSubCategory, setPaymentSubCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Agent state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(''); // 'new' | agent id
  const [newAgentName, setNewAgentName] = useState('');
  const [creatingAgent, setCreatingAgent] = useState(false);

  // Fetch agents when source is 'Agent'
  useEffect(() => {
    if (form.source === 'Agent' && agents.length === 0) {
      setAgentsLoading(true);
      api.get('/agents')
        .then((res) => {
          setAgents(res.data.filter((a: Agent) => a.status === 'ACTIVE'));
        })
        .catch(() => toast.error('Failed to load agents'))
        .finally(() => setAgentsLoading(false));
    }
  }, [form.source]);

  const handleAgentSelect = (value: string) => {
    setSelectedAgentId(value);
    setNewAgentName('');
    if (value === 'new') {
      setForm({ ...form, sourceName: '', agentId: undefined });
    } else if (value) {
      const agent = agents.find((a) => String(a.id) === value);
      if (agent) {
        setForm({ ...form, sourceName: agent.name, agentId: agent.id });
      }
    } else {
      setForm({ ...form, sourceName: '', agentId: undefined });
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) {
      toast.error('Please enter an agent name');
      return;
    }
    setCreatingAgent(true);
    try {
      const res = await api.post('/agents', { name: newAgentName.trim() });
      const newAgent: Agent = res.data;
      setAgents((prev) => [...prev, newAgent]);
      setSelectedAgentId(String(newAgent.id));
      setForm({ ...form, sourceName: newAgent.name, agentId: newAgent.id });
      setNewAgentName('');
      toast.success(`Agent "${newAgent.name}" created!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!form.guestName || !form.checkIn || !form.checkOut || !form.totalAmount) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.source === 'Agent' && !form.agentId && !form.sourceName) {
      toast.error('Please select or create an agent');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        roomNo: '',
        kot: '',
        addOns: bookingAddOns.filter((a) => a.type && a.amount > 0),
        paymentSubCategory: form.paymentMode === 'AKS Office' ? paymentSubCategory : undefined,
      };

      await api.post('/bookings', payload);
      toast.success('Booking created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const nights = form.checkIn && form.checkOut ? calculateNights(form.checkIn, form.checkOut) : 0;

  const inputStyleLocal = {
    width: '100%',
    padding: '10px 12px',
    background: THEME.colors.white,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: '6px',
    fontSize: '14px',
    color: THEME.colors.textDark,
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  };

  const labelStyleLocal = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: THEME.colors.textDark,
    marginBottom: '5px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '20px 15px' }}>
      {/* Simple Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e3a8a', marginBottom: '8px' }}>
          📋 New Booking
        </h1>
        <p style={{ fontSize: '13px', color: THEME.colors.textLight }}>
          The Neelkanth Grand
        </p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '500px', margin: '0 auto', background: THEME.colors.cardBg, borderRadius: '12px', padding: '24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <form onSubmit={handleSubmit}>

          {/* Guest Details */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: THEME.colors.textDark, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${THEME.colors.border}` }}>
              Guest Details
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyleLocal}>Guest Name *</label>
              <input type="text" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} required placeholder="Enter guest name" style={inputStyleLocal} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
              <div>
                <label style={labelStyleLocal}>Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" style={inputStyleLocal} />
              </div>
              <div>
                <label style={labelStyleLocal}>Guests</label>
                <input type="number" min="1" value={form.pax} onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })} style={inputStyleLocal} />
              </div>
            </div>
          </div>

          {/* Check-in & Check-out */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: THEME.colors.textDark, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${THEME.colors.border}` }}>
              Check-in & Check-out
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: nights > 0 ? '1fr 1fr 80px' : '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyleLocal}>Check-in *</label>
                <input
                  type="date"
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  required
                  style={{
                    ...inputStyleLocal,
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                />
              </div>
              <div>
                <label style={labelStyleLocal}>Check-out *</label>
                <input
                  type="date"
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  required
                  style={{
                    ...inputStyleLocal,
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  min={form.checkIn || getToday()}
                />
              </div>
              {nights > 0 && (
                <div>
                  <label style={labelStyleLocal}>Nights</label>
                  <div style={{ padding: '10px 8px', background: `${THEME.colors.primary}15`, border: `2px solid ${THEME.colors.primary}`, borderRadius: '8px', fontWeight: '700', fontSize: '16px', color: THEME.colors.primary, textAlign: 'center', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {nights}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room Details */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: THEME.colors.textDark, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${THEME.colors.border}` }}>
              Room Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={labelStyleLocal}>Rooms</label>
                <input type="number" min="1" value={form.noOfRooms} onChange={(e) => setForm({ ...form, noOfRooms: Number(e.target.value) })} style={inputStyleLocal} />
              </div>
              <div>
                <label style={labelStyleLocal}>Room Category</label>
                <select value={form.roomCategory} onChange={(e) => setForm({ ...form, roomCategory: e.target.value })} style={{ ...inputStyleLocal, cursor: 'pointer' }}>
                  <option value="">Select category</option>
                  <option value="Non-Balcony">Non-Balcony</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Mini Family">Mini Family</option>
                  <option value="Royal Suite Duplex">Royal Suite Duplex</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyleLocal}>Meal Plan</label>
              <select value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })} style={{ ...inputStyleLocal, cursor: 'pointer' }}>
                <option value="">Select meal plan</option>
                <option value="EP">Room Only</option>
                <option value="CP">With Breakfast</option>
                <option value="MAP">Breakfast + Dinner</option>
                <option value="AP">All Meals</option>
              </select>
            </div>
          </div>

          {/* Booking Source */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: THEME.colors.textDark, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${THEME.colors.border}` }}>
              Booking Source
            </h3>
            <div style={{ marginBottom: form.source === 'Agent' ? '10px' : '0' }}>
              <label style={labelStyleLocal}>Source</label>
              <select
                value={form.source}
                onChange={(e) => {
                  const newSource = e.target.value;
                  // Reset agent selection when changing source
                  setSelectedAgentId('');
                  setNewAgentName('');
                  setForm({
                    ...form,
                    source: newSource,
                    sourceName: '',
                    agentId: undefined,
                    paymentType: (newSource !== 'Walk-in') ? 'Ledger' : 'Postpaid',
                  });
                }}
                style={{ ...inputStyleLocal, cursor: 'pointer' }}
              >
                <option value="Walk-in">Walk-in</option>
                <option disabled>──────────</option>
                <option value="AKS Office">AKS Office</option>
                <option value="Self">Self</option>
                <option value="Agent">Agent</option>
                <option disabled>──────────</option>
                <option value="MMT">MMT</option>
                <option value="Goibibo">Goibibo</option>
                <option value="Cleartrip">Cleartrip</option>
                <option value="Booking.com">Booking.com</option>
              </select>
            </div>

            {/* Agent Selection - shown when source is 'Agent' */}
            {form.source === 'Agent' && (
              <div>
                <label style={labelStyleLocal}>Select Agent</label>
                {agentsLoading ? (
                  <div style={{ ...inputStyleLocal, color: THEME.colors.textLight, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⏳ Loading agents...
                  </div>
                ) : (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => handleAgentSelect(e.target.value)}
                    style={{ ...inputStyleLocal, cursor: 'pointer' }}
                  >
                    <option value="">-- Select Agent --</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={String(agent.id)}>
                        {agent.name}
                      </option>
                    ))}
                    <option value="new">➕ Add New Agent...</option>
                  </select>
                )}

                {/* New Agent Input */}
                {selectedAgentId === 'new' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <input
                      type="text"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="Enter new agent name"
                      style={{ ...inputStyleLocal, flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateAgent();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateAgent}
                      disabled={creatingAgent || !newAgentName.trim()}
                      style={{
                        padding: '10px 14px',
                        background: THEME.colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: creatingAgent ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        opacity: creatingAgent || !newAgentName.trim() ? 0.6 : 1,
                      }}
                    >
                      {creatingAgent ? '...' : '✓ Save'}
                    </button>
                  </div>
                )}

                {/* Show selected agent info */}
                {form.agentId && form.sourceName && (
                  <div style={{ marginTop: '6px', padding: '6px 10px', background: `${THEME.colors.primary}10`, borderRadius: '6px', fontSize: '12px', color: THEME.colors.primary, fontWeight: '500' }}>
                    ✓ Agent: {form.sourceName}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: THEME.colors.textDark, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${THEME.colors.border}` }}>
              Pricing
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={labelStyleLocal}>Room Rent *</label>
              <input
                type="number"
                value={form.actualRoomRent || ''}
                onChange={(e) => {
                  const rent = Number(e.target.value);
                  const addOnsTotal = bookingAddOns.reduce((s, a) => s + (a.amount || 0), 0);
                  setForm({
                    ...form,
                    actualRoomRent: rent,
                    totalAmount: rent + addOnsTotal,
                    // collectionAmount = room rent only (add-ons tracked separately)
                    collectionAmount: rent,
                  });
                }}
                placeholder="₹ 0"
                style={inputStyleLocal}
              />
            </div>

            {/* Add-ons */}
            {bookingAddOns.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ ...labelStyleLocal, marginBottom: '6px' }}>Add Ons</label>
                {bookingAddOns.map((ao, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}>
                    <select
                      value={ao.type}
                      onChange={(e) => {
                        const na = [...bookingAddOns];
                        na[i].type = e.target.value;
                        setBookingAddOns(na);
                      }}
                      style={{ ...inputStyleLocal, flex: 2, cursor: 'pointer' }}
                    >
                      <option value="">Select</option>
                      <option value="Honeymoon">Honeymoon</option>
                      <option value="Candle Night Dinner">Candle Dinner</option>
                      <option value="Heater">Heater</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="number"
                      placeholder="₹"
                      value={ao.amount || ''}
                      onChange={(e) => {
                        const na = [...bookingAddOns];
                        na[i].amount = Number(e.target.value);
                        setBookingAddOns(na);
                        const addOnsTotal = na.reduce((s, a) => s + (a.amount || 0), 0);
                        // totalAmount includes add-ons for display; collectionAmount stays as room rent only
                        setForm({
                          ...form,
                          totalAmount: form.actualRoomRent + addOnsTotal,
                          // collectionAmount stays as actualRoomRent
                        });
                      }}
                      style={{ ...inputStyleLocal, width: '90px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const na = bookingAddOns.filter((_, j) => j !== i);
                        setBookingAddOns(na);
                        const addOnsTotal = na.reduce((s, a) => s + (a.amount || 0), 0);
                        setForm({
                          ...form,
                          totalAmount: form.actualRoomRent + addOnsTotal,
                          // collectionAmount stays as actualRoomRent
                        });
                      }}
                      style={{ padding: '8px 10px', background: '#fee', border: '1px solid #fcc', borderRadius: '6px', cursor: 'pointer', color: '#c00', fontSize: '16px' }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setBookingAddOns([...bookingAddOns, { type: '', amount: 0 }])}
              style={{ marginBottom: '10px', padding: '7px 12px', background: THEME.colors.white, border: `1px solid ${THEME.colors.border}`, borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: THEME.colors.textDark, fontWeight: '500' }}
            >+ Add On</button>

            {/* Summary Box */}
            <div style={{ padding: '10px 12px', background: `${THEME.colors.primary}10`, borderRadius: '8px', border: `1px solid ${THEME.colors.primary}`, marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: bookingAddOns.some(a => a.amount > 0) ? '4px' : '0' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.colors.textDark }}>Room Rent</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: THEME.colors.primary }}>₹{(form.actualRoomRent || 0).toLocaleString()}</span>
              </div>
              {bookingAddOns.some(a => a.amount > 0) && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: THEME.colors.textLight }}>Add-ons</span>
                    <span style={{ fontSize: '14px', color: THEME.colors.textLight }}>₹{bookingAddOns.reduce((s, a) => s + (a.amount || 0), 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${THEME.colors.border}`, paddingTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: THEME.colors.textDark }}>Total (incl. add-ons)</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: THEME.colors.textDark }}>₹{form.totalAmount.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {(form.source !== 'Walk-in') && (
              <div>
                <label style={labelStyleLocal}>Total Collection (Agent/OTA)</label>
                <input type="number" value={form.hotelShare || ''} onChange={(e) => setForm({ ...form, hotelShare: Number(e.target.value) })} placeholder="₹ 0" style={inputStyleLocal} />
              </div>
            )}
          </div>

          {/* Payment */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: THEME.colors.textDark, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${THEME.colors.border}` }}>
              Payment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={labelStyleLocal}>Payment Type</label>
                <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })} style={{ ...inputStyleLocal, cursor: 'pointer' }}>
                  <option value="Pay at Check-in">Pay at Check-in</option>
                  <option value="Postpaid">At Checkout</option>
                  <option value="Prepaid">Prepaid</option>
                  <option value="Ledger">Agent Ledger</option>
                </select>
              </div>
              <div>
                <label style={labelStyleLocal}>{form.paymentType === 'Pay at Check-in' ? 'Collection Amount' : 'Advance'}</label>
                <input
                  type="number"
                  value={form.paymentType === 'Pay at Check-in' ? (form.collectionAmount || '') : (form.advanceReceived || '')}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (form.paymentType === 'Pay at Check-in') {
                      setForm({ ...form, collectionAmount: val });
                    } else {
                      setForm({ ...form, advanceReceived: val });
                    }
                  }}
                  placeholder="₹ 0"
                  style={inputStyleLocal}
                />
              </div>
            </div>

            {((form.paymentType === 'Pay at Check-in' && form.collectionAmount > 0) || form.advanceReceived > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: form.paymentMode === 'AKS Office' ? '1fr 1fr' : '1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyleLocal}>Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => { setForm({ ...form, paymentMode: e.target.value }); if (e.target.value !== 'AKS Office') setPaymentSubCategory(''); }} style={{ ...inputStyleLocal, cursor: 'pointer' }}>
                    <option value="">Select mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="SBI Neelkanth">SBI Neelkanth</option>
                    <option value="AKS Office">AKS Office</option>
                  </select>
                </div>
                {form.paymentMode === 'AKS Office' && (
                  <div>
                    <label style={labelStyleLocal}>Sub-Category</label>
                    <select value={paymentSubCategory} onChange={(e) => setPaymentSubCategory(e.target.value)} style={{ ...inputStyleLocal, cursor: 'pointer' }}>
                      <option value="">Select</option>
                      <option value="Rajat">Rajat</option>
                      <option value="Happy">Happy</option>
                      <option value="Vishal">Vishal</option>
                      <option value="Gateway">Gateway</option>
                      <option value="Fyra">Fyra</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyleLocal}>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Any special requests or notes..." rows={2} style={{ ...inputStyleLocal, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: `1px solid ${THEME.colors.border}` }}>
            <button type="button" onClick={() => navigate('/')} disabled={loading} style={{ flex: 1, padding: '12px', background: THEME.colors.white, border: `1px solid ${THEME.colors.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: THEME.colors.textDark }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', background: THEME.colors.secondary, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', color: 'white', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
