import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  permissions: Record<string, string[]>;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', phone: '', role: 'staff', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (id: number) => {
    const newPassword = prompt('Enter new 4-digit PIN (leave empty for default 1234):');

    // User cancelled
    if (newPassword === null) return;

    // Validate if password was provided
    if (newPassword && !/^\d{4}$/.test(newPassword)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    try {
      const { data } = await api.post(`/users/${id}/reset-password`, {
        newPassword: newPassword || undefined
      });
      toast.success(`Password reset. New PIN: ${data.tempPassword}`, { duration: 5000 });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleResetAllPasswords = async () => {
    if (!confirm('Reset ALL user passwords? This cannot be undone.')) return;
    try {
      await api.post('/users/reset-all-passwords');
      toast.success('All passwords have been reset');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset passwords');
    }
  };

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">people</span>
          User Management
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleResetAllPasswords} className="btn-secondary">
            <span className="material-icons">lock_reset</span>
            Reset All Passwords
          </button>
          <button onClick={() => { setShowModal(true); setEditingUser(null); setFormData({ name: '', email: '', phone: '', role: 'staff', password: '' }); }} className="btn-primary">
            <span className="material-icons">person_add</span>
            Add User
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <span className={`badge ${user.role === 'super_admin' ? 'badge-success' : user.role === 'admin' ? 'badge-info' : 'badge-default'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {user.mustChangePassword && (
                    <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Must Change Password</span>
                  )}
                </td>
                <td>
                  <button onClick={() => handleEdit(user)} className="btn-icon" title="Edit">
                    <span className="material-icons">edit</span>
                  </button>
                  <button onClick={() => handleResetPassword(user.id)} className="btn-icon" title="Reset Password">
                    <span className="material-icons">lock_reset</span>
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="btn-icon btn-danger" title="Delete">
                    <span className="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">{editingUser ? 'edit' : 'person_add'}</span>
                {editingUser ? 'Edit User' : 'Add User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
            </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" onClick={(e) => { e.preventDefault(); handleSubmit(e as any); }} className="btn-primary">
                {editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
