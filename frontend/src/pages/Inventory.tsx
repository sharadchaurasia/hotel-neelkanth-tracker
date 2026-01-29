import { useState, useEffect } from 'react';
import api from '../api/client';
import { ALL_ROOMS, ROOM_TYPE } from '../types';
import { formatDate, getToday, getCurrentMonth } from '../hooks/useApi';

export default function Inventory() {
  const [date, setDate] = useState(getToday());
  const [month, setMonth] = useState(getCurrentMonth());
  const [dayData, setDayData] = useState<{ room: string; type: string; occupied: boolean; guest: string; pax: number }[]>([]);
  const [gridData, setGridData] = useState<any>(null);
  const [occType, setOccType] = useState('month');
  const [occMonth, setOccMonth] = useState(getCurrentMonth());
  const [occYear, setOccYear] = useState(String(new Date().getFullYear()));
  const [occData, setOccData] = useState<any>(null);

  useEffect(() => {
    api.get(`/reports/inventory?month=${month}`).then(res => setGridData(res.data)).catch(() => {});
  }, [month]);

  useEffect(() => {
    if (gridData) {
      const dateIdx = gridData.dates.indexOf(date);
      const data = ALL_ROOMS.map((rm, ri) => {
        const dayInfo = dateIdx >= 0 ? gridData.grid[ri]?.days[dateIdx] : null;
        return {
          room: rm,
          type: ROOM_TYPE[rm] || '',
          occupied: dayInfo?.occupied || false,
          guest: dayInfo?.guest || '',
          pax: dayInfo?.pax || 0,
        };
      });
      setDayData(data);
    }
  }, [date, gridData]);

  useEffect(() => {
    const params = new URLSearchParams({ type: occType });
    if (occType === 'month') params.set('month', occMonth);
    if (occType === 'year') params.set('year', occYear);
    api.get(`/reports/occupancy?${params}`).then(res => setOccData(res.data)).catch(() => {});
  }, [occType, occMonth, occYear]);

  const vacant = dayData.filter(d => !d.occupied);
  const occupied = dayData.filter(d => d.occupied);
  const today = getToday();

  return (
    <div>
      {/* Day View */}
      <div className="inventory-section">
        <div className="section-header">
          <h3><span className="material-icons">meeting_room</span> Room Status — Day View</h3>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="month-selector" />
        </div>
        <div className="inv-summary-row">
          <div className="inv-chip"><div className="dot dot-vacant" /><span>{vacant.length} Vacant</span></div>
          <div className="inv-chip"><div className="dot dot-occupied" /><span>{occupied.length} Occupied</span></div>
          <span style={{ color: 'var(--text-muted)' }}>(of {ALL_ROOMS.length})</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <h5 style={{ color: 'var(--accent-green)', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Vacant ({vacant.length})</h5>
            <table className="report-table" style={{ margin: 0 }}>
              <thead><tr><th>Room</th><th>Type</th></tr></thead>
              <tbody>{vacant.length === 0 ? <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No vacant rooms</td></tr> :
                vacant.map(v => <tr key={v.room}><td><strong>{v.room}</strong></td><td>{v.type}</td></tr>)
              }</tbody>
            </table>
          </div>
          <div>
            <h5 style={{ color: 'var(--accent-red)', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Occupied ({occupied.length})</h5>
            <table className="report-table" style={{ margin: 0 }}>
              <thead><tr><th>Room</th><th>Type</th><th>Guest</th><th>Pax</th></tr></thead>
              <tbody>{occupied.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No occupied rooms</td></tr> :
                occupied.map(o => <tr key={o.room}><td><strong>{o.room}</strong></td><td>{o.type}</td><td>{o.guest}</td><td>{o.pax}</td></tr>)
              }</tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Month Grid */}
      <div className="inventory-section">
        <div className="section-header">
          <h3><span className="material-icons">calendar_month</span> Monthly Grid</h3>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="month-selector" />
        </div>
        {gridData && (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead><tr>
                <th className="room-col">Room</th>
                <th className="room-col" style={{ minWidth: '80px' }}>Type</th>
                {gridData.dates.map((dt: string, idx: number) => (
                  <th key={dt} className={dt === today ? 'cell-today' : ''}>{idx + 1}</th>
                ))}
              </tr></thead>
              <tbody>
                {gridData.grid.map((row: any) => (
                  <tr key={row.room}>
                    <td className="room-col">{row.room}</td>
                    <td className="room-col" style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)' }}>{row.type}</td>
                    {row.days.map((day: any) => (
                      <td key={day.date} className={`${day.occupied ? 'cell-occupied' : 'cell-vacant'}${day.date === today ? ' cell-today' : ''}`}
                        title={day.guest ? `${day.guest} (${day.pax} adults)` : ''}>
                        {day.occupied ? day.guest.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 2) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Occupancy Report */}
      <div className="inventory-section">
        <div className="section-header">
          <h3><span className="material-icons">analytics</span> Occupancy Report</h3>
          <div className="report-filters">
            <select value={occType} onChange={(e) => setOccType(e.target.value)}>
              <option value="month">Monthly</option><option value="year">Yearly</option>
            </select>
            {occType === 'month' && <input type="month" value={occMonth} onChange={(e) => setOccMonth(e.target.value)} />}
            {occType === 'year' && (
              <select value={occYear} onChange={(e) => setOccYear(e.target.value)}>
                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        {occData && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="monthly-card"><div className="mc-label">Total Room-Nights</div><div className="mc-value blue">{occData.totalSlots}</div></div>
              <div className="monthly-card"><div className="mc-label">Occupied</div><div className="mc-value orange">{occData.totalOccupied}</div></div>
              <div className="monthly-card"><div className="mc-label">Vacant</div><div className="mc-value green">{occData.totalSlots - occData.totalOccupied}</div></div>
              <div className="monthly-card" style={{ border: '2px solid var(--accent-cyan)' }}><div className="mc-label">Occupancy %</div><div className="mc-value" style={{ color: 'var(--accent-cyan)', fontSize: '32px' }}>{occData.occupancyPct}%</div></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', height: '28px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', height: '100%', width: `${occData.occupancyPct}%`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>{occData.occupancyPct}%</span>
              </div>
            </div>
            <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }}>Agent-wise Contribution</h4>
            <table className="report-table">
              <thead><tr><th>Source / Agent</th><th>Room-Nights</th><th>Contribution %</th><th>Share of Occupied</th></tr></thead>
              <tbody>
                {Object.entries(occData.agentOccupied as Record<string, number>)
                  .sort(([, a], [, b]) => b - a)
                  .map(([agent, rn]) => (
                    <tr key={agent}>
                      <td><strong>{agent}</strong></td>
                      <td>{rn}</td>
                      <td className="amount">{occData.totalSlots > 0 ? ((rn / occData.totalSlots) * 100).toFixed(1) : '0.0'}%</td>
                      <td className="amount" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{occData.totalOccupied > 0 ? ((rn / occData.totalOccupied) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
