import { NavLink, Link } from 'react-router-dom';
import { House, Play, BookOpen, LayoutPanelTop, LayoutGrid, UserRound, Plus } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/',        icon: House,     label: 'Home' },
  { path: '/history', icon: Play,      label: 'History' },
  { path: '/reports', icon: BookOpen,  label: 'Reports' },
  { path: '/budget',  icon: LayoutPanelTop, label: 'Budget' },
  { path: '/people',  icon: LayoutGrid, label: 'People' },
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
  const leftItems = navItems.slice(0, 3);
  const rightItems = navItems.slice(3);

  return (
    <div className="dock-wrapper">
      <div className="dock-container">
        <div className="dock-nav-items">
          {leftItems.map((item) => (
            <DockItem key={item.path} item={item} />
          ))}
          <Link to="/add" className="dock-add-btn" aria-label="Add transaction">
            <Plus size={24} strokeWidth={2.5} />
          </Link>
          {rightItems.map((item) => (
            <DockItem key={item.path} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
