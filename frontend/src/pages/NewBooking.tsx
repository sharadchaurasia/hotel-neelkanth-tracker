import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { getToday, calculateNights } from '../hooks/useApi';
import {
  THEME,
  inputStyle,
  inputFocusProps,
  labelStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  sectionStyle,
  sectionTitleStyle,
} from '../styles/theme';

const emptyBooking = {
  guestName: '',
  phone: '',
  pax: 1,
  roomNo: '',
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

export default function NewBooking() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyBooking);
  const [users, setUsers] = useState<any[]>([]);
  const [bookingAddOns, setBookingAddOns] = useState<{ type: string; amount: number }[]>([]);
  const [paymentSubCategory, setPaymentSubCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.guestName || !form.checkIn || !form.checkOut || !form.totalAmount) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: THEME.colors.background,
        padding: '40px 20px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '38px',
            fontWeight: '700',
            color: THEME.colors.primary,
            marginBottom: '8px',
            letterSpacing: '1px',
          }}
        >
          The Neelkanth Grand
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: THEME.colors.textLight,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
          }}
        >
          New Booking
        </p>
      </div>

      {/* Form Card */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: THEME.colors.cardBg,
          borderRadius: THEME.radius.xlarge,
          padding: '48px 40px',
          boxShadow: THEME.shadows.card,
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Guest Information */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Guest Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Guest Name *</label>
                <input
                  type="text"
                  value={form.guestName}
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                  required
                  placeholder="Enter guest name"
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter phone number"
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Number of Guests (Pax)</label>
              <input
                type="number"
                min="1"
                value={form.pax}
                onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })}
                style={inputStyle}
                {...inputFocusProps}
              />
            </div>
          </div>

          {/* Room Details */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Room Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Number of Rooms</label>
                <input
                  type="number"
                  min="1"
                  value={form.noOfRooms}
                  onChange={(e) => setForm({ ...form, noOfRooms: Number(e.target.value) })}
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
              <div>
                <label style={labelStyle}>Room Number(s)</label>
                <input
                  type="text"
                  value={form.roomNo}
                  onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
                  placeholder="e.g. 201, 202"
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={labelStyle}>Room Category</label>
                <select
                  value={form.roomCategory}
                  onChange={(e) => setForm({ ...form, roomCategory: e.target.value })}
                  style={inputStyle}
                  {...inputFocusProps}
                >
                  <option value="">Select Category</option>
                  <option value="Non-Balcony">Non-Balcony</option>
                  <option value="Balcony">Balcony</option>
                  <option value="Mini Family">Mini Family</option>
                  <option value="Royal Suite Duplex">Royal Suite Duplex</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Meal Plan</label>
                <select
                  value={form.mealPlan}
                  onChange={(e) => setForm({ ...form, mealPlan: e.target.value })}
                  style={inputStyle}
                  {...inputFocusProps}
                >
                  <option value="">Select Plan</option>
                  <option value="EP">EP (Room Only)</option>
                  <option value="CP">CP (Breakfast)</option>
                  <option value="MAP">MAP (Breakfast + Dinner)</option>
                  <option value="AP">AP (All Meals)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Booking Dates */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Booking Dates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Check-in Date *</label>
                <input
                  type="date"
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  required
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
              <div>
                <label style={labelStyle}>Check-out Date *</label>
                <input
                  type="date"
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  required
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
              {form.checkIn && form.checkOut && (
                <div>
                  <label style={labelStyle}>Total Nights</label>
                  <input
                    type="text"
                    value={calculateNights(form.checkIn, form.checkOut)}
                    readOnly
                    style={{
                      ...inputStyle,
                      background: THEME.colors.cardBg,
                      fontWeight: '600',
                      color: THEME.colors.primary,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Booking Source */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Booking Source</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Source Type</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  style={inputStyle}
                  {...inputFocusProps}
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="OTA">OTA (MakeMyTrip, Goibibo, etc.)</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>
              {(form.source === 'OTA' || form.source === 'Agent') && (
                <div>
                  <label style={labelStyle}>{form.source} Name</label>
                  <input
                    type="text"
                    value={form.sourceName}
                    onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                    placeholder={form.source === 'Agent' ? 'Agent name' : 'OTA platform name'}
                    style={inputStyle}
                    {...inputFocusProps}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Pricing & Add-ons</h3>
            <div>
              <label style={labelStyle}>Base Room Rent</label>
              <input
                type="number"
                value={form.actualRoomRent || ''}
                onChange={(e) => {
                  const rent = Number(e.target.value);
                  const addOnsTotal = bookingAddOns.reduce((s, a) => s + (a.amount || 0), 0);
                  setForm({ ...form, actualRoomRent: rent, totalAmount: rent + addOnsTotal });
                }}
                placeholder="Enter room rent"
                style={inputStyle}
                {...inputFocusProps}
              />
            </div>

            {/* Add-ons */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ ...labelStyle, marginBottom: '12px' }}>Add-ons (Optional)</label>
              {bookingAddOns.map((ao, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <select
                    value={ao.type}
                    onChange={(e) => {
                      const na = [...bookingAddOns];
                      na[i].type = e.target.value;
                      setBookingAddOns(na);
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                    {...inputFocusProps}
                  >
                    <option value="">Select Add-on</option>
                    <option value="Honeymoon">Honeymoon Package</option>
                    <option value="Candle Night Dinner">Candle Night Dinner</option>
                    <option value="Heater">Heater</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={ao.amount || ''}
                    onChange={(e) => {
                      const na = [...bookingAddOns];
                      na[i].amount = Number(e.target.value);
                      setBookingAddOns(na);
                      const addOnsTotal = na.reduce((s, a) => s + (a.amount || 0), 0);
                      setForm({ ...form, totalAmount: form.actualRoomRent + addOnsTotal });
                    }}
                    style={{ ...inputStyle, width: '140px' }}
                    {...inputFocusProps}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const na = bookingAddOns.filter((_, j) => j !== i);
                      setBookingAddOns(na);
                      const addOnsTotal = na.reduce((s, a) => s + (a.amount || 0), 0);
                      setForm({ ...form, totalAmount: form.actualRoomRent + addOnsTotal });
                    }}
                    style={{
                      background: THEME.colors.errorBg,
                      border: `1px solid ${THEME.colors.errorBorder}`,
                      borderRadius: THEME.radius.medium,
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: THEME.colors.error,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBookingAddOns([...bookingAddOns, { type: '', amount: 0 }])}
                style={{
                  ...buttonSecondaryStyle,
                  width: 'auto',
                  padding: '8px 16px',
                  fontSize: '14px',
                  marginTop: '8px',
                }}
              >
                + Add Item
              </button>
            </div>

            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ ...labelStyle, color: THEME.colors.primary }}>Total Amount *</label>
                <input
                  type="number"
                  value={form.totalAmount || ''}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: `rgba(201,163,95,0.1)`,
                    fontWeight: '700',
                    fontSize: '18px',
                    color: THEME.colors.primary,
                    border: `2px solid ${THEME.colors.primary}`,
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Hotel Share</label>
                <input
                  type="number"
                  value={form.hotelShare || ''}
                  onChange={(e) => setForm({ ...form, hotelShare: Number(e.target.value) })}
                  placeholder="Hotel's portion"
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Payment Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Payment Type</label>
                <select
                  value={form.paymentType}
                  onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                  style={inputStyle}
                  {...inputFocusProps}
                >
                  <option value="Postpaid">Postpaid (Pay at checkout)</option>
                  <option value="Prepaid">Prepaid (Paid in advance)</option>
                  <option value="Ledger">Ledger (Agent account)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Advance Received</label>
                <input
                  type="number"
                  value={form.advanceReceived || ''}
                  onChange={(e) => setForm({ ...form, advanceReceived: Number(e.target.value) })}
                  placeholder="0"
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={labelStyle}>Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => {
                    setForm({ ...form, paymentMode: e.target.value });
                    if (e.target.value !== 'AKS Office') setPaymentSubCategory('');
                  }}
                  style={inputStyle}
                  {...inputFocusProps}
                >
                  <option value="">Select Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer (SBI Neelkanth)</option>
                  <option value="AKS Office">AKS Office</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Collection Amount</label>
                <input
                  type="number"
                  value={form.collectionAmount || ''}
                  onChange={(e) => setForm({ ...form, collectionAmount: Number(e.target.value) })}
                  placeholder="Amount collected"
                  style={inputStyle}
                  {...inputFocusProps}
                />
              </div>
            </div>

            {form.paymentMode === 'AKS Office' && (
              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>AKS Office Sub-Category</label>
                <select
                  value={paymentSubCategory}
                  onChange={(e) => setPaymentSubCategory(e.target.value)}
                  style={inputStyle}
                  {...inputFocusProps}
                >
                  <option value="">Select Sub-Category</option>
                  <option value="Rajat">Rajat</option>
                  <option value="Happy">Happy</option>
                  <option value="Vishal">Vishal</option>
                  <option value="Gateway">Gateway</option>
                  <option value="Fyra">Fyra</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Assign to Agent</label>
              <select
                value={form.agentId || ''}
                onChange={(e) => setForm({ ...form, agentId: e.target.value ? Number(e.target.value) : undefined })}
                style={inputStyle}
                {...inputFocusProps}
              >
                <option value="">No Agent</option>
                {users
                  .filter((u) => u.role === 'admin' || u.role === 'staff')
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Additional Notes</h3>
            <label style={labelStyle}>Remarks / Special Instructions</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Any special requests or notes..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
              {...inputFocusProps}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ ...buttonSecondaryStyle, width: 'auto', minWidth: '120px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonPrimaryStyle,
                width: 'auto',
                minWidth: '160px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#5a6a80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = THEME.colors.secondary;
              }}
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '32px',
          textAlign: 'center',
          color: THEME.colors.textLight,
          fontSize: '13px',
        }}
      >
        The Neelkanth CRM
      </div>
    </div>
  );
}
