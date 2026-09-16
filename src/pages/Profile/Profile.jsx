import { useState } from 'react';
import { LogOut, Save } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast/Toast';
import './Profile.css';

const Profile = () => {
  const { state, updateUserProfile } = useExpense();
  const { logOut, changePassword, currentUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(state.user.name);
  const [currency, setCurrency] = useState(state.user.currency);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const getInitials = (n) =>
    (n || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Is this a Google / OAuth user? (no password to change)
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
    <div className="page-container profile-container">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>

      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {getInitials(state.user.name)}
        </div>
        <div className="profile-info">
          <h2>{state.user.name}</h2>
          <p>{state.user.email}</p>
          <div className="badge badge-success" style={{ marginTop: '8px' }}>
            {isGoogleUser ? 'Google Account' : 'Email Account'}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <form className="settings-card" onSubmit={handleSaveProfile}>
        <h3 className="settings-card-title">Personal Information</h3>

        <div className="grid-2">
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
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={state.user.email}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title="Email cannot be changed here"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Display Currency</label>
            <select
              className="form-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">₹ Indian Rupee (INR)</option>
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password Change — only for email users */}
      {!isGoogleUser && (
        <form className="settings-card" onSubmit={handlePasswordChange}>
          <h3 className="settings-card-title">Security</h3>

          <div className="grid-2">
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
          </div>

          <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isChangingPw || !currentPassword || !newPassword}
            >
              {isChangingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {/* Logout */}
      <div className="settings-card danger-zone">
        <h3 className="settings-card-title">Danger Zone</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: 'var(--text-sm)' }}>
          Once you log out, you will need to re-enter your credentials to access your data.
        </p>
        <button className="btn btn-danger" onClick={handleLogout}>
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
};

export default Profile;
