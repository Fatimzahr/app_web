import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getQuestion, getReponses, creerReponse, voter,
  accepterReponse, signalerContenu, supprimerReponse,
  getCommentairesReponse, creerCommentaire, fermerQuestion, getSimilarQuestions
} from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import VoteButton from '../../components/VoteButton';
import TagBadge from '../../components/TagBadge';
import DisclaimerBanner from '../../components/DisclaimerBanner';
import MentionTextarea from '../../components/MentionTextarea';
import { searchUsers } from '../../services/api';

// Lightweight single-line mention input for comments
function MentionInput({ value, onChange, onSubmit }) {
  const [suggestions, setSuggestions] = useState([]);
  const [mentionStart, setMentionStart] = useState(null);
  const [selIdx, setSelIdx]             = useState(0);
  const inputRef  = useRef();
  const debounce  = useRef();

  const handleChange = async (e) => {
    const val    = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(val);
    const match = val.slice(0, cursor).match(/@(\w*)$/);
    if (match) {
      setMentionStart(cursor - match[0].length);
      clearTimeout(debounce.current);
      if (match[1].length >= 1) {
        debounce.current = setTimeout(async () => {
          try { const res = await searchUsers(match[1]); setSuggestions(res.data); } catch { setSuggestions([]); }
        }, 250);
      } else setSuggestions([]);
    } else { setSuggestions([]); setMentionStart(null); }
  };

  const insert = (user) => {
    const before  = value.slice(0, mentionStart);
    const after   = value.slice(inputRef.current.selectionStart);
    const mention = `@${user.nom} `;
    onChange(before + mention + after);
    setSuggestions([]);
    setTimeout(() => { const p = before.length + mention.length; inputRef.current?.setSelectionRange(p, p); inputRef.current?.focus(); }, 0);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(i => Math.min(i+1, suggestions.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelIdx(i => Math.max(i-1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); insert(suggestions[selIdx]); }
    if (e.key === 'Tab')       { e.preventDefault(); insert(suggestions[selIdx]); }
    if (e.key === 'Escape')    setSuggestions([]);
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input ref={inputRef} value={value} onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Ajouter un commentaire... (@nom pour mentionner)"
          style={cS.input} required />
        <button type="submit" onClick={onSubmit} style={cS.btn}>Envoyer</button>
      </div>
      {suggestions.length > 0 && (
        <div style={mS.dropdown}>
          {suggestions.map((u, i) => (
            <div key={u.id} onClick={() => insert(u)} onMouseEnter={() => setSelIdx(i)}
              style={{ ...mS.item, background: i === selIdx ? '#EFF6FF' : '#fff' }}>
              <span style={mS.avatar}>{u.prenom[0]}{u.nom[0]}</span>
              <span style={mS.name}>{u.prenom} {u.nom}</span>
              {u.est_verifie && <span style={mS.badge}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const mS = {
  dropdown: { position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', marginBottom: '4px' },
  item:     { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', transition: 'background .1s' },
  avatar:   { width: '24px', height: '24px', borderRadius: '50%', background: '#1B4FBF', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:     { fontSize: '12px', fontWeight: '600', color: '#0F172A' },
  badge:    { fontSize: '10px', background: '#D1FAE5', color: '#065F46', padding: '1px 5px', borderRadius: '99px', marginLeft: '4px' },
};

// ===== COMMENTAIRES =====
function SectionCommentaires({ reponseId, isAuthenticated }) {
  const [commentaires, setCommentaires] = useState([]);
  const [contenu, setContenu]           = useState('');
  const [afficher, setAfficher]         = useState(false);

  const charger = async () => {
    try { const res = await getCommentairesReponse(reponseId); setCommentaires(res.data); } catch {}
  };

  useEffect(() => { if (afficher) charger(); }, [afficher]);

  const handleCommenter = async (e) => {
    e.preventDefault();
    if (!contenu.trim()) return;
    const texte = contenu;
    setContenu('');
    try {
      const res = await creerCommentaire({ reponse: reponseId, contenu: texte });
      // Optimistic: add immediately, then also re-fetch to get server data
      setCommentaires(prev => [...prev, res.data]);
      toast.success('Commentaire ajouté !');
      // Re-fetch to ensure we have correct server data (auteur, id, etc.)
      setTimeout(() => charger(), 300);
    } catch {
      setContenu(texte); // restore on error
      toast.error('Erreur lors du commentaire.');
    }
  };

  return (
    <div style={cS.wrap}>
      <button onClick={() => setAfficher(!afficher)} style={cS.toggle}>
        💬 {afficher ? 'Masquer' : 'Voir'} les commentaires
        {commentaires.length > 0 && ` (${commentaires.length})`}
      </button>
      {afficher && (
        <div style={cS.section}>
          {commentaires.length === 0
            ? <p style={cS.empty}>Aucun commentaire.</p>
            : commentaires.map(c => (
                <div key={c.id} style={cS.item}>
                  <strong>{c.auteur.prenom} {c.auteur.nom}</strong>{c.auteur.est_verifie && ' ✅'}
                  <span style={cS.texte}> : {c.contenu}</span>
                  <span style={cS.date}>{new Date(c.date_creation).toLocaleDateString('fr-FR')}</span>
                </div>
              ))
          }
          {isAuthenticated && (
            <form onSubmit={handleCommenter} style={cS.form}>
              <MentionInput
                value={contenu}
                onChange={setContenu}
                onSubmit={handleCommenter}
              />
            </form>
          )}
        </div>
      )}
    </div>
  );
}

const cS = {
  wrap:    { marginTop: '0.75rem' },
  toggle:  { background: 'none', border: 'none', color: '#4F46E5', fontSize: '12px', cursor: 'pointer', padding: 0 },
  section: { marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #e2e8f0' },
  empty:   { fontSize: '12px', color: '#aaa', margin: '0.5rem 0' },
  item:    { fontSize: '13px', color: '#555', marginBottom: '0.6rem', lineHeight: 1.5 },
  texte:   { color: '#444' },
  date:    { color: '#aaa', fontSize: '11px', marginLeft: '8px' },
  form:    { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  input:   { flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' },
  btn:     { background: '#4F46E5', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
};

// ===== MAIN =====
export default function QuestionDetail() {
  const { id }                    = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [question, setQuestion]   = useState(null);
  const [reponses, setReponses]   = useState([]);
  const [contenu, setContenu]     = useState('');
  const [loading, setLoading]     = useState(true);
  const [similar, setSimilar]     = useState([]);
  const [signalementId, setSignalementId]       = useState(null);
  const [motifSignalement, setMotifSignalement] = useState('');
  const visitedRef = useRef(false); // prevent double view count in React StrictMode

  const charger = useCallback(async () => {
    try {
      const [qRes, rRes] = await Promise.all([getQuestion(id), getReponses(id)]);
      setQuestion(qRes.data);
      setReponses(rRes.data);
      // Load similar questions
      getSimilarQuestions(id).then(res => setSimilar(res.data)).catch(() => {});
    } catch { toast.error('Question introuvable.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (visitedRef.current) return; // StrictMode guard
    visitedRef.current = true;
    charger();
  }, [charger]);

  // ===== VOTE — optimistic update, no full reload =====
  const handleVoterQuestion = async (type_vote) => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour voter.'); return; }
    try {
      const res = await voter({ type_vote, question: id });
      // update question score + mon_vote locally
      setQuestion(prev => {
        const wasUp   = prev.mon_vote === 'positif';
        const wasDown = prev.mon_vote === 'negatif';
        let delta = 0;
        if (res.data.action === 'annule')  delta = type_vote === 'positif' ? -1 : 1;
        if (res.data.action === 'inverse') delta = type_vote === 'positif' ? 2 : -2;
        if (res.data.action === 'vote')    delta = type_vote === 'positif' ? 1 : -1;
        return {
          ...prev,
          score: (prev.score || 0) + delta,
          mon_vote: res.data.action === 'annule' ? null : type_vote,
        };
      });
      if (res.data.action === 'annule')  toast('Vote annulé.', { icon: '↩️' });
      if (res.data.action === 'inverse') toast('Vote inversé.', { icon: '🔄' });
      if (res.data.action === 'vote')    toast.success('Vote enregistré !');
    } catch (err) {
      const msg = err?.response?.data?.detail || JSON.stringify(err?.response?.data) || 'Erreur lors du vote.';
      toast.error(msg, { duration: 8000 });
    }
  };

  const handleVoterReponse = async (reponseId, type_vote) => {
    if (!isAuthenticated) { toast.error('Connectez-vous pour voter.'); return; }
    try {
      const res = await voter({ type_vote, reponse: reponseId });
      // update only the specific response, leave all others untouched
      setReponses(prev => prev.map(r => {
        if (r.id !== reponseId) return r; // ← other responses unchanged
        let delta = 0;
        if (res.data.action === 'annule')  delta = type_vote === 'positif' ? -1 : 1;
        if (res.data.action === 'inverse') delta = type_vote === 'positif' ? 2 : -2;
        if (res.data.action === 'vote')    delta = type_vote === 'positif' ? 1 : -1;
        return {
          ...r,
          score: (r.score || 0) + delta,
          mon_vote: res.data.action === 'annule' ? null : type_vote,
        };
      }));
      if (res.data.action === 'annule')  toast('Vote annulé.', { icon: '↩️' });
      if (res.data.action === 'inverse') toast('Vote inversé.', { icon: '🔄' });
      if (res.data.action === 'vote')    toast.success('Vote enregistré !');
    } catch (err) {
      const msg = err?.response?.data?.detail || JSON.stringify(err?.response?.data) || 'Erreur lors du vote.';
      toast.error(msg, { duration: 8000 });
    }
  };

  // ===== RÉPONDRE =====
  const handleRepondre = async (e) => {
    e.preventDefault();
    if (!contenu.trim()) return;
    try {
      await creerReponse({ question: id, contenu });
      toast.success('Réponse publiée !');
      setContenu('');
      charger();
    } catch { toast.error('Erreur lors de la publication.'); }
  };

  // ===== ACCEPTER =====
  const handleAccepter = async (reponseId) => {
    try {
      await accepterReponse(id, { reponse_id: reponseId });
      toast.success('Réponse acceptée ! +15 pts accordés.');
      charger();
    } catch { toast.error('Erreur.'); }
  };

  // ===== SIGNALER =====
  const handleSignaler = async (reponseId) => {
    if (!motifSignalement.trim()) { toast.error('Veuillez entrer un motif.'); return; }
    try {
      await signalerContenu({ reponse: reponseId, motif: motifSignalement });
      toast.success('Contenu signalé aux modérateurs !');
      setSignalementId(null);
      setMotifSignalement('');
    } catch { toast.error('Erreur lors du signalement.'); }
  };

  // ===== SUPPRIMER =====
  const handleSupprimer = async (reponseId) => {
    if (!window.confirm('Supprimer cette réponse définitivement ?')) return;
    try {
      await supprimerReponse(reponseId);
      toast.success('Réponse supprimée.');
      charger();
    } catch { toast.error('Erreur lors de la suppression.'); }
  };

  // ===== FERMER =====
  const handleFermerQuestion = async () => {
    if (!window.confirm('Fermer cette question ?')) return;
    try {
      await fermerQuestion(id);
      toast.success('Question fermée.');
      charger();
    } catch { toast.error('Erreur.'); }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Chargement...</p>;
  if (!question) return <p style={{ textAlign: 'center' }}>Question introuvable.</p>;

  const estModerateur     = user?.role === 'moderateur' || user?.role === 'admin';
  const estAuteurQuestion = isAuthenticated && user?.id === question.auteur.id;

  return (
    <div style={s.container}>
      <DisclaimerBanner />

      {/* ===== QUESTION ===== */}
      <div style={s.questionCard}>
        <VoteButton
          score={question.score ?? 0}
          monVote={question.mon_vote}
          onVote={handleVoterQuestion}
          disabled={!isAuthenticated}
        />

        <div style={s.content}>
          <div style={s.statutBar}>
            <span style={{ ...s.statutBadge,
              background: question.statut === 'resolue' ? '#E1F5EE' : question.statut === 'fermee' ? '#FAECE7' : '#EEEDFE',
              color:      question.statut === 'resolue' ? '#0F6E56' : question.statut === 'fermee' ? '#993C1D' : '#3C3489',
            }}>
              {question.statut === 'resolue' ? '✅ Résolue' : question.statut === 'fermee' ? '🔒 Fermée' : '🔵 Ouverte'}
            </span>
            {estModerateur && question.statut !== 'fermee' && (
              <button onClick={handleFermerQuestion} style={s.btnFermer}>🔒 Fermer</button>
            )}
          </div>

          <h1 style={s.titre}>{question.titre}</h1>

          {question.tags.length > 0 && (
            <div style={s.tags}>
              {question.tags.map(t => <TagBadge key={t.id} tag={t} size="sm" />)}
            </div>
          )}

          <p style={s.contenu}>{question.contenu}</p>

          {question.fichier_url && (
            <div style={s.attachment}>
              <span style={s.attachLabel}>📎 Pièce jointe :</span>
              {/\.(jpg|jpeg|jfif|jpe|png|gif|webp|bmp|svg)(\?.*)?$/i.test(question.fichier_url)
                || question.fichier_url.includes('/questions/fichiers/')
                ? <a href={question.fichier_url} target="_blank" rel="noreferrer">
                    <img
                      src={question.fichier_url}
                      alt="pièce jointe"
                      style={s.attachImg}
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
                    />
                    <a href={question.fichier_url} target="_blank" rel="noreferrer" style={{ ...s.attachLink, display: 'none' }}>📄 Télécharger le fichier</a>
                  </a>
                : <a href={question.fichier_url} target="_blank" rel="noreferrer" style={s.attachLink}>📄 Télécharger le fichier</a>
              }
            </div>
          )}

          <div style={s.meta}>
            Par <strong>{question.auteur.prenom} {question.auteur.nom}</strong>
            {question.auteur.est_verifie && ' ✅'}
            · {new Date(question.date_creation).toLocaleDateString('fr-FR')}
            · 👁 {question.nb_vues} vues · 💬 {reponses.length} réponse(s)
          </div>
        </div>
      </div>

      {/* ===== RÉPONSES ===== */}
      <h2 style={s.sectionTitle}>{reponses.length} Réponse(s)</h2>

      {reponses.length === 0 && (
        <p style={s.noReponse}>Aucune réponse pour l'instant. Soyez le premier à répondre !</p>
      )}

      {reponses.map(r => (
        <div key={r.id} style={{
          ...s.reponseCard,
          border:     r.est_acceptee ? '2px solid #1D9E75' : '1px solid #e2e8f0',
          background: r.est_acceptee ? '#FAFFFC' : '#fff',
        }}>
          {/* Vote isolé par reponse — closure captures r.id at render time */}
          {(() => {
            const rid = r.id; // hard capture
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <VoteButton
                  score={r.score ?? 0}
                  monVote={r.mon_vote}
                  onVote={(type) => handleVoterReponse(rid, type)}
                  disabled={!isAuthenticated}
                />
                {r.est_acceptee && <span style={s.acceptedIcon} title="Réponse acceptée">✅</span>}
              </div>
            );
          })()}

          <div style={s.content}>
            {r.est_acceptee && (
              <div style={s.acceptedBanner}>✅ Réponse acceptée par l'auteur</div>
            )}
            <p style={s.contenu}>{r.contenu}</p>
            <div style={s.meta}>
              Par <strong>{r.auteur.prenom} {r.auteur.nom}</strong>
              {r.auteur.est_verifie && <span style={s.verifBadge}> ✅ Vérifié</span>}
              · {new Date(r.date_creation).toLocaleDateString('fr-FR')}
              · ⭐ {r.auteur.score_reputation} pts
            </div>

            <div style={s.actions}>
              {estAuteurQuestion && !r.est_acceptee && question.statut === 'ouverte' && (
                <button onClick={() => handleAccepter(r.id)} style={s.btnAccepter}>✓ Accepter</button>
              )}
              {isAuthenticated && user?.id !== r.auteur.id && (
                <button onClick={() => setSignalementId(signalementId === r.id ? null : r.id)} style={s.btnSignaler}>
                  🚩 Signaler
                </button>
              )}
              {estModerateur && (
                <button onClick={() => handleSupprimer(r.id)} style={s.btnSupprimer}>🗑️ Supprimer</button>
              )}
            </div>

            {signalementId === r.id && (
              <div style={s.signalementForm}>
                <input
                  placeholder="Motif du signalement..."
                  value={motifSignalement}
                  onChange={e => setMotifSignalement(e.target.value)}
                  style={s.signalementInput}
                />
                <button onClick={() => handleSignaler(r.id)} style={s.btnEnvoyerSignalement}>Envoyer</button>
                <button onClick={() => setSignalementId(null)} style={s.btnAnnuler}>Annuler</button>
              </div>
            )}

            <SectionCommentaires reponseId={r.id} isAuthenticated={isAuthenticated} />
          </div>
        </div>
      ))}

      {/* ===== FORMULAIRE RÉPONSE ===== */}
      {isAuthenticated ? (
        question.statut === 'fermee' ? (
          <div style={s.questionFermeeMsg}>🔒 Cette question est fermée — les nouvelles réponses ne sont plus acceptées.</div>
        ) : (
          <div style={s.repondreCard}>
            <h3 style={{ margin: '0 0 1rem', color: '#1a1a2e' }}>💬 Votre réponse</h3>
            <form onSubmit={handleRepondre}>
              <MentionTextarea
                value={contenu}
                onChange={setContenu}
                placeholder="Rédigez votre réponse médicale ici... Utilisez @nom pour mentionner quelqu'un."
                rows={6}
                required
              />
              <button type="submit" style={s.btnPublier}>📤 Publier la réponse</button>
            </form>
          </div>
        )
      ) : (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
          <a href="/login" style={{ color: '#4F46E5' }}>Connectez-vous</a> pour répondre.
        </p>
      )}

      {/* ===== QUESTIONS SIMILAIRES ===== */}
      {similar.length > 0 && (
        <div style={s.similarBox}>
          <h3 style={s.similarTitle}>🔗 Questions similaires</h3>
          <div style={s.similarList}>
            {similar.map(q => (
              <Link key={q.id} to={`/questions/${q.id}`} style={s.similarItem}>
                <span style={{
                  ...s.similarBadge,
                  background: q.statut === 'resolue' ? '#E1F5EE' : '#EEEDFE',
                  color:      q.statut === 'resolue' ? '#0F6E56' : '#3C3489',
                }}>
                  {q.statut === 'resolue' ? '✅' : '🔵'}
                </span>
                <span style={s.similarTitre}>{q.titre}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container:          { maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' },
  questionCard:       { display: 'flex', gap: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' },
  reponseCard:        { display: 'flex', gap: '1rem', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' },
  content:            { flex: 1 },
  statutBar:          { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' },
  statutBadge:        { padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  btnFermer:          { background: '#FAECE7', color: '#993C1D', border: '1px solid #F0997B', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  titre:              { fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 0.75rem' },
  tags:               { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' },
  contenu:            { fontSize: '14px', color: '#444', lineHeight: '1.8', margin: '0.5rem 0' },
  meta:               { fontSize: '12px', color: '#888', marginTop: '0.75rem' },
  verifBadge:         { color: '#0F6E56', fontSize: '11px' },
  acceptedIcon:       { fontSize: '20px', marginTop: '4px' },
  sectionTitle:       { fontSize: '18px', fontWeight: '600', margin: '1.5rem 0 1rem', color: '#1a1a2e' },
  noReponse:          { textAlign: 'center', color: '#888', padding: '2rem', background: '#f8fafc', borderRadius: '10px', fontSize: '14px' },
  acceptedBanner:     { background: '#E1F5EE', color: '#0F6E56', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', marginBottom: '0.75rem', display: 'inline-block' },
  actions:            { display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' },
  btnAccepter:        { background: '#E1F5EE', color: '#0F6E56', border: '1px solid #5DCAA5', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  btnSignaler:        { background: '#FAEEDA', color: '#854F0B', border: '1px solid #EF9F27', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  btnSupprimer:       { background: '#FAECE7', color: '#993C1D', border: '1px solid #F0997B', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  signalementForm:    { marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  signalementInput:   { flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', minWidth: '200px' },
  btnEnvoyerSignalement: { background: '#EF9F27', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  btnAnnuler:         { background: '#f1f5f9', color: '#666', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
  repondreCard:       { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' },
  questionFermeeMsg:  { textAlign: 'center', background: '#FAECE7', color: '#993C1D', padding: '1.5rem', borderRadius: '10px', marginTop: '2rem', fontSize: '14px', fontWeight: '500' },
  textarea:           { width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  btnPublier:         { marginTop: '1rem', background: '#4F46E5', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  attachment:         { margin: '0.75rem 0', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  attachLabel:        { fontSize: '12px', fontWeight: '600', color: '#888' },
  attachImg:          { maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain', display: 'block' },
  attachLink:         { color: '#4F46E5', fontSize: '14px', fontWeight: '500', textDecoration: 'none' },
  similarBox:         { marginTop: '2.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' },
  similarTitle:       { fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 1rem' },
  similarList:        { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  similarItem:        { display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', transition: 'box-shadow .15s' },
  similarBadge:       { padding: '2px 8px', borderRadius: '12px', fontSize: '11px', flexShrink: 0 },
  similarTitre:       { fontSize: '13px', color: '#1a1a2e', fontWeight: '500' },
};
