import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { deconnexion, getNotifications, marquerToutesLues } from '../services/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [notifs, setNotifs]         = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [hovered, setHovered]       = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getNotifications().then(res => setNotifs(res.data)).catch(() => {});
      const t = setInterval(() => getNotifications().then(res => setNotifs(res.data)).catch(() => {}), 30000);
      return () => clearInterval(t);
    }
  }, [isAuthenticated]);

  const nonLues = notifs.filter(n => !n.est_lue).length;

  const handleLogout = async () => {
    try { await deconnexion({ refresh: localStorage.getItem('refresh_token') }); } catch {}
    logout();
    toast.success('Déconnexion réussie.');
    navigate('/login');
  };

  const handleMarquerLues = async () => {
    await marquerToutesLues();
    setNotifs(notifs.map(n => ({ ...n, est_lue: true })));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @keyframes navSlideIn {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.5); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .nav-btn {
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, background 0.2s, color 0.2s !important;
        }
        .nav-btn:hover {
          transform: translateY(-2px) scale(1.04) !important;
        }
        .nav-btn:active {
          transform: scale(0.96) !important;
        }
        .nav-link-item {
          position: relative;
          transition: color 0.2s;
        }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 50%;
          width: 0; height: 2px;
          background: #F5A623;
          border-radius: 99px;
          transition: width 0.25s cubic-bezier(.22,1,.36,1), left 0.25s cubic-bezier(.22,1,.36,1);
        }
        .nav-link-item:hover::after,
        .nav-link-item.active::after {
          width: 100%; left: 0;
        }
        .nav-link-item:hover { color: #fff !important; }
        .nav-link-item.active { color: #fff !important; font-weight: 600 !important; }
        .user-chip:hover {
          background: rgba(255,255,255,0.14) !important;
          transform: scale(1.02);
          transition: all 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .icon-btn:hover {
          background: rgba(255,255,255,0.14) !important;
          transform: scale(1.08);
          transition: all 0.18s cubic-bezier(.34,1.56,.64,1);
        }
        .logout-btn:hover {
          color: #ff6b6b !important;
          border-color: rgba(255,107,107,0.4) !important;
          transform: translateY(-1px);
          transition: all 0.18s ease;
        }
        .notif-item:hover { background: #F0F7FF !important; }
      `}</style>

      <nav style={{
        ...s.nav,
        background: scrolled ? 'rgba(8,14,28,0.97)' : '#0B1628',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : '0 2px 20px rgba(0,0,0,0.3)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'background 0.3s, box-shadow 0.3s',
        animation: 'navSlideIn 0.4s cubic-bezier(.22,1,.36,1) both',
      }}>

        {/* Logo */}
        <Link to="/" style={s.logoWrap}>
          <img src="/logo-heec.png" alt="HEEC" style={s.logoImg} />
          <div style={s.logoDivider} />
          <span style={s.logoText}>MedStack</span>
        </Link>

        {/* Right */}
        <div style={s.actions}>
          <Link
            to="/"
            className={`nav-link-item${isActive('/') ? ' active' : ''}`}
            style={s.navLink}
          >
            Questions
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/poser-question" className="nav-btn" style={s.btnPrimary}>
                <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Poser une question
              </Link>

              {/* Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  onClick={() => setShowNotifs(!showNotifs)}
                  style={s.iconBtn}
                  title="Notifications"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {nonLues > 0 && (
                    <span style={{ ...s.badge, animation: 'badgePop 0.4s cubic-bezier(.34,1.56,.64,1)' }}>
                      {nonLues}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div style={s.notifPanel}>
                    <div style={s.notifHeader}>
                      <span style={s.notifTitle}>Notifications</span>
                      <button onClick={handleMarquerLues} style={s.btnLues}>Tout marquer lu</button>
                    </div>
                    <div style={s.notifBody}>
                      {notifs.length === 0
                        ? <p style={s.noNotif}>Aucune notification</p>
                        : notifs.slice(0, 6).map(n => (
                            <div key={n.id} className="notif-item" style={{
                              ...s.notifItem,
                              background: n.est_lue ? 'transparent' : '#EFF6FF'
                            }}>
                              <span style={s.notifDot(n.est_lue)} />
                              <span style={s.notifIcon}>
                                {n.type_notif === 'reponse' ? '💬' : n.type_notif === 'vote' ? '👍' : n.type_notif === 'badge' ? '🏅' : '🔔'}
                              </span>
                              <span style={s.notifMsg}>{n.message}</span>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* User chip */}
              <Link to="/profil" className="user-chip" style={s.userChip}>
                <span style={s.avatar}>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
                <span style={s.userName}>{user?.prenom} {user?.nom}</span>
              </Link>

              {(user?.role === 'moderateur' || user?.role === 'admin') && (
                <Link to="/moderation" className="nav-btn" style={s.btnGold}>🛡️ Modération</Link>
              )}

              {user?.role === 'admin' && (
                <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer" className="nav-btn" style={s.btnOutline}>⚙️ Admin</a>
              )}

              <button onClick={handleLogout} className="logout-btn" style={s.btnLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link-item" style={s.navLink}>Connexion</Link>
              <Link to="/register" className="nav-btn" style={s.btnPrimary}>S'inscrire</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

const s = {
  nav:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', height: '64px', position: 'sticky', top: 0, zIndex: 200 },
  logoWrap:   { display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', transition: 'opacity .2s' },
  logoImg:    { height: '44px', objectFit: 'contain' },
  logoDivider:{ width: '1px', height: '26px', background: 'rgba(255,255,255,0.15)' },
  logoText:   { fontSize: '22px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px', fontFamily: '"DM Serif Display", serif' },
  actions:    { display: 'flex', alignItems: 'center', gap: '8px' },
  navLink:    { color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '14px', fontWeight: '500', padding: '4px 2px' },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'linear-gradient(135deg, #1B4FBF, #2563EB)',
    color: '#fff', padding: '8px 16px', borderRadius: '8px',
    textDecoration: 'none', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 2px 12px rgba(37,99,235,0.45)',
  },
  iconBtn:    { position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge:      { position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#fff', borderRadius: '50%', fontSize: '9px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', border: '2px solid #0B1628' },
  userChip:   { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '99px', padding: '4px 12px 4px 4px', textDecoration: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '13px' },
  avatar:     { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #F5A623, #E8912A)', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userName:   { fontSize: '13px', fontWeight: '500' },
  btnGold:    { background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)', padding: '7px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' },
  btnOutline: { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)', padding: '7px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' },
  btnLogout:  { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: 'color .2s, border-color .2s, transform .2s' },
  notifPanel: { position: 'absolute', top: '48px', right: 0, width: '340px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', zIndex: 300, overflow: 'hidden', border: '1px solid #E2E8F0', animation: 'fadeUp 0.2s ease' },
  notifHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' },
  notifTitle: { fontSize: '13px', fontWeight: '700', color: '#0F172A' },
  btnLues:    { background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  notifBody:  { maxHeight: '300px', overflowY: 'auto' },
  noNotif:    { textAlign: 'center', color: '#94A3B8', padding: '2rem', fontSize: '13px' },
  notifItem:  { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #F8FAFC', transition: 'background .15s', cursor: 'default' },
  notifDot:   (lue) => ({ width: '6px', height: '6px', borderRadius: '50%', background: lue ? 'transparent' : '#2563EB', flexShrink: 0 }),
  notifIcon:  { fontSize: '14px' },
  notifMsg:   { fontSize: '12px', color: '#374151', lineHeight: '1.5', flex: 1 },
};
