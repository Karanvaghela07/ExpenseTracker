import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Clock, Settings } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/add', icon: PlusCircle, label: 'Add', special: true },
  { path: '/reports', icon: LayoutDashboard, label: 'Reports' }, // Reusing icon for simplicity, or we could use BarChart3
  { path: '/profile', icon: Settings, label: 'Profile' },
];

import { BarChart3 } from 'lucide-react';
navItems[3].icon = BarChart3;

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => 
              `bottom-nav-item ${isActive ? 'active' : ''} ${item.special ? 'special' : ''}`
            }
          >
            <div className="bottom-nav-icon">
              <item.icon size={item.special ? 24 : 20} />
            </div>
            {!item.special && <span className="bottom-nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
