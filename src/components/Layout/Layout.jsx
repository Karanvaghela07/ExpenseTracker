import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout">
      <div className="layout-glow layout-glow-a" />
      <div className="layout-glow layout-glow-b" />
      <Sidebar />
      <main className="layout-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
