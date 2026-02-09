import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Profile {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New PIN do not match');
      return;
    }

    if (!/^\d{4}$/.test(passwordForm.newPassword)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      toast.error('New PIN must be different from old PIN');
      return;
    }

    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('PIN changed successfully');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change PIN');
    }
  };

  if (loading) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="material-icons">settings</span>
          Settings
        </h2>
      </div>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Profile Information */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons">person</span>
            Profile Information
          </h3>

          {profile && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={profile.name} disabled />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile.email} disabled />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={profile.phone || '-'} disabled />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  style={{ textTransform: 'capitalize' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Change PIN */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons">lock</span>
            Change PIN
          </h3>

          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group">
              <label>Current PIN (4 digits) *</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value.replace(/\D/g, '') })}
                placeholder="Enter current 4-digit PIN"
                required
              />
            </div>
            <div className="form-group">
              <label>New PIN (4 digits) *</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value.replace(/\D/g, '') })}
                placeholder="Enter new 4-digit PIN"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New PIN *</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value.replace(/\D/g, '') })}
                placeholder="Re-enter new 4-digit PIN"
                required
              />
            </div>
            <div style={{
              padding: '12px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#856404'
            }}>
              ℹ️ Your PIN must be exactly 4 digits (numbers only)
            </div>
            <div>
              <button type="submit" className="btn-primary">
                <span className="material-icons">lock_reset</span>
                Change PIN
              </button>
            </div>
          </form>
        </div>

        {/* System Information */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons">info</span>
            System Information
          </h3>

          <div style={{ display: 'grid', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Application:</span>
              <strong>The Neelkanth Grand CRM</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Version:</span>
              <strong>1.0.0</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Managed by:</span>
              <strong>Aks Hospitality</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
