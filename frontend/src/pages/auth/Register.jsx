import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Field MUST be outside the component to avoid remounting on every keystroke
function Field({ name, label, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
      <input
        name={name} type={type} placeholder={placeholder}
        value={value} onChange={onChange} className="auth-input"
        style={{ ...s.input, borderColor: error ? '#FCA5A5' : '#E2E8F0' }}
        required
      />
      {error && <span style={s.err}>{Array.isArray(error) ? error[0] : error}</span>}
    </div>
  );
}

export default function Register() {
  const [form, setForm]       = useState({ email: '', nom: '', prenom: '', role: 'patient', password: '', password2: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { setErrors({ password2: 'Les mots de passe ne correspondent pas.' }); return; }
    if (form.password.length < 8)          { setErrors({ password: 'Minimum 8 caractères.' }); return; }
    setLoading(true); setErrors({});
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/inscription/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) { toast.success('Compte créé ! Connectez-vous.'); navigate('/login'); }
      else { setErrors(data); toast.error("Erreur lors de l'inscription."); }
    } catch { toast.error('Impossible de contacter le serveur.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pulseOrb  { 0%,100%{transform:scale(1);opacity:.18} 50%{transform:scale(1.15);opacity:.3} }
        @keyframes pulseOrb2 { 0%,100%{transform:scale(1);opacity:.1}  50%{transform:scale(1.1); opacity:.2} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:none} }
        .login-btn { transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s !important; }
        .login-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.02) !important; box-shadow: 0 8px 24px rgba(37,99,235,0.5) !important; }
        .login-btn:active { transform: scale(.97) !important; }
        .auth-input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important; outline: none !important; }
      `}</style>

      <div style={s.orb1} /><div style={s.orb2} /><div style={s.orb3} />
      <div style={s.grid} />

      <div style={s.card}>
        <div style={s.logoWrap}>
          <img src="/logo-heec.png" alt="HEEC" style={s.logo} />
        </div>
        <h2 style={s.title}>Créer un compte MedStack</h2>
        <p style={s.subtitle}>Rejoignez la communauté médicale HEEC</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field name="prenom" label="Prénom" placeholder="Votre prénom" value={form.prenom} onChange={handleChange} error={errors.prenom} />
            <Field name="nom"    label="Nom"    placeholder="Votre nom"    value={form.nom}    onChange={handleChange} error={errors.nom} />
          </div>
          <Field name="email" label="Email" type="email" placeholder="votre@email.com" value={form.email} onChange={handleChange} error={errors.email} />

          <div style={s.field}>
            <label style={s.label}>Je suis <span style={{ color: '#EF4444' }}>*</span></label>
            <select name="role" value={form.role} onChange={handleChange} className="auth-input" style={s.input}>
              <option value="patient">Patient</option>
              <option value="etudiant">Étudiant en médecine</option>
              <option value="medecin">Médecin / Professionnel de santé</option>
            </select>
          </div>

          <Field name="password"  label="Mot de passe (min. 8 caractères)" type="password" placeholder="••••••••"           value={form.password}  onChange={handleChange} error={errors.password} />
          <Field name="password2" label="Confirmer le mot de passe"         type="password" placeholder="Répétez le mot de passe" value={form.password2} onChange={handleChange} error={errors.password2} />

          <button type="submit" className="login-btn"
            style={{ ...s.button, opacity: loading ? 0.8 : 1, cursor: loading ? 'wait' : 'pointer' }}
            disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p style={s.footer}>Déjà un compte ? <Link to="/login" style={s.link}>Se connecter</Link></p>
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
  card:     { position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', width: '100%', maxWidth: '480px', padding: '2.5rem', animation: 'cardIn 0.5s cubic-bezier(.22,1,.36,1) both' },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' },
  logo:     { height: '56px', objectFit: 'contain', background: '#fff', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title:    { textAlign: 'center', fontSize: '22px', fontWeight: '800', color: '#0B1628', margin: '0 0 4px', fontFamily: '"DM Serif Display", serif' },
  subtitle: { textAlign: 'center', fontSize: '13px', color: '#94A3B8', marginBottom: '1.5rem' },
  form:     { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  field:    { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:    { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input:    { padding: '10px 13px', border: '1.5px solid', borderRadius: '9px', fontSize: '14px', fontFamily: 'Sora, sans-serif', color: '#0F172A', background: '#fff', transition: 'border-color .2s, box-shadow .2s' },
  err:      { fontSize: '11px', color: '#DC2626', marginTop: '2px' },
  button:   { padding: '13px', background: 'linear-gradient(135deg, #1B4FBF, #2563EB)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 16px rgba(37,99,235,0.4)', fontFamily: 'Sora, sans-serif' },
  footer:   { textAlign: 'center', marginTop: '1.5rem', fontSize: '13px', color: '#64748B' },
  link:     { color: '#1B4FBF', fontWeight: '600', textDecoration: 'none' },
};
