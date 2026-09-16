import { NavLink } from 'react-router-dom';
import { CreditCard, ArrowLeftRight, PieChart, LayoutPanelTop, LayoutGrid } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/',        icon: CreditCard,     label: 'Home'    },
  { path: '/history', icon: ArrowLeftRight, label: 'History' },
  { path: '/reports', icon: PieChart,       label: 'Reports' },
  { path: '/budget',  icon: LayoutPanelTop, label: 'Budget'  },
  { path: '/people',  icon: LayoutGrid,     label: 'More'    },
];

const BottomNav = () => (
  <nav className="bottom-nav">
    <div className="bottom-nav-container">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' active' : ''}`
          }
        >
          {({ isActive }) => (
            <div className={`bottom-nav-icon-wrap${isActive ? ' active-pill' : ''}`}>
              <item.icon
                size={isActive ? 22 : 20}
                strokeWidth={isActive ? 2 : 1.6}
              />
            </div>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
