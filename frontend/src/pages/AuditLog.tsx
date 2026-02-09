import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface AuditEntry {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number;
  changes: any;
  timestamp: string;
}

interface PaginatedResponse {
  data: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    entityType: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filters]);

  const fetchAuditLogs = async () => {
    try {
      const params: any = { page, limit: 50 };
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const { data } = await api.get<PaginatedResponse>('/audit', { params });
      setAuditLogs(data.data);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const entityTypes = ['booking', 'user', 'staff', 'kot', 'daybook'];

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">history</span>
          Audit Log
        </h2>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            >
              <option value="">All Types</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  No audit logs found
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>{log.userName}</td>
                  <td>
                    <span className={`badge ${
                      log.action === 'CREATE' ? 'badge-success' :
                      log.action === 'UPDATE' ? 'badge-info' :
                      log.action === 'DELETE' ? 'badge-danger' :
                      'badge-default'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entityType}</td>
                  <td>{log.entityId}</td>
                  <td>
                    <details style={{ cursor: 'pointer' }}>
                      <summary style={{ fontSize: '0.875rem' }}>View changes</summary>
                      <pre style={{
                        fontSize: '0.75rem',
                        marginTop: '8px',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px',
                        maxWidth: '400px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
            >
              Previous
            </button>
            <span style={{ padding: '8px 16px' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
