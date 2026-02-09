import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

interface Agent {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  commissionPercentage: number;
  status: string;
}

const emptyAgent = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  commissionPercentage: 0,
  status: 'ACTIVE',
};

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyAgent);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/agents');
      setAgents(res.data);
    } catch {
      toast.error('Failed to load agents');
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm(emptyAgent);
    setModal(true);
  };

  const openEdit = (agent: Agent) => {
    setEditId(agent.id);
    setForm({
      name: agent.name,
      contactPerson: agent.contactPerson || '',
      phone: agent.phone || '',
      email: agent.email || '',
      commissionPercentage: agent.commissionPercentage || 0,
      status: agent.status || 'ACTIVE',
    });
    setModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    try {
      if (editId) {
        await api.put(`/agents/${editId}`, form);
        toast.success('Agent updated');
      } else {
        await api.post('/agents', form);
        toast.success('Agent created');
      }
      setModal(false);
      fetchAgents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving agent');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await api.delete(`/agents/${id}`);
      toast.success('Agent deleted');
      fetchAgents();
    } catch {
      toast.error('Error deleting agent');
    }
  };

  return (
    <div>
      <div className="section-header">
        <h3><span className="material-icons">group</span> Agents Master</h3>
        <button className="btn btn-primary" onClick={openNew}>
          <span className="material-icons">add</span> Add Agent
        </button>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact Person</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Commission %</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.id}>
              <td><strong>{agent.name}</strong></td>
              <td>{agent.contactPerson || '-'}</td>
              <td>{agent.phone || '-'}</td>
              <td>{agent.email || '-'}</td>
              <td>{agent.commissionPercentage || 0}%</td>
              <td>
                <span className={`badge ${agent.status === 'ACTIVE' ? 'badge-collected' : 'badge-pending'}`}>
                  {agent.status}
                </span>
              </td>
              <td>
                <button className="btn btn-small btn-secondary" onClick={() => openEdit(agent)} style={{ marginRight: '8px' }}>
                  <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
                </button>
                <button className="btn btn-small" onClick={() => handleDelete(agent.id)} style={{ background: '#ef4444', color: 'white' }}>
                  <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
                </button>
              </td>
            </tr>
          ))}
          {agents.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No agents found. Click "Add Agent" to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit Agent' : 'Add Agent'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editId ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Agent Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., WCT, AKS Office"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Contact Person</label>
            <input
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              placeholder="Contact name"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div className="form-group">
            <label>Commission %</label>
            <input
              type="number"
              value={form.commissionPercentage || ''}
              onChange={(e) => setForm({ ...form, commissionPercentage: Number(e.target.value) })}
              placeholder="0"
              min="0"
              max="100"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
