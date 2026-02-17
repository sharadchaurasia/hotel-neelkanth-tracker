import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface KOTOrder {
  id: number;
  kotId: string;
  customerName: string;
  bookingId?: string;
  roomNo?: string;
  items: Array<{ itemName: string; quantity: number; rate: number; total: number }>;
  description: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  amount: number;
  orderDate: string;
  status: string;
  paymentMode: string;
  createdBy: string;
  createdAt: string;
}

interface Booking {
  id: number;
  bookingId: string;
  guestName: string;
  phone: string;
  roomNo: string;
  checkIn: string;
  checkOut: string;
  checkedIn: boolean;
  kotAmount: number;
}

interface KOTItem {
  itemName: string;
  quantity: number;
  rate: number;
}

export default function KOT() {
  const [activeTab, setActiveTab] = useState<'inhouse' | 'orders' | 'walkin'>('inhouse');
  const [orders, setOrders] = useState<KOTOrder[]>([]);
  const [checkedInBookings, setCheckedInBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [items, setItems] = useState<KOTItem[]>([{ itemName: '', quantity: 1, rate: 0 }]);
  const [walkinForm, setWalkinForm] = useState({
    customerName: '',
    description: '',
    amount: '',
    paymentMode: 'Cash',
  });
  const [showGuestOrdersModal, setShowGuestOrdersModal] = useState(false);
  const [guestOrdersBooking, setGuestOrdersBooking] = useState<Booking | null>(null);
  const [guestOrders, setGuestOrders] = useState<KOTOrder[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchCheckedInBookings();
  }, [selectedDate]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/kot', { params: { date: selectedDate } });
      setOrders(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load KOT orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckedInBookings = async () => {
    try {
      const { data } = await api.get('/bookings', {
        params: {
          page: 1,
          limit: 100,
          checkedIn: true
        }
      });
      setCheckedInBookings(data.filter((b: Booking) => b.checkedIn));
    } catch (error: any) {
      toast.error('Failed to load in-house guests');
    }
  };

  const handleCreateKOTForRoom = (booking: Booking) => {
    setSelectedBooking(booking);
    setItems([{ itemName: '', quantity: 1, rate: 0 }]);
    setShowItemsModal(true);
  };

  const handleViewGuestOrders = async (booking: Booking) => {
    try {
      // Fetch all orders and filter for this guest
      const { data } = await api.get('/kot');
      const filtered = data.filter((order: KOTOrder) =>
        order.bookingId === booking.bookingId ||
        (order.roomNo && order.roomNo === booking.roomNo)
      );
      setGuestOrders(filtered);
      setGuestOrdersBooking(booking);
      setShowGuestOrdersModal(true);
    } catch (error: any) {
      toast.error('Failed to load guest orders');
    }
  };

  const addItem = () => {
    setItems([...items, { itemName: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof KOTItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const handleSubmitRoomKOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const validItems = items.filter(i => i.itemName && i.quantity > 0 && i.rate > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      await api.post('/kot', {
        bookingId: selectedBooking.bookingId,
        roomNo: selectedBooking.roomNo,
        customerName: `${selectedBooking.guestName} - Room ${selectedBooking.roomNo}`,
        items: validItems,
        orderDate: selectedDate,
        status: 'UNPAID',
      });
      toast.success('KOT order created - Will be collected at checkout');
      setShowItemsModal(false);
      setSelectedBooking(null);
      fetchOrders();
      fetchCheckedInBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create KOT order');
    }
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/kot', {
        ...walkinForm,
        amount: parseFloat(walkinForm.amount),
        orderDate: selectedDate,
        status: 'PAID',
      });
      toast.success('Walk-in KOT order created');
      setWalkinForm({ customerName: '', description: '', amount: '', paymentMode: 'Cash' });
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this KOT order?')) return;
    try {
      await api.delete(`/kot/${id}`);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount || order.amount), 0);
  const paidAmount = orders.filter(o => o.status === 'PAID').reduce((sum, order) => sum + Number(order.totalAmount || order.amount), 0);
  const unpaidAmount = orders.filter(o => o.status === 'UNPAID').reduce((sum, order) => sum + Number(order.totalAmount || order.amount), 0);

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">restaurant</span>
          KOT Orders
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('inhouse')}
          className={`tab-button ${activeTab === 'inhouse' ? 'tab-active' : ''}`}
        >
          <span className="material-icons">hotel</span>
          In-House Guests
          <span className="tab-badge">{checkedInBookings.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`tab-button ${activeTab === 'orders' ? 'tab-active' : ''}`}
        >
          <span className="material-icons">receipt_long</span>
          All Orders
          <span className="tab-badge">{orders.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('walkin')}
          className={`tab-button ${activeTab === 'walkin' ? 'tab-active' : ''}`}
        >
          <span className="material-icons">person_add</span>
          Walk-in Order
        </button>
      </div>

      {/* Summary Cards */}
      {activeTab === 'orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Orders</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a2332' }}>{orders.length}</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Total Amount</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a2332' }}>₹{totalAmount.toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ color: '#10b981', fontSize: '14px', marginBottom: '8px' }}>Paid</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>₹{paidAmount.toFixed(2)}</div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ color: '#f59e0b', fontSize: '14px', marginBottom: '8px' }}>Unpaid</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>₹{unpaidAmount.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* In-House Guests Tab */}
      {activeTab === 'inhouse' && (
        <div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              Checked-In Guests
            </h3>
            {checkedInBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <span className="material-icons" style={{ fontSize: '48px', opacity: 0.3 }}>hotel</span>
                <p style={{ marginTop: '16px' }}>No guests checked in today</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {checkedInBookings.map((booking) => (
                  <div
                    key={booking.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                        {booking.guestName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Room {booking.roomNo} • {booking.bookingId}
                        {booking.kotAmount > 0 && (
                          <span style={{ marginLeft: '12px', color: '#f59e0b', fontWeight: '500' }}>
                            • KOT: ₹{Number(booking.kotAmount).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewGuestOrders(booking)}
                        style={{
                          padding: '8px 16px',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px' }}>visibility</span>
                        View Orders
                      </button>
                      <button
                        onClick={() => handleCreateKOTForRoom(booking)}
                        style={{
                          padding: '8px 16px',
                          background: '#6b7b93',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
                        Add KOT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Orders Tab */}
      {activeTab === 'orders' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>KOT ID</th>
                <th>Customer</th>
                <th>Room</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>GST (5%)</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No orders found for this date
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '600' }}>{order.kotId}</td>
                    <td>{order.customerName}</td>
                    <td>
                      {order.roomNo ? (
                        <span style={{
                          padding: '4px 8px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}>
                          {order.roomNo}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Walk-in</span>
                      )}
                    </td>
                    <td>
                      {order.items && order.items.length > 0 ? (
                        <div style={{ fontSize: '13px' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx}>
                              {item.quantity}x {item.itemName} @ ₹{item.rate}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {order.description || '-'}
                        </span>
                      )}
                    </td>
                    <td>₹{Number(order.subtotal || 0).toFixed(2)}</td>
                    <td>₹{Number(order.gstAmount || 0).toFixed(2)}</td>
                    <td style={{ fontWeight: '600' }}>
                      ₹{Number(order.totalAmount || order.amount).toFixed(2)}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: order.status === 'PAID' ? '#dcfce7' : '#fef3c7',
                        color: order.status === 'PAID' ? '#16a34a' : '#d97706',
                      }}>
                        {order.status || 'PAID'}
                      </span>
                    </td>
                    <td>{order.paymentMode || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(order.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Walk-in Order Tab */}
      {activeTab === 'walkin' && (
        <div className="card" style={{ padding: '32px', maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600' }}>
            Create Walk-in Order
          </h3>
          <form onSubmit={handleWalkinSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Customer Name
              </label>
              <input
                type="text"
                value={walkinForm.customerName}
                onChange={(e) => setWalkinForm({ ...walkinForm, customerName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Description / Items
              </label>
              <textarea
                value={walkinForm.description}
                onChange={(e) => setWalkinForm({ ...walkinForm, description: e.target.value })}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={walkinForm.amount}
                onChange={(e) => setWalkinForm({ ...walkinForm, amount: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Payment Mode
              </label>
              <select
                value={walkinForm.paymentMode}
                onChange={(e) => setWalkinForm({ ...walkinForm, paymentMode: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: '#6b7b93',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Create Walk-in Order
            </button>
          </form>
        </div>
      )}

      {/* Create KOT for Room Modal */}
      {showItemsModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600' }}>
              Create KOT Order
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
              {selectedBooking.guestName} • Room {selectedBooking.roomNo} • {selectedBooking.bookingId}
            </p>

            <form onSubmit={handleSubmitRoomKOT}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: '600', fontSize: '15px' }}>Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    style={{
                      padding: '6px 12px',
                      background: '#6b7b93',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Item
                  </button>
                </div>

                {items.map((item, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    gap: '8px',
                    marginBottom: '12px',
                    alignItems: 'center',
                  }}>
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      required
                      style={{
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                      style={{
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      required
                      style={{
                        padding: '10px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                      ₹{(item.quantity * item.rate).toFixed(2)}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        style={{
                          padding: '8px',
                          background: '#fee',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: '16px',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Subtotal:</span>
                  <span style={{ fontWeight: '600' }}>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>GST (5%):</span>
                  <span style={{ fontWeight: '600' }}>₹{(calculateSubtotal() * 0.05).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700' }}>
                  <span>Total:</span>
                  <span>₹{(calculateSubtotal() * 1.05).toFixed(2)}</span>
                </div>
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#92400e',
                }}>
                  <strong>Note:</strong> This will be marked as UNPAID and collected at checkout
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemsModal(false);
                    setSelectedBooking(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6b7b93',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest Orders Modal */}
      {showGuestOrdersModal && guestOrdersBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px',
          }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                  KOT Orders - {guestOrdersBooking.guestName}
                </h2>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Room {guestOrdersBooking.roomNo} • {guestOrdersBooking.bookingId}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGuestOrdersModal(false);
                  setGuestOrdersBooking(null);
                  setGuestOrders([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                }}
              >
                ×
              </button>
            </div>

            {guestOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <span className="material-icons" style={{ fontSize: '48px', opacity: 0.3 }}>receipt_long</span>
                <p style={{ marginTop: '16px' }}>No KOT orders found for this guest</p>
              </div>
            ) : (
              <div>
                {/* Group orders by date */}
                {Object.entries(
                  guestOrders.reduce((acc: any, order) => {
                    const date = new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN');
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(order);
                    return acc;
                  }, {})
                ).map(([date, dateOrders]: [string, any]) => (
                  <div key={date} style={{ marginBottom: '24px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '2px solid #e5e7eb',
                    }}>
                      📅 {date}
                    </div>
                    {dateOrders.map((order: KOTOrder) => (
                      <div key={order.id} style={{
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        marginBottom: '12px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600', fontSize: '15px' }}>{order.kotId}</span>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: order.status === 'PAID' ? '#d1fae5' : '#fef3c7',
                            color: order.status === 'PAID' ? '#065f46' : '#92400e',
                          }}>
                            {order.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                          {order.description || order.items?.map(i => i.itemName).join(', ')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>
                            {order.paymentMode || 'Pay at Checkout'}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: '#1a2332' }}>
                            ₹{Number(order.totalAmount || order.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div style={{
                      textAlign: 'right',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#374151',
                      paddingTop: '8px',
                    }}>
                      Date Total: ₹{dateOrders.reduce((sum: number, o: KOTOrder) =>
                        sum + Number(o.totalAmount || o.amount), 0
                      ).toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700' }}>Grand Total:</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#6b7b93' }}>
                    ₹{guestOrders.reduce((sum, o) => sum + Number(o.totalAmount || o.amount), 0).toFixed(2)}
                  </span>
                </div>

                {/* Unpaid Orders */}
                {guestOrders.some(o => o.status === 'UNPAID') && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #fcd34d',
                  }}>
                    <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                      ⚠️ Unpaid Amount:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e' }}>
                      ₹{guestOrders.filter(o => o.status === 'UNPAID')
                        .reduce((sum, o) => sum + Number(o.totalAmount || o.amount), 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
