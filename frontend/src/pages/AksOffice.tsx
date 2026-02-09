import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

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
  createdAt: string;
}

export default function AksOffice() {
  const [payments, setPayments] = useState<AksOfficePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [subCategoryFilter, setSubCategoryFilter] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [fromDate, toDate, subCategoryFilter]);

  const fetchPayments = async () => {
    try {
      const params: any = { from: fromDate, to: toDate };
      if (subCategoryFilter) params.subCategory = subCategoryFilter;

      const { data } = await api.get('/bookings/aks-office-payments', { params });
      setPayments(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await api.delete(`/bookings/aks-office-payments/${id}`);
      toast.success('Payment deleted successfully');
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete payment');
    }
  };

  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const uniqueCategories = [...new Set(payments.map(p => p.subCategory).filter(Boolean))];

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">business</span>
          AKS Office Payments
        </h2>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Category</label>
            <select
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="material-icons">receipt_long</span>
          <div>
            <div className="stat-value">{payments.length}</div>
            <div className="stat-label">Total Payments</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="material-icons">currency_rupee</span>
          <div>
            <div className="stat-value">₹{totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Booking ID</th>
              <th>Guest Name</th>
              <th>Room No</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Context</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                  No payments found for the selected period
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                  <td>{payment.refBookingId || '-'}</td>
                  <td>{payment.guestName}</td>
                  <td>{payment.roomNo || '-'}</td>
                  <td>
                    {payment.subCategory && (
                      <span className="badge badge-info">{payment.subCategory}</span>
                    )}
                  </td>
                  <td><strong>₹{Number(payment.amount).toLocaleString('en-IN')}</strong></td>
                  <td>{payment.context || '-'}</td>
                  <td>{payment.createdBy}</td>
                  <td>
                    <button onClick={() => handleDelete(payment.id)} className="btn-icon btn-danger" title="Delete">
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
