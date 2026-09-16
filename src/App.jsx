import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast/Toast';
import Layout from './components/Layout/Layout';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import AddExpense from './pages/AddExpense/AddExpense';
import History from './pages/History/History';
import People from './pages/People/People';
import Reports from './pages/Reports/Reports';
import Budget from './pages/Budget/Budget';
import Auth from './pages/Auth/Auth';
import Profile from './pages/Profile/Profile';

// Show a full-screen loader while Firebase resolves the auth session
const AuthLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-lg)',
    flexDirection: 'column',
    gap: '16px',
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid var(--bg-surface)',
      borderTop: '3px solid var(--accent-violet)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    Loading...
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return <AuthLoader />;
  return currentUser ? children : <Navigate to="/auth" replace />;
};

function App() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return <AuthLoader />;

  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route
            path="/auth"
            element={currentUser ? <Navigate to="/" replace /> : <Auth />}
          />

          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="add" element={<AddExpense />} />
            <Route path="history" element={<History />} />
            <Route path="people" element={<People />} />
            <Route path="reports" element={<Reports />} />
            <Route path="budget" element={<Budget />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
