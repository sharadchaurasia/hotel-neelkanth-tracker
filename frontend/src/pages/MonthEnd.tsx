import { useState, useEffect } from 'react';
import api from '../api/client';
import { formatCurrency } from '../hooks/useApi';
import toast from 'react-hot-toast';

interface OpeningBalance {
  id: number;
  agentName: string;
  month: string;
  openingBalance: number;
  notes?: string;
  createdAt: string;
}

interface ClosingBalances {
  cash: number;
  bank: number;
  ledgers: { agentName: string; closingBalance: number }[];
}

export default function MonthEnd() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [openingBalances, setOpeningBalances] = useState<OpeningBalance[]>([]);
  const [closingBalances, setClosingBalances] = useState<ClosingBalances | null>(null);
  const [loading, setLoading] = useState(false);

  // Manual opening balance form
  const [showForm, setShowForm] = useState(false);
  const [formAgent, setFormAgent] = useState('AKS Office');
  const [formMonth, setFormMonth] = useState(selectedMonth);
  const [formBalance, setFormBalance] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    loadOpeningBalances();
  }, [selectedMonth]);

  const loadOpeningBalances = async () => {
    try {
      const res = await api.get(`/month-end/all-openings?month=${selectedMonth}`);
      setOpeningBalances(res.data.openings || []);
    } catch (error) {
      console.error('Failed to load opening balances:', error);
    }
  };

  const calculateClosingBalances = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/month-end/closing-balances?month=${selectedMonth}`);
      setClosingBalances(res.data.closingBalances);
      toast.success('Closing balances calculated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to calculate closing balances');
    } finally {
      setLoading(false);
    }
  };

  const handleSetOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/month-end/opening-balance', {
        agent: formAgent,
        month: formMonth,
        openingBalance: parseFloat(formBalance),
        notes: formNotes || undefined,
      });
      toast.success('Opening balance set successfully!');
      setShowForm(false);
      setFormBalance('');
      setFormNotes('');
      loadOpeningBalances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set opening balance');
    } finally {
      setLoading(false);
    }
  };

  const handleCarryForward = async () => {
    if (!confirm(`Close ${selectedMonth} and carry forward balances to next month?`)) return;

    setLoading(true);
    try {
      const res = await api.post('/month-end/carry-forward', { month: selectedMonth });
      toast.success(res.data.message || 'Successfully closed month and opened next!');

      // Move to next month
      const [year, month] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(year, month, 1);
      const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(nextMonth);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to carry forward balances');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h3>
          <span className="material-icons">event_note</span> Month-End Closing
        </h3>
        <div className="report-filters">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            max={new Date().toISOString().substring(0, 7)}
          />
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <span className="material-icons">add</span> Set Opening Balance
          </button>
        </div>
      </div>

      {/* Manual Opening Balance Form */}
      {showForm && (
        <div className="section-box" style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '16px' }}>Set Opening Balance</h4>
          <form onSubmit={handleSetOpening} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>Agent/Ledger</label>
              <input
                type="text"
                value={formAgent}
                onChange={(e) => setFormAgent(e.target.value)}
                placeholder="AKS Office"
                required
                list="agent-suggestions"
              />
              <datalist id="agent-suggestions">
                <option value="AKS Office" />
              </datalist>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>Month</label>
              <input
                type="month"
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>Opening Balance</label>
              <input
                type="number"
                step="0.01"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                placeholder="-18715"
                required
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Negative = Hotel has advance
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>Notes (optional)</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Previous month advance"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Opening Balance'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Current Opening Balances */}
      <div className="section-box" style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '16px' }}>Opening Balances - {selectedMonth}</h4>
        {openingBalances.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            No opening balances set for {selectedMonth}
          </p>
        ) : (
          <div className="monthly-grid">
            {openingBalances.map((ob) => (
              <div className="monthly-card" key={ob.id}>
                <div className="mc-label">{ob.agentName}</div>
                <div className={`mc-value ${ob.openingBalance < 0 ? 'green' : 'red'}`}>
                  {formatCurrency(Math.abs(ob.openingBalance))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {ob.openingBalance < 0 ? '(Hotel has advance)' : '(Agent owes hotel)'}
                </div>
                {ob.notes && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    {ob.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calculate Closing Balances */}
      <div className="section-box" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4>Closing Balances - {selectedMonth}</h4>
          <button className="btn-secondary" onClick={calculateClosingBalances} disabled={loading}>
            <span className="material-icons">calculate</span> Calculate Closing
          </button>
        </div>

        {closingBalances ? (
          <>
            <div className="monthly-grid" style={{ marginBottom: '20px' }}>
              <div className="monthly-card">
                <div className="mc-label">Cash Closing</div>
                <div className="mc-value blue">{formatCurrency(closingBalances.cash)}</div>
              </div>
              <div className="monthly-card">
                <div className="mc-label">Bank (SBI) Closing</div>
                <div className="mc-value blue">{formatCurrency(closingBalances.bank)}</div>
              </div>
            </div>

            {closingBalances.ledgers.length > 0 && (
              <>
                <h5 style={{ marginBottom: '12px', fontSize: '14px' }}>Ledger Closings:</h5>
                <div className="monthly-grid">
                  {closingBalances.ledgers.map((ledger) => (
                    <div className="monthly-card" key={ledger.agentName}>
                      <div className="mc-label">{ledger.agentName}</div>
                      <div className={`mc-value ${ledger.closingBalance < 0 ? 'green' : 'red'}`}>
                        {formatCurrency(Math.abs(ledger.closingBalance))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {ledger.closingBalance < 0 ? '(Hotel has advance)' : '(Agent owes hotel)'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            Click "Calculate Closing" to see closing balances
          </p>
        )}
      </div>

      {/* Month-End Close Button */}
      {closingBalances && (
        <div className="section-box" style={{ textAlign: 'center', padding: '30px' }}>
          <h4 style={{ marginBottom: '12px' }}>Ready to Close {selectedMonth}?</h4>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            This will carry forward all closing balances to next month's opening balances automatically.
          </p>
          <button
            className="btn-primary"
            onClick={handleCarryForward}
            disabled={loading}
            style={{ padding: '12px 32px', fontSize: '16px' }}
          >
            <span className="material-icons">fast_forward</span>
            Close {selectedMonth} & Open Next Month
          </button>
        </div>
      )}
    </div>
  );
}
