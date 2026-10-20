import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast/Toast';
import Layout from './components/Layout/Layout';

import Dashboard from './pages/Dashboard/Dashboard';
import AddExpense from './pages/AddExpense/AddExpense';
import History from './pages/History/History';
import People from './pages/People/People';
import Reports from './pages/Reports/Reports';
import Budget from './pages/Budget/Budget';
import Auth from './pages/Auth/Auth';
import Profile from './pages/Profile/Profile';
import Intro from './pages/Intro/Intro';

const AuthLoader = () => (
  <div className="auth-loader">
    <div className="auth-loader-spinner" />
    <p className="auth-loader-text">Loading ExpenseTrack...</p>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return <AuthLoader />;
  if (!currentUser) {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    return <Navigate to={hasSeenIntro ? '/auth' : '/intro'} replace />;
  }
  return children;
};

function App() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return <AuthLoader />;

  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route path="/intro" element={<Intro />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
