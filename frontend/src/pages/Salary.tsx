import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { Staff, Attendance, SalaryAdvance } from '../types';
import { formatCurrency, formatDate, getToday, getCurrentMonth } from '../hooks/useApi';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Salary() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attEmployee, setAttEmployee] = useState('');
  const [attMonth, setAttMonth] = useState(getCurrentMonth());
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [salaryMonth, setSalaryMonth] = useState(getCurrentMonth());
  const [salaryData, setSalaryData] = useState<any[]>([]);

  // Modals
  const [staffModal, setStaffModal] = useState(false);
  const [editStaffId, setEditStaffId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({ name: '', designation: '', salary: 0, doj: getToday() });
  const [absentModal, setAbsentModal] = useState(false);
  const [absentData, setAbsentData] = useState({ staffId: '', date: '', remark: '', empName: '' });
  const [advanceModal, setAdvanceModal] = useState(false);
  const [advForm, setAdvForm] = useState({ staffId: '', amount: 0, date: getToday(), deductMonth: getCurrentMonth(), remarks: '' });
  const [fnfModal, setFnfModal] = useState(false);
  const [fnfStaff, setFnfStaff] = useState<Staff | null>(null);
  const [fnfDate, setFnfDate] = useState(getToday());

  const fetchAll = useCallback(async () => {
    try {
      const [staffRes, advRes] = await Promise.all([
        api.get('/staff'),
        api.get('/advances'),
      ]);
      setStaff(staffRes.data);
      setAdvances(advRes.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (attEmployee && attMonth) {
      api.get(`/attendance?staffId=${attEmployee}&month=${attMonth}`)
        .then(r => setAttendance(r.data)).catch(() => {});
    } else {
      setAttendance([]);
    }
  }, [attEmployee, attMonth]);

  useEffect(() => {
    if (salaryMonth) {
      api.get('/reports/salary?month=' + salaryMonth).then(r => setSalaryData(r.data)).catch(() => {});
    }
  }, [salaryMonth, staff]);

  const refreshAttendance = () => {
    if (attEmployee && attMonth) {
      api.get(`/attendance?staffId=${attEmployee}&month=${attMonth}`)
        .then(r => setAttendance(r.data)).catch(() => {});
    }
  };

  const activeStaff = staff.filter(s => s.status !== 'left');

  // Staff CRUD
  const openNewStaff = () => {
    setEditStaffId(null);
    setStaffForm({ name: '', designation: '', salary: 0, doj: getToday() });
    setStaffModal(true);
  };

  const openEditStaff = (s: Staff) => {
    setEditStaffId(s.id);
    setStaffForm({ name: s.name, designation: s.designation, salary: Number(s.salary), doj: s.doj });
    setStaffModal(true);
  };

  const saveStaff = async () => {
    if (!staffForm.name || !staffForm.designation || !staffForm.salary) { toast.error('Fill all fields'); return; }
    try {
      if (editStaffId) {
        await api.put(`/staff/${editStaffId}`, staffForm);
        toast.success('Staff updated');
      } else {
        await api.post('/staff', staffForm);
        toast.success('Staff added');
      }
      setStaffModal(false);
      fetchAll();
    } catch { toast.error('Error'); }
  };

  // Attendance
  const absentDates = new Set(attendance.filter(a => a.absent).map(a => a.date));

  const renderCalendar = () => {
    if (!attEmployee || !attMonth) return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Select an employee and month</p>;
    const [y, m] = attMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDay = new Date(y, m - 1, 1).getDay();
    const today = getToday();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={'e' + i} className="attendance-day empty" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${attMonth}-${String(d).padStart(2, '0')}`;
      const isFuture = ds > today;
      const isAbsent = absentDates.has(ds);
      const cls = isFuture ? 'future' : isAbsent ? 'absent' : 'present';
      cells.push(
        <div key={d} className={`attendance-day ${cls}`}
          title={isAbsent ? 'Absent' : isFuture ? 'Future' : 'Present'}
          onClick={() => {
            if (isFuture) return;
            if (isAbsent) removeAbsent(ds);
            else openMarkAbsent(ds);
          }}>
          {d}{isAbsent && <><br /><small>A</small></>}
        </div>
      );
    }

    const countable = Array.from({ length: daysInMonth }, (_, i) => `${attMonth}-${String(i + 1).padStart(2, '0')}`).filter(ds => ds <= today);
    const absentCount = countable.filter(ds => absentDates.has(ds)).length;
    const presentCount = countable.length - absentCount;

    return (
      <>
        <div className="attendance-calendar">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="attendance-day header">{d}</div>)}
          {cells}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div className="att-chip chip-days">Days: {daysInMonth}</div>
          <div className="att-chip chip-present">Present: {presentCount}</div>
          <div className="att-chip chip-absent">Absent: {absentCount}</div>
        </div>
      </>
    );
  };

  const openMarkAbsent = (ds: string) => {
    const emp = staff.find(s => String(s.id) === attEmployee);
    setAbsentData({ staffId: attEmployee, date: ds, remark: '', empName: emp?.name || '' });
    setAbsentModal(true);
  };

  const saveAbsent = async () => {
    try {
      await api.post('/attendance', { staffId: Number(absentData.staffId), date: absentData.date, absent: true, remark: absentData.remark });
      toast.success('Marked absent');
      setAbsentModal(false);
      refreshAttendance();
    } catch { toast.error('Error'); }
  };

  const removeAbsent = async (ds: string) => {
    if (!confirm(`Remove absence for ${formatDate(ds)}?`)) return;
    try {
      await api.delete(`/attendance?staffId=${attEmployee}&date=${ds}`);
      toast.success('Absence removed');
      refreshAttendance();
    } catch { toast.error('Error'); }
  };

  // Advances
  const openAdvanceModal = () => {
    setAdvForm({ staffId: '', amount: 0, date: getToday(), deductMonth: getCurrentMonth(), remarks: '' });
    setAdvanceModal(true);
  };

  const saveAdvance = async () => {
    if (!advForm.staffId || !advForm.amount) { toast.error('Fill required fields'); return; }
    try {
      await api.post('/advances', { staffId: Number(advForm.staffId), amount: advForm.amount, date: advForm.date, deductMonth: advForm.deductMonth, remarks: advForm.remarks });
      toast.success('Advance recorded');
      setAdvanceModal(false);
      fetchAll();
    } catch { toast.error('Error'); }
  };

  const deleteAdvance = async (id: number) => {
    if (!confirm('Delete advance?')) return;
    try {
      await api.delete('/advances/' + id);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Error'); }
  };

  // FnF
  const openFnf = (s: Staff) => {
    setFnfStaff(s);
    setFnfDate(getToday());
    setFnfModal(true);
  };

  const processFnf = async () => {
    if (!fnfStaff) return;
    if (!confirm('Process Full & Final settlement?')) return;
    try {
      await api.post(`/staff/${fnfStaff.id}/fnf`, { lastWorkingDate: fnfDate });
      toast.success('FnF processed');
      setFnfModal(false);
      fetchAll();
    } catch { toast.error('Error'); }
  };

  return (
    <div>
      {/* Staff List */}
      <div className="salary-section">
        <div className="section-header">
          <h3><span className="material-icons">group</span> Staff List</h3>
          <button className="btn btn-primary" onClick={openNewStaff}><span className="material-icons">person_add</span> New Joining</button>
        </div>
        <table className="report-table">
          <thead><tr><th>Code</th><th>Name</th><th>Designation</th><th>Salary</th><th>DOJ</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {staff.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No staff. Click "New Joining".</td></tr> :
              staff.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.staffCode}</strong></td><td>{s.name}</td><td>{s.designation}</td>
                  <td className="amount">{formatCurrency(s.salary)}</td><td>{formatDate(s.doj)}</td>
                  <td><span className={`badge ${s.status === 'left' ? 'badge-left' : 'badge-active'}`}>{s.status === 'left' ? 'Left' : 'Active'}</span></td>
                  <td>{s.status !== 'left' ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-small" onClick={() => openEditStaff(s)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => openFnf(s)}>FnF</button>
                    </div>
                  ) : '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Attendance */}
      <div className="salary-section" style={{ marginTop: '24px' }}>
        <div className="section-header">
          <h3><span className="material-icons">event_available</span> Attendance</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select value={attEmployee} onChange={(e) => setAttEmployee(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--input-border)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
              <option value="">Select Employee</option>
              {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
            </select>
            <input type="month" value={attMonth} onChange={(e) => setAttMonth(e.target.value)} className="month-selector" />
          </div>
        </div>
        {renderCalendar()}
      </div>

      {/* Advances */}
      <div className="salary-section" style={{ marginTop: '24px' }}>
        <div className="section-header">
          <h3><span className="material-icons">account_balance_wallet</span> Salary Advances</h3>
          <button className="btn btn-primary btn-small" onClick={openAdvanceModal}><span className="material-icons" style={{ fontSize: '14px' }}>add</span> Record Advance</button>
        </div>
        <table className="report-table">
          <thead><tr><th>Employee</th><th>Amount</th><th>Date</th><th>Deduct Month</th><th>Remarks</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {advances.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No advances</td></tr> :
              advances.map(a => (
                <tr key={a.id}>
                  <td>{a.staff?.name || 'Unknown'}</td><td className="amount">{formatCurrency(a.amount)}</td>
                  <td>{formatDate(a.date)}</td><td>{a.deductMonth || '-'}</td><td>{a.remarks || '-'}</td>
                  <td>{a.deducted ? <span className="salary-paid">Deducted</span> : <span className="salary-unpaid">Pending</span>}</td>
                  <td>{!a.deducted && <button className="btn btn-danger btn-small" onClick={() => deleteAdvance(a.id)}>Delete</button>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Salary Calculation */}
      <div className="salary-section" style={{ marginTop: '24px' }}>
        <div className="section-header">
          <h3><span className="material-icons">calculate</span> Salary Calculation</h3>
          <input type="month" value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} className="month-selector" />
        </div>
        <div className="table-wrapper">
          <table className="report-table">
            <thead><tr><th>Name</th><th>Designation</th><th>Monthly</th><th>Days</th><th>Present</th><th>Absent</th><th>Per Day</th><th>Gross</th><th>Advance</th><th>Net</th><th>Status</th></tr></thead>
            <tbody>
              {salaryData.length === 0 ? <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No active staff</td></tr> :
                salaryData.map((s: any) => (
                  <tr key={s.staff.id}>
                    <td><strong>{s.staff.name}</strong></td><td>{s.staff.designation}</td>
                    <td className="amount">{formatCurrency(s.staff.salary)}</td>
                    <td>{s.daysInMonth}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{s.presentDays}</td>
                    <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{s.absentDays}</td>
                    <td className="amount">{formatCurrency(s.perDay)}</td>
                    <td className="amount">{formatCurrency(s.gross)}</td>
                    <td className="amount" style={{ color: 'var(--accent-red)' }}>{formatCurrency(s.totalAdvance)}</td>
                    <td className="amount" style={{ fontWeight: 700 }}>{formatCurrency(s.net)}</td>
                    <td>{s.isPaid ? <span className="salary-paid">Paid</span> : <span className="salary-unpaid">Unpaid</span>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      <Modal open={staffModal} onClose={() => setStaffModal(false)} title={editStaffId ? 'Edit Staff' : 'New Joining'}
        footer={<><button className="btn btn-secondary" onClick={() => setStaffModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveStaff}>Save</button></>}>
        <div className="form-group"><label>Name</label><input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Designation</label>
          <select value={staffForm.designation} onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}>
            <option value="">Select</option><option value="Receptionist">Receptionist</option><option value="Housekeeping">Housekeeping</option>
            <option value="Kitchen">Kitchen</option><option value="Manager">Manager</option><option value="Maintenance">Maintenance</option><option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Salary</label><input type="number" value={staffForm.salary || ''} onChange={(e) => setStaffForm({ ...staffForm, salary: Number(e.target.value) })} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Date of Joining</label><input type="date" value={staffForm.doj} onChange={(e) => setStaffForm({ ...staffForm, doj: e.target.value })} /></div>
      </Modal>

      {/* Absent Modal */}
      <Modal open={absentModal} onClose={() => setAbsentModal(false)} title="Mark Absent"
        footer={<><button className="btn btn-secondary" onClick={() => setAbsentModal(false)}>Cancel</button><button className="btn btn-danger" onClick={saveAbsent}>Mark Absent</button></>}>
        <p><strong>{absentData.empName}</strong> — {formatDate(absentData.date)}</p>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Remark</label><input value={absentData.remark} onChange={(e) => setAbsentData({ ...absentData, remark: e.target.value })} placeholder="Optional" /></div>
      </Modal>

      {/* Advance Modal */}
      <Modal open={advanceModal} onClose={() => setAdvanceModal(false)} title="Record Advance"
        footer={<><button className="btn btn-secondary" onClick={() => setAdvanceModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveAdvance}>Save</button></>}>
        <div className="form-group"><label>Employee</label>
          <select value={advForm.staffId} onChange={(e) => setAdvForm({ ...advForm, staffId: e.target.value })}>
            <option value="">Select</option>
            {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Amount</label><input type="number" value={advForm.amount || ''} onChange={(e) => setAdvForm({ ...advForm, amount: Number(e.target.value) })} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Date</label><input type="date" value={advForm.date} onChange={(e) => setAdvForm({ ...advForm, date: e.target.value })} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Deduct Month</label><input type="month" value={advForm.deductMonth} onChange={(e) => setAdvForm({ ...advForm, deductMonth: e.target.value })} /></div>
        <div className="form-group" style={{ marginTop: '12px' }}><label>Remarks</label><input value={advForm.remarks} onChange={(e) => setAdvForm({ ...advForm, remarks: e.target.value })} /></div>
      </Modal>

      {/* FnF Modal */}
      <Modal open={fnfModal} onClose={() => setFnfModal(false)} title="Full & Final Settlement"
        footer={<><button className="btn btn-secondary" onClick={() => setFnfModal(false)}>Cancel</button><button className="btn btn-danger" onClick={processFnf}>Process FnF</button></>}>
        {fnfStaff && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div><small style={{ color: 'var(--text-muted)' }}>Name</small><br /><strong>{fnfStaff.name}</strong></div>
              <div><small style={{ color: 'var(--text-muted)' }}>Designation</small><br /><strong>{fnfStaff.designation}</strong></div>
              <div><small style={{ color: 'var(--text-muted)' }}>Salary</small><br /><strong>{formatCurrency(fnfStaff.salary)}</strong></div>
              <div><small style={{ color: 'var(--text-muted)' }}>DOJ</small><br /><strong>{formatDate(fnfStaff.doj)}</strong></div>
            </div>
            <div className="form-group"><label>Last Working Date</label><input type="date" value={fnfDate} onChange={(e) => setFnfDate(e.target.value)} /></div>
          </>
        )}
      </Modal>
    </div>
  );
}
