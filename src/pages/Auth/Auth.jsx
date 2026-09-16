import { useState } from 'react';
import { IndianRupee, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast/Toast';
import './Auth.css';

const getFriendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

const Auth = () => {
  const { signUp, logIn, signInWithGoogle } = useAuth();
  const { addToast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        await logIn(email, password);
        addToast('Welcome back!', 'success');
      } else {
        if (!name.trim()) {
          addToast('Please enter your name', 'error');
          setIsLoading(false);
          return;
        }
        await signUp(name.trim(), email, password);
        addToast('Account created successfully!', 'success');
      }
    } catch (err) {
      addToast(getFriendlyError(err.code), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      addToast('Welcome!', 'success');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        addToast(getFriendlyError(err.code), 'error');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo">
          <IndianRupee size={28} />
        </div>
        <h1 className="auth-brand">Expense Tracker</h1>
        <p className="auth-tagline">Track spending. Stay in control.</p>
      </div>

      <div className="auth-sheet">
        <h2 className="auth-sheet-title">
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="auth-sheet-sub">
          {isLogin
            ? 'Sign in to continue to your dashboard'
            : 'Sign up to start tracking expenses'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="auth-field">
                <User size={18} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="auth-field">
              <Mail size={18} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="auth-field">
              <Lock size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <button
          type="button"
          className="auth-google"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" width="20" height="20" />
          {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" className="auth-link" onClick={switchMode}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
