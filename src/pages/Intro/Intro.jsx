import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Intro.css';

const SLIDES = [
  {
    id: 0,
    emoji: '₹',
    title: 'Effortless expense\ntracking, every day.',
    sub: 'Understand your spending habits and take control of your finances with ease.',
  },
  {
    id: 1,
    emoji: '🤝',
    title: 'Share expenses,\nnot the stress.',
    sub: 'Split bills with friends and family, track who owes what, and settle up instantly.',
  },
  {
    id: 2,
    emoji: '💡',
    title: 'Insights that\nactually matter.',
    sub: 'Beautiful reports and smart forecasts to help you spend wisely and save more.',
  },
];

const Intro = () => {
  const [active, setActive]         = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const navigate                    = useNavigate();
  const { currentUser }             = useAuth();

  const finish = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    navigate(currentUser ? '/' : '/auth');
  };

  const go   = (n) => setActive(Math.max(0, Math.min(SLIDES.length - 1, n)));
  const next = () => { if (active < SLIDES.length - 1) go(active + 1); else finish(); };

  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd   = (e) => {
    if (touchStart === null) return;
    const d = touchStart - e.changedTouches[0].clientX;
    if (d > 50) go(active + 1);
    if (d < -50) go(active - 1);
    setTouchStart(null);
  };

  const s      = SLIDES[active];
  const isLast = active === SLIDES.length - 1;

  return (
    <div className="intro-shell" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* exact same glows as Auth page */}
      <div className="intro-glow intro-glow-a" />
      <div className="intro-glow intro-glow-b" />

      {/* top row — just skip, no slide counter */}
      <div className="intro-top">
        <span />
        {!isLast && (
          <button type="button" className="intro-chip intro-chip-btn" onClick={finish}>
            Skip
          </button>
        )}
      </div>

      {/* center content */}
      <main className="intro-main" key={active}>
        <div className="intro-emoji">{s.emoji}</div>
        <h1 className="intro-title">
          {s.title.split('\n').map((l, i) => <span key={i}>{l}</span>)}
        </h1>
        <p className="intro-sub">{s.sub}</p>
      </main>

      {/* bottom */}
      <div className="intro-bottom">
        {/* dots */}
        <div className="intro-dots">
          {SLIDES.map((_, i) => (
            <button key={i} type="button"
              className={`intro-dot ${i === active ? 'on' : ''}`}
              onClick={() => go(i)} />
          ))}
        </div>

        {/* white pill button — same as auth-white-btn */}
        <button type="button" className="intro-cta" onClick={next}>
          {isLast ? 'Get Started' : 'Continue'}
        </button>

        {isLast && (
          <button type="button" className="intro-signin" onClick={finish}>
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default Intro;
