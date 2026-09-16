import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, ArrowLeft } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast/Toast';
import './Profile.css';

const Profile = () => {
  const { state, updateUserProfile } = useExpense();
  const { logOut, changePassword, currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(state.user.name);
  const [currency, setCurrency] = useState(state.user.currency);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const getInitials = (n) =>
    (n || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const isGoogleUser = currentUser?.providerData?.[0]?.providerId === 'google.com';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({ name: name.trim(), currency });
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      addToast('Please fill all password fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }
    setIsChangingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      addToast('Password changed successfully', 'success');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        addToast('Current password is incorrect', 'error');
      } else {
        addToast('Failed to change password', 'error');
      }
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      addToast('Logged out successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to log out', 'error');
    }
  };

  return (
    <div className="page-container bank-page">
      <div className="bank-hero prof-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <button type="button" className="bank-icon-btn" onClick={handleLogout} aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
        <div className="prof-hero-user">
          <div className="prof-avatar">{getInitials(state.user.name)}</div>
          <h1 className="bank-hero-title">{state.user.name}</h1>
          <p className="bank-hero-sub">{state.user.email}</p>
          <div className="bank-hero-pills" style={{ justifyContent: 'center' }}>
            <span className="bank-hero-pill">
              {isGoogleUser ? 'Google Account' : 'Email Account'}
            </span>
          </div>
        </div>
      </div>

      <div className="bank-sheet">
        <form className="prof-card" onSubmit={handleSaveProfile}>
          <h2 className="prof-card-title">Personal information</h2>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={state.user.email} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Display Currency</label>
            <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {!isGoogleUser && (
          <form className="prof-card" onSubmit={handlePasswordChange}>
            <h2 className="prof-card-title">Security</h2>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              disabled={isChangingPw || !currentPassword || !newPassword}
            >
              {isChangingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="prof-card prof-danger">
          <h2 className="prof-card-title">Log out</h2>
          <p className="prof-danger-text">You&apos;ll need to sign in again to access your data.</p>
          <button type="button" className="btn btn-danger" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
