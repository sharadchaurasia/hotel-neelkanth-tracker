import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { formatCurrency, getToday, getCurrentMonth } from '../hooks/useApi';

interface AgentLedgerRow {
  agentId: number;
  agentName: string;
  bookingCount: number;
  totalBookingAmount: number;
  totalCollection: number;
  pendingAmount: number;
}

export default function AgentLedger() {
  const [data, setData] = useState<AgentLedgerRow[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    agentId: '',
    startDate: getCurrentMonth() + '-01',
    endDate: getToday(),
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.set('agentId', filters.agentId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const { data } = await api.get('/reports/agent-ledger?' + params.toString());
      setData(data);
    } catch (error) {
      toast.error('Failed to load agent ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Convert data to CSV
    const headers = ['Agent Name', 'Booking Count', 'Total Booking Amount', 'Total Collection', 'Pending Amount'];
    const rows = data.map(row => [
      row.agentName,
      row.bookingCount,
      row.totalBookingAmount.toFixed(2),
      row.totalCollection.toFixed(2),
      row.pendingAmount.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-ledger-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totals = data.reduce(
    (acc, row) => ({
      bookingCount: acc.bookingCount + row.bookingCount,
      totalBookingAmount: acc.totalBookingAmount + row.totalBookingAmount,
      totalCollection: acc.totalCollection + row.totalCollection,
      pendingAmount: acc.pendingAmount + row.pendingAmount,
    }),
    { bookingCount: 0, totalBookingAmount: 0, totalCollection: 0, pendingAmount: 0 }
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">people</span>
          Agent-wise Ledger Report
        </h2>
        <button onClick={handleExport} className="btn-primary" disabled={data.length === 0}>
          <span className="material-icons">download</span>
          Export CSV
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Agent</label>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
            >
              <option value="">All Agents</option>
              {users
                .filter(u => u.role === 'admin' || u.role === 'staff')
                .map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <button onClick={fetchData} className="btn-secondary" style={{ marginBottom: 0 }}>
            <span className="material-icons">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th style={{ textAlign: 'right' }}>Bookings</th>
                <th style={{ textAlign: 'right' }}>Total Booking Amount</th>
                <th style={{ textAlign: 'right' }}>Total Collection</th>
                <th style={{ textAlign: 'right' }}>Pending Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No agent bookings found for selected filters
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{row.agentName}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>{row.bookingCount}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(row.totalBookingAmount)}</td>
                      <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>
                        {formatCurrency(row.totalCollection)}
                      </td>
                      <td style={{ textAlign: 'right', color: row.pendingAmount > 0 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                        {formatCurrency(row.pendingAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #e2e8f0', fontWeight: 700, background: 'rgba(59, 130, 246, 0.05)' }}>
                    <td>TOTAL</td>
                    <td style={{ textAlign: 'right' }}>{totals.bookingCount}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(totals.totalBookingAmount)}</td>
                    <td style={{ textAlign: 'right', color: '#22c55e' }}>
                      {formatCurrency(totals.totalCollection)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>
                      {formatCurrency(totals.pendingAmount)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
