import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface KOTOrder {
  id: number;
  kotId: string;
  customerName: string;
  bookingId?: number;
  roomNo?: string;
  items: Array<{ name: string; quantity: number; rate: number; amount: number }>;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  orderDate: string;
  createdBy: string;
  createdAt: string;
}

export default function KOT() {
  const [orders, setOrders] = useState<KOTOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    description: '',
    amount: '',
    paymentMode: 'cash',
    subCategory: '',
  });

  useEffect(() => {
    fetchOrders();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/kot', {
        ...formData,
        amount: parseFloat(formData.amount),
        orderDate: selectedDate,
      });
      toast.success('KOT order created successfully');
      setShowModal(false);
      setFormData({ customerName: '', description: '', amount: '', paymentMode: 'cash', subCategory: '' });
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

  const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

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
            className="date-input"
          />
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <span className="material-icons">add</span>
            New Order
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="material-icons">receipt</span>
          <div>
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="material-icons">currency_rupee</span>
          <div>
            <div className="stat-value">₹{totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="material-icons">trending_up</span>
          <div>
            <div className="stat-value">₹{orders.length > 0 ? (totalAmount / orders.length).toFixed(0) : 0}</div>
            <div className="stat-label">Avg Order Value</div>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>KOT ID</th>
              <th>Customer</th>
              <th>Room No</th>
              <th>Description</th>
              <th>Subtotal</th>
              <th>GST</th>
              <th>Total</th>
              <th>Time</th>
              <th>By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
                  No orders for this date
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.kotId}</strong></td>
                  <td>{order.customerName || 'Walk-in'}</td>
                  <td>{order.roomNo || '-'}</td>
                  <td>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ fontSize: '0.875rem' }}>
                        {item.name} x{item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>₹{Number(order.subtotal).toLocaleString('en-IN')}</td>
                  <td>₹{Number(order.gstAmount).toLocaleString('en-IN')}</td>
                  <td><strong>₹{Number(order.totalAmount).toLocaleString('en-IN')}</strong></td>
                  <td>{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{order.createdBy}</td>
                  <td>
                    <button onClick={() => handleDelete(order.id)} className="btn-icon btn-danger" title="Delete">
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New KOT Order</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Walk-in customer"
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Enter order items..."
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Mode *</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sub Category</label>
                <input
                  type="text"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  placeholder="e.g., Food, Beverages"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
