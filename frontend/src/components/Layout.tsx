import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DropdownItem {
  path: string;
  label: string;
  icon: string;
}

interface NavItem {
  label: string;
  icon: string;
  path?: string;
  dropdown?: DropdownItem[];
  highlight?: boolean;
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/',
  },
  {
    label: 'Bookings',
    icon: 'calendar_month',
    dropdown: [
      { path: '/new-booking', label: 'New Booking', icon: 'add_circle' },
      { path: '/inventory', label: 'Inventory', icon: 'meeting_room' },
    ],
  },
  {
    label: 'Finance',
    icon: 'account_balance_wallet',
    dropdown: [
      { path: '/ledger', label: 'Ledger', icon: 'account_balance' },
      { path: '/aks-office', label: 'AKS Office', icon: 'business_center' },
      { path: '/daybook', label: 'Day Book', icon: 'menu_book' },
    ],
  },
  {
    label: 'KOT Orders',
    icon: 'restaurant_menu',
    dropdown: [
      { path: '/?openKOT=true', label: 'New KOT Order', icon: 'add_circle' },
      { path: '/kot', label: 'View Orders', icon: 'restaurant' },
    ],
    highlight: true,
  },
  {
    label: 'Manage',
    icon: 'admin_panel_settings',
    dropdown: [
      { path: '/agents', label: 'Agents', icon: 'group' },
      { path: '/salary', label: 'Salary', icon: 'badge' },
      { path: '/users', label: 'Users', icon: 'people' },
    ],
  },
  {
    label: 'Reports',
    icon: 'assessment',
    path: '/reports',
  },
  {
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
  },
];

export default function Layout() {
  const [userName, setUserName] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isPathActive = (path: string, dropdown?: DropdownItem[]) => {
    if (path && location.pathname === path) return true;
    if (dropdown) {
      return dropdown.some(item => location.pathname === item.path || location.pathname.startsWith(item.path));
    }
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>
      {/* Top Header Bar */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        overflow: 'visible',
      }}>
        {/* Company Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
            }}>
              <span className="material-icons" style={{ fontSize: '32px', color: 'white' }}>hotel</span>
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '0.5px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}>
                The Neelkanth Grand
              </h1>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: '500',
              }}>
                By AKS Hospitality - Hotel Management System
              </p>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '10px 16px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{userName}</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Administrator</div>
              </div>
              <span className="material-icons" style={{ fontSize: '20px' }}>
                {userDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {userDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                overflow: 'hidden',
                animation: 'slideDown 0.2s ease',
                zIndex: 1100,
              }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 18px',
                    border: 'none',
                    background: 'transparent',
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '20px' }}>logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          padding: '0 32px',
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'thin',
        }}>
          {navigationItems.map((item) => {
            const isActive = isPathActive(item.path || '', item.dropdown);

            if (item.path) {
              // Simple link without dropdown
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.85)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    borderBottom: isActive ? '3px solid #fbbf24' : '3px solid transparent',
                    background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                    }
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '20px' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            }

            // Dropdown menu
            return (
              <div
                key={item.label}
                style={{ position: 'relative' }}
              >
                <button
                  onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.85)',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: item.highlight
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : isActive
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '3px solid #fbbf24' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    borderRadius: item.highlight ? '8px 8px 0 0' : '0',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !item.highlight) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !item.highlight) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                    }
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '20px' }}>{item.icon}</span>
                  {item.label}
                  <span className="material-icons" style={{ fontSize: '18px' }}>
                    {activeDropdown === item.label ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {activeDropdown === item.label && item.dropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '0px',
                      background: 'white',
                      borderRadius: '0 8px 8px 8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      minWidth: '220px',
                      overflow: 'hidden',
                      animation: 'slideDown 0.2s ease',
                      zIndex: 9999,
                    }}>
                    {item.dropdown.map((dropItem) => (
                      <NavLink
                        key={dropItem.path}
                        to={dropItem.path}
                        onClick={() => setActiveDropdown(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 18px',
                          color: '#1e293b',
                          fontSize: '14px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          background: location.pathname === dropItem.path ? '#f1f5f9' : 'transparent',
                          borderLeft: location.pathname === dropItem.path ? '3px solid #3b82f6' : '3px solid transparent',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f1f5f9';
                          e.currentTarget.style.paddingLeft = '22px';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = location.pathname === dropItem.path ? '#f1f5f9' : 'transparent';
                          e.currentTarget.style.paddingLeft = '18px';
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px', color: '#3b82f6' }}>
                          {dropItem.icon}
                        </span>
                        {dropItem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: '#f8fafc',
      }}>
        <Outlet />
      </main>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        nav::-webkit-scrollbar {
          height: 4px;
        }

        nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
