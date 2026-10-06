import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { connexion, getProfil } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

// Module-level var — survives React StrictMode double-mount/unmount
let _savedError = '';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(() => {
    // Read from sessionStorage on every mount — survives StrictMode
    return sessionStorage.getItem('login_error') || '';
  });
  const { login }             = useAuthStore();
  const navigate              = useNavigate();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await connexion(form);
      const { access, refresh } = res.data;
      localStorage.setItem('access_token', access);
      const profilRes = await getProfil();
      login(profilRes.data, access, refresh);
      sessionStorage.removeItem('login_error');
      _savedError = '';
      setError('');
      toast.success(`Bienvenue ${profilRes.data.prenom} !`);
      navigate('/');
    } catch (err) {
      const status = err?.response?.status;
      const msg = !status
        ? 'Impossible de contacter le serveur.'
        : 'Aucun compte trouvé avec ces identifiants. Vérifiez votre email et mot de passe.';
      sessionStorage.setItem('login_error', msg);
      _savedError = msg;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pulseOrb  { 0%,100%{transform:scale(1);opacity:.18} 50%{transform:scale(1.15);opacity:.3} }
        @keyframes pulseOrb2 { 0%,100%{transform:scale(1);opacity:.1}  50%{transform:scale(1.1); opacity:.2} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        .login-btn { transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s !important; }
        .login-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.02) !important; box-shadow: 0 8px 24px rgba(37,99,235,0.5) !important; }
        .login-btn:active { transform: scale(.97) !important; }
        .auth-input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important; outline: none !important; }
        .error-box { animation: shake 0.35s ease; }
      `}</style>

      <div style={s.orb1} /><div style={s.orb2} /><div style={s.orb3} />
      <div style={s.grid} />

      <div style={s.card}>
        <div style={s.logoWrap}>
          <img src="/logo-heec.png" alt="HEEC" style={s.logo} />
        </div>
        <h2 style={s.title}>Connexion à MedStack</h2>
        <p style={s.subtitle}>Plateforme médicale HEEC Marrakech</p>

        {error && (
          <div className="error-box" style={s.errorBox}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Adresse email</label>
            <input name="email" type="email" placeholder="votre@email.com"
              value={form.email} onChange={handleChange} className="auth-input"
              style={{ ...s.input, borderColor: error ? '#FCA5A5' : '#E2E8F0' }} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Mot de passe</label>
            <input name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handleChange} className="auth-input"
              style={{ ...s.input, borderColor: error ? '#FCA5A5' : '#E2E8F0' }} required />
          </div>
          <button type="submit" className="login-btn"
            style={{ ...s.button, opacity: loading ? 0.8 : 1, cursor: loading ? 'wait' : 'pointer' }}
            disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={s.footer}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={s.link}>S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:     { position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem', background: 'linear-gradient(135deg, #060e1f 0%, #0B1628 30%, #0f2a5e 65%, #1B4FBF 100%)', backgroundSize: '300% 300%', animation: 'gradientShift 10s ease infinite' },
  orb1:     { position: 'fixed', top: '-80px',    left: '5%',   width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', animation: 'pulseOrb 7s ease-in-out infinite',       pointerEvents: 'none' },
  orb2:     { position: 'fixed', bottom: '-80px', right: '5%',  width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)', animation: 'pulseOrb2 9s ease-in-out infinite',      pointerEvents: 'none' },
  orb3:     { position: 'fixed', top: '40%',      right: '20%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, #1B4FBF 0%, transparent 70%)', animation: 'pulseOrb 11s ease-in-out infinite 2s',  pointerEvents: 'none' },
  grid:     { position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' },
  card:     { position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', width: '100%', maxWidth: '420px', padding: '2.5rem', animation: 'cardIn 0.5s cubic-bezier(.22,1,.36,1) both' },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' },
  logo:     { height: '60px', objectFit: 'contain', background: '#fff', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title:    { textAlign: 'center', fontSize: '22px', fontWeight: '800', color: '#0B1628', margin: '0 0 4px', fontFamily: '"DM Serif Display", serif' },
  subtitle: { textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginBottom: '1.75rem' },
  errorBox: { display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '4px solid #EF4444', borderRadius: '10px', padding: '12px 14px', marginBottom: '1.25rem', fontSize: '13px', color: '#991B1B', lineHeight: '1.6' },
  form:     { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field:    { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:    { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input:    { padding: '11px 14px', border: '1.5px solid', borderRadius: '9px', fontSize: '14px', fontFamily: 'Sora, sans-serif', color: '#0F172A', background: '#fff', transition: 'border-color .2s, box-shadow .2s' },
  button:   { padding: '13px', background: 'linear-gradient(135deg, #1B4FBF, #2563EB)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', marginTop: '0.5rem', boxShadow: '0 4px 16px rgba(37,99,235,0.4)', fontFamily: 'Sora, sans-serif' },
  footer:   { textAlign: 'center', marginTop: '1.5rem', fontSize: '13px', color: '#64748B' },
  link:     { color: '#1B4FBF', fontWeight: '600', textDecoration: 'none' },
};
