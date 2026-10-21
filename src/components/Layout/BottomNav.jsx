import { NavLink } from 'react-router-dom';
import { House, Play, BookOpen, UserRound } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/',        icon: House,     label: 'Home' },
  { path: '/history', icon: Play,      label: 'History' },
  { path: '/reports', icon: BookOpen,  label: 'Reports' },
  { path: '/profile', icon: UserRound, label: 'Profile' },
];

const DockItem = ({ item }) => (
  <NavLink
    to={item.path}
    end={item.path === '/'}
    className={({ isActive }) =>
      `dock-item dock-item-${item.label.toLowerCase()} ${isActive ? 'active' : ''}`
    }
  >
    <div className="dock-icon-wrapper">
      <item.icon size={19} strokeWidth={2} />
    </div>
    <span className="dock-label">{item.label}</span>
  </NavLink>
);

const BottomNav = () => {
  return (
    <div className="dock-wrapper">
      <div className="dock-container">
        <div className="dock-nav-items">
          {navItems.map((item) => (
            <DockItem key={item.path} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
