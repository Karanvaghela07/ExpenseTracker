import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Globe, ArrowRight, ChevronLeft, X } from 'lucide-react';
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

  const [showEmailForm, setShowEmailForm] = useState(false);
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
        addToast('Welcome back to Budget Buddy!', 'success');
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
      addToast('Welcome to Budget Buddy!', 'success');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        addToast(getFriendlyError(err.code), 'error');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-glow glow-a" />
      <div className="auth-glow glow-b" />

      <header className="auth-top">
        <Link to="/intro" className="auth-chip">
          <ChevronLeft size={15} />
          Tour
        </Link>
        <span className="auth-chip">
          <Globe size={13} />
          English
        </span>
      </header>

      <main className="auth-main">
        <div className="auth-brand">
          <h1>Budget Buddy</h1>
          <p>Seeing the Unseen with AI.</p>
        </div>

        {!showEmailForm ? (
          <div className="auth-stack">
            <button
              type="button"
              className="auth-white-btn"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt=""
                width="20"
                height="20"
              />
              {isGoogleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>
            <button
              type="button"
              className="auth-white-btn"
              onClick={() => setShowEmailForm(true)}
            >
              <Mail size={18} color="#0f172a" />
              Continue with Email
            </button>
          </div>
        ) : (
          <div className="auth-sheet">
            <div className="auth-sheet-bar">
              <button type="button" onClick={() => setShowEmailForm(false)}>
                <ChevronLeft size={16} /> Back
              </button>
              <strong>{isLogin ? 'Sign In' : 'Create Account'}</strong>
              <button type="button" onClick={() => setShowEmailForm(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <label className="auth-field">
                  <User size={16} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
              )}
              <label className="auth-field">
                <Mail size={16} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="auth-field">
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
              <button type="submit" className="auth-white-btn" disabled={isLoading}>
                {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="auth-switch"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don't have an account? Sign up free"
                  : 'Already have an account? Sign in'}
              </button>
            </form>
          </div>
        )}

        <div className="auth-foot">
          <p>Log in for a better experience</p>
          <div>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
