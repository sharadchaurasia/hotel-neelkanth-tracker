import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { DaybookEntry, Staff } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { formatCurrency, formatDate, getToday } from '../hooks/useApi';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function DayBook() {
  const [date, setDate] = useState(getToday());
  const [entries, setEntries] = useState<DaybookEntry[]>([]);
  const [balance, setBalance] = useState<{
    cashOpening: number;
    bankSbiOpening: number;
    cashClosing?: number;
    bankSbiClosing?: number;
    isCalculated?: boolean;
    locked?: boolean;
  } | null>(null);
  const [closing, setClosing] = useState<any>(null);
  const [staff, setStaff] = useState<Staff[]>([]);

  // Modals
  const [balanceModal, setBalanceModal] = useState(false);
  const [balCash, setBalCash] = useState(0);
  const [balBank, setBalBank] = useState(0);
  const [expenseModal, setExpenseModal] = useState(false);
  const [expCat, setExpCat] = useState('');
  const [expSub, setExpSub] = useState('');
  const [expAmt, setExpAmt] = useState(0);
  const [expPayFrom, setExpPayFrom] = useState('Cash');
  const [expDesc, setExpDesc] = useState('');
  const [expEmployee, setExpEmployee] = useState('');
  const [incomeModal, setIncomeModal] = useState(false);
  const [incSource, setIncSource] = useState('Room Rent');
  const [incAmt, setIncAmt] = useState(0);
  const [incPayMode, setIncPayMode] = useState('Cash');
  const [incReceivedIn, setIncReceivedIn] = useState('Cash');
  const [incDesc, setIncDesc] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, balRes, closingRes, staffRes] = await Promise.all([
        api.get('/daybook/entries?date=' + date),
        api.get('/daybook/balance?date=' + date),
        api.get('/daybook/closing?date=' + date),
        api.get('/staff'),
      ]);
      setEntries(entriesRes.data);
      setBalance(balRes.data);
      setClosing(closingRes.data);
      setStaff(staffRes.data.filter((s: Staff) => s.status !== 'left'));
    } catch { /* ignore */ }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const incomeEntries = entries.filter(e => e.type === 'income');
  const expenseEntries = entries.filter(e => e.type === 'expense');
  const totalIncome = incomeEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalExpense = expenseEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const openBalanceModal = () => {
    setBalCash(Number(balance?.cashOpening) || 0);
    setBalBank(Number(balance?.bankSbiOpening) || 0);
    setBalanceModal(true);
  };

  const saveBalance = async () => {
    try {
      await api.put('/daybook/balance', { date, cashOpening: balCash, bankSbiOpening: balBank });
      toast.success('Opening balance saved');
      setBalanceModal(false);
      fetchData();
    } catch { toast.error('Error'); }
  };

  const openExpenseModal = () => {
    setExpCat('');
    setExpSub('');
    setExpAmt(0);
    setExpPayFrom('Cash');
    setExpDesc('');
    setExpEmployee('');
    setExpenseModal(true);
  };

  const saveExpense = async () => {
    if (!expCat || !expAmt) { toast.error('Fill category and amount'); return; }
    const emp = staff.find(s => String(s.id) === expEmployee);
    try {
      await api.post('/daybook/entries', {
        date, type: 'expense', category: expCat, subItem: expSub, amount: expAmt,
        paymentSource: expPayFrom, description: expDesc,
        employeeId: expEmployee ? Number(expEmployee) : undefined,
        employeeName: emp?.name || '',
      });
      toast.success('Expense added');
      setExpenseModal(false);
      fetchData();
    } catch { toast.error('Error'); }
  };

  const openIncomeModal = () => {
    setIncSource('Room Rent');
    setIncAmt(0);
    setIncPayMode('Cash');
    setIncReceivedIn('Cash');
    setIncDesc('');
    setIncomeModal(true);
  };

  const saveIncome = async () => {
    if (!incAmt) { toast.error('Enter amount'); return; }
    try {
      await api.post('/daybook/entries', {
        date, type: 'income', category: incSource, incomeSource: incSource,
        amount: incAmt, paymentMode: incPayMode, receivedIn: incReceivedIn,
        paymentSource: incReceivedIn, description: incDesc,
      });
      toast.success('Income added');
      setIncomeModal(false);
      fetchData();
    } catch { toast.error('Error'); }
  };

  const deleteEntry = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.delete('/daybook/entries/' + id);
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Error'); }
  };

  const autoCollect = async () => {
    try {
      const res = await api.post('/daybook/auto-collect?date=' + date);
      toast.success(res.data.added > 0 ? `${res.data.added} entries collected` : 'No new entries');
      fetchData();
    } catch { toast.error('Error'); }
  };

  const subItems = EXPENSE_CATEGORIES[expCat] || [];

  return (
    <div className="page-container">
      {/* Date Nav */}
      <div className="section-header">
        <h3><span className="material-icons">menu_book</span> Day Book</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => {
              const d = new Date(date + 'T00:00:00');
              d.setDate(d.getDate() - 1);
              setDate(d.toISOString().split('T')[0]);
            }}
            type="button"
          >&lt;</button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="month-selector"
            style={{ cursor: 'pointer' }}
          />
          <button
            className="btn btn-secondary btn-small"
            onClick={() => {
              const d = new Date(date + 'T00:00:00');
              d.setDate(d.getDate() + 1);
              setDate(d.toISOString().split('T')[0]);
            }}
            type="button"
          >&gt;</button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="monthly-grid" style={{ marginBottom: '24px' }}>
        <div className="monthly-card" style={{ cursor: balance?.isCalculated && !balance?.locked ? 'default' : 'pointer' }} onClick={balance?.isCalculated && !balance?.locked ? undefined : openBalanceModal}>
          <div className="mc-label">Cash Opening</div>
          <div className="mc-value blue">{formatCurrency(balance?.cashOpening || 0)}</div>
          {balance?.isCalculated && (
            <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '4px' }}>
              ✓ Auto-calculated
            </div>
          )}
        </div>
        <div className="monthly-card" style={{ cursor: balance?.isCalculated && !balance?.locked ? 'default' : 'pointer' }} onClick={balance?.isCalculated && !balance?.locked ? undefined : openBalanceModal}>
          <div className="mc-label">Bank (SBI Neelkanth) Opening</div>
          <div className="mc-value blue">{formatCurrency(balance?.bankSbiOpening || 0)}</div>
          {balance?.locked && (
            <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '4px' }}>
              🔒 Locked
            </div>
          )}
        </div>
        <div className="monthly-card"><div className="mc-label">Cash Closing</div><div className="mc-value green">{formatCurrency(closing?.cashClosing || 0)}</div></div>
        <div className="monthly-card"><div className="mc-label">Bank Closing</div><div className="mc-value green">{formatCurrency(closing?.bankClosing || 0)}</div></div>
      </div>

      {/* Income Section */}
      <div className="daybook-section">
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <h3 style={{ color: 'var(--accent-green)' }}><span className="material-icons">arrow_downward</span> Income</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-small" onClick={autoCollect}><span className="material-icons" style={{ fontSize: '14px' }}>sync</span> Auto Collect</button>
            <button className="btn btn-primary btn-small" onClick={openIncomeModal}><span className="material-icons" style={{ fontSize: '14px' }}>add</span> Manual</button>
          </div>
        </div>
        <table className="report-table">
          <thead><tr><th>Source</th><th>Description</th><th>Amount</th><th>Mode</th><th>Received In</th><th></th></tr></thead>
          <tbody>
            {incomeEntries.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No income entries</td></tr> :
              incomeEntries.map(e => (
                <tr key={e.id}>
                  <td><strong>{e.incomeSource || e.category || '-'}</strong>{e.guestName && <><br /><small style={{ color: 'var(--text-muted)' }}>{e.guestName}</small></>}{e.refBookingId && <><br /><small style={{ color: 'var(--text-muted)' }}>{e.refBookingId}</small></>}</td>
                  <td>{e.description || '-'}</td>
                  <td className="amount amount-received">{formatCurrency(e.amount)}</td>
                  <td><span className="payment-type">{e.paymentMode || '-'}</span></td>
                  <td>{e.receivedIn || e.paymentSource || '-'}</td>
                  <td><button className="btn btn-danger btn-small" onClick={() => deleteEntry(e.id)}>Delete</button></td>
                </tr>
              ))}
          </tbody>
          <tfoot><tr><td colSpan={2} style={{ fontWeight: 700 }}>Total Income</td><td className="amount" style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(totalIncome)}</td><td colSpan={3}></td></tr></tfoot>
        </table>
      </div>

      {/* Expense Section */}
      <div className="daybook-section" style={{ marginTop: '24px' }}>
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <h3 style={{ color: 'var(--accent-red)' }}><span className="material-icons">arrow_upward</span> Expenses</h3>
          <button className="btn btn-danger btn-small" onClick={openExpenseModal}><span className="material-icons" style={{ fontSize: '14px' }}>add</span> Add Expense</button>
        </div>
        <table className="report-table">
          <thead><tr><th>Category</th><th>Sub-Item</th><th>Description</th><th>Amount</th><th>Paid From</th><th></th></tr></thead>
          <tbody>
            {expenseEntries.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No expense entries</td></tr> :
              expenseEntries.map(e => (
                <tr key={e.id}>
                  <td><strong>{e.category || '-'}</strong>{e.employeeName && <><br /><small style={{ color: 'var(--text-muted)' }}>{e.employeeName}</small></>}</td>
                  <td>{e.subItem || '-'}</td>
                  <td>{e.description || '-'}</td>
                  <td className="amount amount-pending">{formatCurrency(e.amount)}</td>
                  <td>{e.paymentSource || '-'}</td>
                  <td><button className="btn btn-danger btn-small" onClick={() => deleteEntry(e.id)}>Delete</button></td>
                </tr>
              ))}
          </tbody>
          <tfoot><tr><td colSpan={3} style={{ fontWeight: 700 }}>Total Expenses</td><td className="amount" style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{formatCurrency(totalExpense)}</td><td colSpan={2}></td></tr></tfoot>
        </table>
      </div>

      {/* Closing Summary */}
      {closing && (
        <div className="daybook-section" style={{ marginTop: '24px' }}>
          <h3><span className="material-icons">calculate</span> Day Closing Summary</h3>
          <table className="report-table" style={{ marginTop: '12px' }}>
            <thead><tr><th></th><th>Cash</th><th>Bank Transfer</th><th>Total</th></tr></thead>
            <tbody>
              <tr><td><strong>Opening Balance</strong></td><td className="amount">{formatCurrency(closing.cashOpening)}</td><td className="amount">{formatCurrency(closing.bankOpening)}</td><td className="amount" style={{ fontWeight: 700 }}>{formatCurrency(closing.cashOpening + closing.bankOpening)}</td></tr>
              <tr style={{ color: 'var(--accent-green)' }}><td><strong>+ Income</strong></td><td className="amount">{formatCurrency(closing.cashIncome)}</td><td className="amount">{formatCurrency(closing.bankIncome)}</td><td className="amount" style={{ fontWeight: 700 }}>{formatCurrency(closing.cashIncome + closing.bankIncome)}</td></tr>
              <tr style={{ color: 'var(--accent-red)' }}><td><strong>- Expenses</strong></td><td className="amount">{formatCurrency(closing.cashExpense)}</td><td className="amount">{formatCurrency(closing.bankExpense)}</td><td className="amount" style={{ fontWeight: 700 }}>{formatCurrency(closing.cashExpense + closing.bankExpense)}</td></tr>
              <tr style={{ background: 'rgba(255,255,255,0.04)', fontWeight: 700 }}><td><strong>Closing Balance</strong></td><td className="amount" style={{ color: 'var(--accent-cyan)' }}>{formatCurrency(closing.cashClosing)}</td><td className="amount" style={{ color: 'var(--accent-cyan)' }}>{formatCurrency(closing.bankClosing)}</td><td className="amount" style={{ color: 'var(--accent-cyan)', fontSize: '16px' }}>{formatCurrency(closing.cashClosing + closing.bankClosing)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Set Balance Modal */}
      <Modal open={balanceModal} onClose={() => setBalanceModal(false)} title={`Opening Balance — ${formatDate(date)}`}
        footer={<><button className="btn btn-secondary" onClick={() => setBalanceModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveBalance}>Save</button></>}>
        <div className="form-group"><label>Cash Opening</label><input type="number" value={balCash || ''} onChange={(e) => setBalCash(Number(e.target.value))} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Bank (SBI Neelkanth) Opening</label><input type="number" value={balBank || ''} onChange={(e) => setBalBank(Number(e.target.value))} /></div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Add Expense"
        footer={<><button className="btn btn-secondary" onClick={() => setExpenseModal(false)}>Cancel</button><button className="btn btn-danger" onClick={saveExpense}>Save Expense</button></>}>
        <div className="form-group"><label>Category</label>
          <select value={expCat} onChange={(e) => { setExpCat(e.target.value); setExpSub(''); setExpEmployee(''); }}>
            <option value="">Select</option>
            {Object.keys(EXPENSE_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {subItems.length > 0 && (
          <div className="form-group" style={{ marginTop: '12px' }}><label>Sub-Item</label>
            <select value={expSub} onChange={(e) => setExpSub(e.target.value)}>
              <option value="">Select</option>
              {subItems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {expCat === 'Salary' && (
          <div className="form-group" style={{ marginTop: '12px' }}><label>Employee</label>
            <select value={expEmployee} onChange={(e) => setExpEmployee(e.target.value)}>
              <option value="">Select</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
            </select>
          </div>
        )}
        <div className="form-group" style={{ marginTop: '12px' }}><label>Amount</label><input type="number" value={expAmt || ''} onChange={(e) => setExpAmt(Number(e.target.value))} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Pay From</label>
          <select value={expPayFrom} onChange={(e) => setExpPayFrom(e.target.value)}><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer (SBI Neelkanth)</option></select>
        </div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Description</label><input value={expDesc} onChange={(e) => setExpDesc(e.target.value)} /></div>
      </Modal>

      {/* Manual Income Modal */}
      <Modal open={incomeModal} onClose={() => setIncomeModal(false)} title="Add Income"
        footer={<><button className="btn btn-secondary" onClick={() => setIncomeModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveIncome}>Save Income</button></>}>
        <div className="form-group"><label>Income Source</label>
          <select value={incSource} onChange={(e) => setIncSource(e.target.value)}>
            <option value="Room Rent">Room Rent</option><option value="KOT">KOT</option><option value="Add-On">Add-On</option><option value="Bonfire">Bonfire</option><option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Amount</label><input type="number" value={incAmt || ''} onChange={(e) => setIncAmt(Number(e.target.value))} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Payment Mode</label>
          <select value={incPayMode} onChange={(e) => setIncPayMode(e.target.value)}><option value="Cash">Cash</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer (SBI Neelkanth)</option></select>
        </div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Received In</label>
          <select value={incReceivedIn} onChange={(e) => setIncReceivedIn(e.target.value)}><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer (SBI Neelkanth)</option></select>
        </div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Description</label><input value={incDesc} onChange={(e) => setIncDesc(e.target.value)} /></div>
      </Modal>
    </div>
  );
}
