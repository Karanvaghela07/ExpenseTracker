import { NavLink, useLocation } from 'react-router-dom';
import { useExpense } from '../../context/ExpenseContext';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Users,
  BarChart3,
  Wallet,
  Settings,
  Menu,
  X,
  IndianRupee,
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'Main' },
  { path: '/add', icon: PlusCircle, label: 'Add Expense', section: 'Main' },
  { path: '/history', icon: Clock, label: 'History', section: 'Main' },
  { path: '/people', icon: Users, label: 'People & Balances', section: 'Manage' },
  { path: '/reports', icon: BarChart3, label: 'Reports', section: 'Manage' },
  { path: '/budget', icon: Wallet, label: 'Budget', section: 'Manage' },
  { path: '/profile', icon: Settings, label: 'Profile', section: 'Settings' },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useExpense();
  const location = useLocation();

  const sections = [...new Set(navItems.map(item => item.section))];

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <IndianRupee />
          </div>
          <div className="sidebar-brand" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span className="sidebar-brand-name">ExpenseTrack</span>
            <span className="sidebar-brand-tagline">Track every rupee</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => (
            <div key={section}>
              <div className="sidebar-section-label">{section}</div>
              {navItems
                .filter(item => item.section === section)
                .map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setIsOpen(false)}
                    end={item.path === '/'}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className="sidebar-user"
            onClick={() => setIsOpen(false)}
          >
            <div className="sidebar-avatar">
              {getInitials(state.user.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{state.user.name}</div>
              <div className="sidebar-user-email">{state.user.email}</div>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
