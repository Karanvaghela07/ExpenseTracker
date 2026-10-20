import { NavLink, Link } from 'react-router-dom';
import { CreditCard, ArrowLeftRight, PieChart, LayoutPanelTop, LayoutGrid, Plus } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/',        icon: CreditCard,     label: 'Home'    },
  { path: '/history', icon: ArrowLeftRight, label: 'History' },
  { path: '/reports', icon: PieChart,       label: 'Reports' },
  { path: '/budget',  icon: LayoutPanelTop, label: 'Budget'  },
  { path: '/people',  icon: LayoutGrid,     label: 'People'  },
];

const BottomNav = () => (
  <div className="dock-wrapper">
    <div className="dock-container">
      <div className="dock-nav-items">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}
          >
            <div className="dock-icon-wrapper">
              <item.icon size={19} strokeWidth={2} />
            </div>
            <span className="dock-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
      <Link to="/add" className="dock-add-btn" aria-label="Add Expense">
        <Plus size={22} strokeWidth={2.6} />
      </Link>
    </div>
  </div>
);

export default BottomNav;
