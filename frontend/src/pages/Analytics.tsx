import { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    collectedAmount: number;
    pendingAmount: number;
    averageBookingValue: number;
    collectionRate: string;
  };
  revenueTrends: Array<{ date: string; revenue: number }>;
  occupancy: Array<{ date: string; occupancy: string; occupied: number; total: number }>;
  topAgents: Array<{ name: string; revenue: number }>;
  paymentModes: Array<{ mode: string; amount: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [period, setPeriod] = useState('30days');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/analytics?period=${period}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <span className="material-icons">error_outline</span>
          <h3>No data available</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h2>
          <span className="material-icons">analytics</span>
          Analytics Dashboard
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <span className="material-icons" style={{ color: '#3b82f6' }}>payments</span>
            Total Revenue
          </div>
          <div className="stat-value">{formatCurrency(data.summary.totalRevenue)}</div>
          <div className="stat-trend">{data.summary.totalBookings} bookings</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span className="material-icons" style={{ color: '#10b981' }}>check_circle</span>
            Collected
          </div>
          <div className="stat-value">{formatCurrency(data.summary.collectedAmount)}</div>
          <div className="stat-trend">{data.summary.collectionRate}% collection rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span className="material-icons" style={{ color: '#f59e0b' }}>pending</span>
            Pending
          </div>
          <div className="stat-value">{formatCurrency(data.summary.pendingAmount)}</div>
          <div className="stat-trend">To be collected</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span className="material-icons" style={{ color: '#8b5cf6' }}>trending_up</span>
            Avg Booking Value
          </div>
          <div className="stat-value">{formatCurrency(data.summary.averageBookingValue)}</div>
          <div className="stat-trend">Per booking</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Revenue Trends */}
        <div className="section-box">
          <h3 className="section-title">
            <span className="material-icons">show_chart</span>
            Revenue Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Rate */}
        <div className="section-box">
          <h3 className="section-title">
            <span className="material-icons">hotel</span>
            Occupancy Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.occupancy}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="occupancy" stroke="#10b981" strokeWidth={2} name="Occupancy %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Top Agents */}
        <div className="section-box">
          <h3 className="section-title">
            <span className="material-icons">group</span>
            Top Agents by Revenue
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topAgents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Modes */}
        <div className="section-box">
          <h3 className="section-title">
            <span className="material-icons">account_balance_wallet</span>
            Payment Mode Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.paymentModes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ mode, amount }: any) => `${mode}: ${formatCurrency(amount)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {data.paymentModes.map((_item, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
