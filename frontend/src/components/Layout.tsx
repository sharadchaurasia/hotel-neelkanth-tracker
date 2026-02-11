import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const tabs = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/inventory', label: 'Inventory', icon: 'meeting_room' },
  { path: '/ledger', label: 'Ledger', icon: 'account_balance' },
  { path: '/aks-office', label: 'AKS Office', icon: 'business_center' },
  { path: '/reports', label: 'Reports', icon: 'assessment' },
  { path: '/daybook', label: 'Day Book', icon: 'menu_book' },
  { path: '/salary', label: 'Salary', icon: 'badge' },
  { path: '/agents', label: 'Agents', icon: 'group' },
  { path: '/users', label: 'Users', icon: 'people' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Layout() {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        {/* Logo & Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="material-icons">hotel</span>
          </div>
          <div className="sidebar-brand">
            <h1>The Neelkanth Grand</h1>
            <p>By AKS Hospitality - CRM</p>
          </div>
        </div>

        {/* New Booking Button */}
        <NavLink to="/new-booking" className="sidebar-new-booking" style={{ textDecoration: 'none' }}>
          <span className="material-icons">add</span>
          New Booking
        </NavLink>

        {/* KOT Button */}
        <NavLink to="/?openKOT=true" className="sidebar-kot-button" style={{ textDecoration: 'none' }}>
          <span className="material-icons">restaurant_menu</span>
          New KOT Order
        </NavLink>

        {/* Navigation Items */}
        <div className="sidebar-nav">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}
              style={{ textDecoration: 'none' }}
            >
              <span className="material-icons">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/kot"
            className={({ isActive }) => isActive ? 'sidebar-item active' : 'sidebar-item'}
            style={{ textDecoration: 'none' }}
          >
            <span className="material-icons">restaurant</span>
            <span>KOT Orders</span>
          </NavLink>
        </div>

        {/* User Profile & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">Admin</div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            <span className="material-icons" style={{ fontSize: '18px' }}>logout</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
