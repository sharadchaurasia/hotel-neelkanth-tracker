import { useState, useEffect } from 'react';
import api from '../api/client';
import { formatCurrency, formatDate, getCurrentMonth } from '../hooks/useApi';

export default function Reports() {
  // Source Report
  const [srcFrom, setSrcFrom] = useState('');
  const [srcTo, setSrcTo] = useState('');
  const [sourceData, setSourceData] = useState<Record<string, { bookings: number; totalAmount: number; collected: number; pending: number }>>({});

  // Payment Report
  const [payFrom, setPayFrom] = useState('');
  const [payTo, setPayTo] = useState('');
  const [payData, setPayData] = useState<Record<string, Record<string, number>>>({});

  // Monthly Report
  const [month, setMonth] = useState(getCurrentMonth());
  const [monthlyData, setMonthlyData] = useState<Record<string, { bookings: number; totalAmount: number; collected: number; pending: number; guests: string[] }>>({});

  useEffect(() => {
    const params = new URLSearchParams();
    if (srcFrom) params.set('from', srcFrom);
    if (srcTo) params.set('to', srcTo);
    api.get('/reports/source?' + params).then(r => setSourceData(r.data)).catch(() => {});
  }, [srcFrom, srcTo]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (payFrom) params.set('from', payFrom);
    if (payTo) params.set('to', payTo);
    api.get('/reports/payment?' + params).then(r => setPayData(r.data)).catch(() => {});
  }, [payFrom, payTo]);

  useEffect(() => {
    if (month) api.get('/reports/monthly?month=' + month).then(r => setMonthlyData(r.data)).catch(() => {});
  }, [month]);

  const srcEntries = Object.entries(sourceData).sort(([a], [b]) => a.localeCompare(b));
  const srcGrand = srcEntries.reduce((a, [, s]) => ({
    bookings: a.bookings + s.bookings, totalAmount: a.totalAmount + s.totalAmount,
    collected: a.collected + s.collected, pending: a.pending + s.pending,
  }), { bookings: 0, totalAmount: 0, collected: 0, pending: 0 });

  const payDates = Object.keys(payData).sort();
  const payGrand = payDates.reduce((a, dt) => {
    const d = payData[dt];
    return { Cash: a.Cash + (d.Cash || 0), Card: a.Card + (d.Card || 0), BT: a.BT + (d['Bank Transfer'] || 0), Other: a.Other + (d.Other || 0), total: a.total + (d.total || 0) };
  }, { Cash: 0, Card: 0, BT: 0, Other: 0, total: 0 });

  const monthDates = Object.keys(monthlyData).sort();
  const monthGrand = monthDates.reduce((a, dt) => {
    const d = monthlyData[dt];
    return { bookings: a.bookings + d.bookings, totalAmount: a.totalAmount + d.totalAmount, collected: a.collected + d.collected, pending: a.pending + d.pending };
  }, { bookings: 0, totalAmount: 0, collected: 0, pending: 0 });

  return (
    <div>
      {/* Source-wise Report */}
      <div className="report-section">
        <div className="section-header">
          <h3><span className="material-icons">pie_chart</span> Source-wise Report</h3>
          <div className="report-filters">
            <input type="date" value={srcFrom} onChange={(e) => setSrcFrom(e.target.value)} />
            <span>to</span>
            <input type="date" value={srcTo} onChange={(e) => setSrcTo(e.target.value)} />
          </div>
        </div>
        {srcEntries.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No data</p> : (
          <table className="report-table">
            <thead><tr><th>Source</th><th>Bookings</th><th>Total Amount</th><th>Collected</th><th>Pending</th></tr></thead>
            <tbody>
              {srcEntries.map(([name, s]) => (
                <tr key={name}><td><strong>{name}</strong></td><td>{s.bookings}</td><td className="amount">{formatCurrency(s.totalAmount)}</td><td className="amount amount-received">{formatCurrency(s.collected)}</td><td className={`amount ${s.pending > 0 ? 'amount-pending' : ''}`}>{formatCurrency(s.pending)}</td></tr>
              ))}
              <tr className="total-row"><td>TOTAL</td><td>{srcGrand.bookings}</td><td className="amount">{formatCurrency(srcGrand.totalAmount)}</td><td className="amount amount-received">{formatCurrency(srcGrand.collected)}</td><td className={`amount ${srcGrand.pending > 0 ? 'amount-pending' : ''}`}>{formatCurrency(srcGrand.pending)}</td></tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Report */}
      <div className="report-section">
        <div className="section-header">
          <h3><span className="material-icons">payments</span> Payment Report</h3>
          <div className="report-filters">
            <input type="date" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
            <span>to</span>
            <input type="date" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
          </div>
        </div>
        {payDates.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No data</p> : (
          <table className="report-table">
            <thead><tr><th>Date</th><th>Cash</th><th>Card</th><th>Bank Transfer</th><th>Other</th><th>Day Total</th></tr></thead>
            <tbody>
              {payDates.map(dt => {
                const d = payData[dt];
                return (
                  <tr key={dt}><td><strong>{formatDate(dt)}</strong></td>
                    <td className="amount">{d.Cash ? formatCurrency(d.Cash) : '-'}</td>
                    <td className="amount">{d.Card ? formatCurrency(d.Card) : '-'}</td>
                    <td className="amount">{d['Bank Transfer'] ? formatCurrency(d['Bank Transfer']) : '-'}</td>
                    <td className="amount">{d.Other ? formatCurrency(d.Other) : '-'}</td>
                    <td className="amount" style={{ fontWeight: 700 }}>{formatCurrency(d.total)}</td>
                  </tr>
                );
              })}
              <tr className="total-row"><td>TOTAL</td>
                <td className="amount">{formatCurrency(payGrand.Cash)}</td>
                <td className="amount">{formatCurrency(payGrand.Card)}</td><td className="amount">{formatCurrency(payGrand.BT)}</td>
                <td className="amount">{formatCurrency(payGrand.Other)}</td><td className="amount" style={{ fontWeight: 700 }}>{formatCurrency(payGrand.total)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Monthly Report */}
      <div className="report-section">
        <div className="section-header">
          <h3><span className="material-icons">calendar_month</span> Monthly Report</h3>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="month-selector" />
        </div>
        {monthDates.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No data</p> : (
          <table className="report-table">
            <thead><tr><th>Date</th><th>Bookings</th><th>Guests</th><th>Collection</th><th>Collected</th><th>Pending</th></tr></thead>
            <tbody>
              {monthDates.map(dt => {
                const d = monthlyData[dt];
                return (
                  <tr key={dt}><td><strong>{formatDate(dt)}</strong></td><td>{d.bookings}</td><td><small>{d.guests.join(', ')}</small></td>
                    <td className="amount">{formatCurrency(d.totalAmount)}</td><td className="amount amount-received">{formatCurrency(d.collected)}</td>
                    <td className={`amount ${d.pending > 0 ? 'amount-pending' : ''}`}>{formatCurrency(d.pending)}</td>
                  </tr>
                );
              })}
              <tr className="total-row"><td>TOTAL</td><td>{monthGrand.bookings}</td><td></td>
                <td className="amount">{formatCurrency(monthGrand.totalAmount)}</td><td className="amount amount-received">{formatCurrency(monthGrand.collected)}</td>
                <td className={`amount ${monthGrand.pending > 0 ? 'amount-pending' : ''}`}>{formatCurrency(monthGrand.pending)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
