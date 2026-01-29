import { useState, useEffect } from 'react';
import api from '../api/client';
import type { Booking } from '../types';
import { formatCurrency, formatDate } from '../hooks/useApi';

export default function Ledger() {
  const [agent, setAgent] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agents, setAgents] = useState<string[]>([]);

  useEffect(() => {
    api.get('/bookings', { params: { source: 'Agent' } }).then(res => {
      const names = [...new Set((res.data as Booking[]).map(b => b.sourceName).filter(Boolean))] as string[];
      setAgents(names.sort());
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (agent) params.set('agent', agent);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api.get('/reports/ledger?' + params).then(res => setBookings(res.data)).catch(() => {});
  }, [agent, from, to]);

  const agentSums: Record<string, { total: number; received: number; pending: number; count: number }> = {};
  const grandTotal = { total: 0, received: 0, pending: 0, count: 0 };

  bookings.forEach(b => {
    const name = b.sourceName || 'Unknown';
    if (!agentSums[name]) agentSums[name] = { total: 0, received: 0, pending: 0, count: 0 };
    const total = Number(b.totalAmount) || 0;
    const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
    const pend = Math.max(total - recv, 0);
    agentSums[name].total += total;
    agentSums[name].received += recv;
    agentSums[name].pending += pend;
    agentSums[name].count++;
    grandTotal.total += total;
    grandTotal.received += recv;
    grandTotal.pending += pend;
    grandTotal.count++;
  });

  return (
    <div>
      <div className="section-header">
        <h3><span className="material-icons">account_balance</span> Agent Ledger</h3>
        <div className="report-filters">
          <select value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="monthly-grid">
        {agent ? (
          <>
            <div className="monthly-card"><div className="mc-label">{agent} — Bookings</div><div className="mc-value blue">{grandTotal.count}</div></div>
            <div className="monthly-card"><div className="mc-label">Total Amount</div><div className="mc-value blue">{formatCurrency(grandTotal.total)}</div></div>
            <div className="monthly-card"><div className="mc-label">Received</div><div className="mc-value green">{formatCurrency(grandTotal.received)}</div></div>
            <div className="monthly-card"><div className="mc-label">Pending Due</div><div className="mc-value red">{formatCurrency(grandTotal.pending)}</div></div>
          </>
        ) : (
          Object.entries(agentSums).sort(([, a], [, b]) => b.pending - a.pending).map(([name, s]) => (
            <div className="monthly-card" key={name}>
              <div className="mc-label">{name} ({s.count})</div>
              <div className={`mc-value ${s.pending > 0 ? 'red' : 'green'}`}>{formatCurrency(s.pending)}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Total: {formatCurrency(s.total)} | Rcvd: {formatCurrency(s.received)}</div>
            </div>
          ))
        )}
      </div>

      {/* Detail Table */}
      {bookings.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No bookings found for selected filters</p>
      ) : (
        <table className="report-table">
          <thead><tr><th>ID</th><th>Guest</th><th>Agent</th><th>Room</th><th>Check-in</th><th>Checkout</th><th>Total</th><th>Received</th><th>Pending</th><th>Status</th></tr></thead>
          <tbody>
            {bookings.map(b => {
              const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
              const pend = Math.max(Number(b.totalAmount) - recv, 0);
              const statusClass = b.status === 'COLLECTED' ? 'badge-collected' : b.status === 'PARTIAL' ? 'badge-partial' : 'badge-pending';
              return (
                <tr key={b.id}>
                  <td><strong>{b.bookingId}</strong></td>
                  <td>{b.guestName}</td>
                  <td>{b.sourceName || '-'}</td>
                  <td>{b.roomNo || '-'}</td>
                  <td>{formatDate(b.checkIn)}</td>
                  <td>{formatDate(b.checkOut)}</td>
                  <td className="amount">{formatCurrency(b.totalAmount)}</td>
                  <td className="amount amount-received">{formatCurrency(recv)}</td>
                  <td className={`amount ${pend > 0 ? 'amount-pending' : ''}`}>{formatCurrency(pend)}</td>
                  <td><span className={`badge ${statusClass}`}>{b.status}</span></td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td colSpan={6}>TOTAL ({grandTotal.count} bookings)</td>
              <td className="amount">{formatCurrency(grandTotal.total)}</td>
              <td className="amount amount-received">{formatCurrency(grandTotal.received)}</td>
              <td className={`amount ${grandTotal.pending > 0 ? 'amount-pending' : ''}`}>{formatCurrency(grandTotal.pending)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
