import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/inventory', label: 'Inventory', icon: 'meeting_room' },
  { path: '/ledger', label: 'Ledger', icon: 'account_balance' },
  { path: '/reports', label: 'Reports', icon: 'assessment' },
  { path: '/daybook', label: 'Day Book', icon: 'menu_book' },
  { path: '/salary', label: 'Salary', icon: 'badge' },
];

export default function Layout() {
  return (
    <div className="app-container">
      <div className="header">
        <div className="header-brand">
          <span className="icon">🏨</span>
          <div>
            <h1>The Neelkanth Grand</h1>
            <p>by Aks Hospitality &mdash; CRM</p>
          </div>
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
      </div>

      <Outlet />
    </div>
  );
}
