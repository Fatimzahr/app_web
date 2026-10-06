import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions, getTags } from '../../services/api';
import TagBadge from '../../components/TagBadge';

export default function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [tags, setTags]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statut, setStatut]       = useState('');
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => { chargerQuestions(); }, [search, statut, activeTag]);
  useEffect(() => { getTags().then(res => setTags(res.data)); }, []);

  const chargerQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)    params.search = search;
      if (statut)    params.statut = statut;
      if (activeTag) params.tag    = activeTag;
      const res = await getQuestions(params);
      setQuestions(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleTagClick = (tag) => setActiveTag(prev => prev === tag.nom ? null : tag.nom);

  const statutColor = (s) => s === 'resolue'
    ? { bg: '#D1FAE5', color: '#065F46', label: '✓ Résolue' }
    : s === 'fermee'
    ? { bg: '#FEE2E2', color: '#991B1B', label: '✕ Fermée' }
    : { bg: '#DBEAFE', color: '#1E40AF', label: '● Ouverte' };

  return (
    <div style={s.page}>
      {/* Animated hero */}
      <div style={s.hero}>
        <style>{`
          @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeUp2 {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseOrb {
            0%, 100% { transform: scale(1); opacity: 0.18; }
            50%       { transform: scale(1.12); opacity: 0.28; }
          }
          @keyframes pulseOrb2 {
            0%, 100% { transform: scale(1); opacity: 0.12; }
            50%       { transform: scale(1.08); opacity: 0.22; }
          }
          .hero-title  { animation: fadeUp  0.7s cubic-bezier(.22,1,.36,1) both; }
          .hero-sub    { animation: fadeUp2 0.7s 0.15s cubic-bezier(.22,1,.36,1) both; }
          .hero-search { animation: fadeUp2 0.7s 0.28s cubic-bezier(.22,1,.36,1) both; }
        `}</style>

        {/* Floating orbs for depth */}
        <div style={s.orb1} />
        <div style={s.orb2} />
        <div style={s.orb3} />

        {/* Subtle grid overlay */}
        <div style={s.gridOverlay} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="hero-title" style={s.heroTitle}>Questions médicales</h1>
          <p className="hero-sub" style={s.heroSub}>
            Posez vos questions, partagez vos connaissances avec la communauté HEEC
          </p>
          <div className="hero-search" style={s.searchRow}>
          <div style={s.searchWrap}>
            <svg style={s.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Rechercher une question médicale..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={s.searchInput}
            />
          </div>
          <select value={statut} onChange={e => setStatut(e.target.value)} style={s.select}>
            <option value="">Tous les statuts</option>
            <option value="ouverte">Ouverte</option>
            <option value="resolue">Résolue</option>
            <option value="fermee">Fermée</option>
          </select>
          </div>{/* close searchRow */}
        </div>{/* close inner zIndex div */}
      </div>{/* close hero */}

      <div style={s.layout}>
        {/* Sidebar — tags */}
        <aside style={s.sidebar}>
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Filtrer par spécialité</h3>
            <div style={s.tagsList}>
              {tags.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTagClick(t)}
                  style={{
                    ...s.tagBtn,
                    background: activeTag === t.nom ? '#1B4FBF' : 'transparent',
                    color:      activeTag === t.nom ? '#fff'     : '#374151',
                    fontWeight: activeTag === t.nom ? '600'      : '400',
                  }}
                >
                  {t.nom}
                  {activeTag === t.nom && <span style={s.tagX}>✕</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Stats card */}
          <div style={{ ...s.sideCard, marginTop: '1rem' }}>
            <h3 style={s.sideTitle}>Résultats</h3>
            <p style={s.statNum}>{questions.length}</p>
            <p style={s.statLabel}>question{questions.length !== 1 ? 's' : ''} trouvée{questions.length !== 1 ? 's' : ''}</p>
            {activeTag && (
              <div style={s.activeFilter}>
                🏷 Filtre : <strong>{activeTag}</strong>
                <button onClick={() => setActiveTag(null)} style={s.clearBtn}>✕</button>
              </div>
            )}
          </div>
        </aside>

        {/* Main list */}
        <main style={s.main}>
          {loading ? (
            <div style={s.loadingWrap}>
              {[1,2,3].map(i => <div key={i} style={s.skeleton} />)}
            </div>
          ) : questions.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: '40px' }}>🔍</span>
              <p style={{ fontWeight: '600', color: '#1E293B', marginTop: '1rem' }}>Aucune question trouvée</p>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Essayez d'autres mots-clés ou posez la vôtre</p>
              <Link to="/poser-question" style={s.emptyBtn}>+ Poser une question</Link>
            </div>
          ) : (
            <div style={s.list}>
              {questions.map(q => {
                const st = statutColor(q.statut);
                return (
                  <Link to={`/questions/${q.id}`} key={q.id} style={s.card}>
                    <div style={s.cardTop}>
                      <span style={{ ...s.statutPill, background: st.bg, color: st.color }}>{st.label}</span>
                      <div style={s.cardMeta}>
                        <span style={s.metaItem}>👁 {q.nb_vues}</span>
                        <span style={s.metaItem}>💬 {q.nb_reponses}</span>
                      </div>
                    </div>

                    <h2 style={s.cardTitle}>{q.titre}</h2>
                    <p style={s.cardExcerpt}>{q.contenu.replace(/\*\*/g, '').substring(0, 130)}...</p>

                    {q.tags.length > 0 && (
                      <div style={s.cardTags} onClick={e => e.preventDefault()}>
                        {q.tags.map(t => (
                          <TagBadge key={t.id} tag={t} onClick={handleTagClick} active={activeTag === t.nom} size="sm" />
                        ))}
                      </div>
                    )}

                    <div style={s.cardFooter}>
                      <div style={s.authorRow}>
                        <span style={s.authorAvatar}>{q.auteur.prenom?.[0]}{q.auteur.nom?.[0]}</span>
                        <span style={s.authorName}>{q.auteur.prenom} {q.auteur.nom}</span>
                        {q.auteur.est_verifie && <span style={s.verifBadge}>✓ Vérifié</span>}
                      </div>
                      <span style={s.date}>{new Date(q.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight: '100vh', background: '#F8FAFC' },
  hero:         {
    position: 'relative', overflow: 'hidden', padding: '4rem 2rem 3rem', textAlign: 'center',
    background: 'linear-gradient(135deg, #060e1f 0%, #0B1628 30%, #0f2a5e 65%, #1B4FBF 100%)',
    backgroundSize: '300% 300%',
    animation: 'gradientShift 10s ease infinite',
  },
  orb1: {
    position: 'absolute', top: '-60px', left: '10%',
    width: '320px', height: '320px', borderRadius: '50%',
    background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)',
    animation: 'pulseOrb 7s ease-in-out infinite', pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', bottom: '-80px', right: '8%',
    width: '280px', height: '280px', borderRadius: '50%',
    background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)',
    animation: 'pulseOrb2 9s ease-in-out infinite', pointerEvents: 'none',
  },
  orb3: {
    position: 'absolute', top: '20%', right: '25%',
    width: '180px', height: '180px', borderRadius: '50%',
    background: 'radial-gradient(circle, #1B4FBF 0%, transparent 70%)',
    animation: 'pulseOrb 11s ease-in-out infinite 2s', pointerEvents: 'none',
  },
  gridOverlay: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  },
  heroTitle:    { fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '0.5rem', fontFamily: '"DM Serif Display", serif', letterSpacing: '-0.5px' },
  heroSub:      { color: 'rgba(255,255,255,0.6)', fontSize: '15px', marginBottom: '2rem' },
  searchRow:    { display: 'flex', gap: '12px', maxWidth: '700px', margin: '0 auto' },
  searchWrap:   { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon:   { position: 'absolute', left: '14px', color: '#94A3B8', pointerEvents: 'none' },
  searchInput:  { width: '100%', padding: '12px 16px 12px 42px', border: 'none', borderRadius: '10px', fontSize: '14px', background: 'rgba(255,255,255,0.97)', outline: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontFamily: 'Sora, sans-serif' },
  select:       { padding: '12px 16px', border: 'none', borderRadius: '10px', fontSize: '14px', background: 'rgba(255,255,255,0.97)', cursor: 'pointer', fontFamily: 'Sora, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', minWidth: '160px' },
  layout:       { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' },
  sidebar:      { position: 'sticky', top: '80px', alignSelf: 'start' },
  sideCard:     { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  sideTitle:    { fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1rem' },
  tagsList:     { display: 'flex', flexDirection: 'column', gap: '2px' },
  tagBtn:       { background: 'transparent', border: 'none', padding: '7px 10px', borderRadius: '7px', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .15s, color .15s', fontFamily: 'Sora, sans-serif' },
  tagX:         { fontSize: '10px', opacity: 0.7 },
  statNum:      { fontSize: '36px', fontWeight: '800', color: '#0B1628', lineHeight: 1 },
  statLabel:    { fontSize: '12px', color: '#94A3B8', marginTop: '2px' },
  activeFilter: { marginTop: '1rem', padding: '8px 10px', background: '#EFF6FF', borderRadius: '7px', fontSize: '12px', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  clearBtn:     { background: 'none', border: 'none', cursor: 'pointer', color: '#1E40AF', fontWeight: '700', marginLeft: 'auto', fontSize: '11px' },
  main:         {},
  loadingWrap:  { display: 'flex', flexDirection: 'column', gap: '1rem' },
  skeleton:     { height: '140px', background: '#E2E8F0', borderRadius: '12px', animation: 'pulse 1.5s ease infinite' },
  empty:        { textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' },
  emptyBtn:     { display: 'inline-block', marginTop: '1.5rem', background: '#1B4FBF', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' },
  list:         { display: 'flex', flexDirection: 'column', gap: '12px' },
  card:         { display: 'block', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem 1.5rem', textDecoration: 'none', color: 'inherit', transition: 'box-shadow .2s, border-color .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' },
  statutPill:   { padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px' },
  cardMeta:     { display: 'flex', gap: '12px' },
  metaItem:     { fontSize: '12px', color: '#94A3B8' },
  cardTitle:    { fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '0.4rem', lineHeight: '1.4', letterSpacing: '-0.2px' },
  cardExcerpt:  { fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '0.75rem' },
  cardTags:     { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' },
  cardFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' },
  authorRow:    { display: 'flex', alignItems: 'center', gap: '8px' },
  authorAvatar: { width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B4FBF, #2563EB)', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  authorName:   { fontSize: '12px', fontWeight: '600', color: '#374151' },
  verifBadge:   { fontSize: '10px', background: '#D1FAE5', color: '#065F46', padding: '2px 7px', borderRadius: '99px', fontWeight: '600' },
  date:         { fontSize: '12px', color: '#94A3B8' },
};
