import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const tabs = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/inventory', label: 'Inventory', icon: 'meeting_room' },
  { path: '/ledger', label: 'Ledger', icon: 'account_balance' },
  { path: '/reports', label: 'Reports', icon: 'assessment' },
  { path: '/daybook', label: 'Day Book', icon: 'menu_book' },
  { path: '/salary', label: 'Salary', icon: 'badge' },
];

const moreMenuItems = [
  { path: '/kot', label: 'KOT Orders', icon: 'restaurant' },
  { path: '/aks-office', label: 'AKS Office', icon: 'business' },
  { path: '/users', label: 'Users', icon: 'people' },
  { path: '/audit', label: 'Audit Log', icon: 'history' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Layout() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name);
    }
  }, []);

  const handleMoreItemClick = (path: string) => {
    navigate(path);
    setShowMoreMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-brand">
          <div>
            <h1>AKS Hospitality</h1>
            <p>Travel & Tourism</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#7a8699', fontSize: '14px', fontWeight: '500' }}>
            {userName}
          </span>
          <button onClick={handleLogout} style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}>
            <span className="material-icons" style={{ fontSize: '18px' }}>logout</span>
            Logout
          </button>
        </div>
      </div>

      <div className="nav-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="material-icons">{tab.icon}</span> {tab.label}
          </NavLink>
        ))}

        <div className="nav-more">
          <button
            className="nav-more-button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <span className="material-icons">more_horiz</span> More
            <span className="material-icons" style={{ marginLeft: '4px', fontSize: '18px' }}>
              {showMoreMenu ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showMoreMenu && (
            <>
              <div className="nav-more-overlay" onClick={() => setShowMoreMenu(false)} />
              <div className="nav-more-dropdown">
                {moreMenuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleMoreItemClick(item.path)}
                    className="nav-more-item"
                  >
                    <span className="material-icons">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
