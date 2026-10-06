import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTags, suggestQuestions } from '../../services/api';
import toast from 'react-hot-toast';
import TagBadge from '../../components/TagBadge';
import DisclaimerBanner from '../../components/DisclaimerBanner';
import api from '../../services/api';

const TYPES_CAS = [
  { value: 'clinique',      label: 'Cas clinique',         icon: '🩺' },
  { value: 'therapeutique', label: 'Question thérapeutique', icon: '💊' },
  { value: 'diagnostique',  label: 'Question diagnostique',  icon: '🔬' },
  { value: 'general',       label: 'Question générale',      icon: '❓' },
];

const STEPS = [
  { id: 1, label: 'Informations', icon: '📋' },
  { id: 2, label: 'Description',  icon: '✏️' },
  { id: 3, label: 'Images',       icon: '🖼️' },
];

export default function QuestionCreate() {
  const [step, setStep]         = useState(1);
  const [maxStep, setMaxStep]   = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [titre, setTitre]       = useState('');
  const [typeCas, setTypeCas]   = useState('clinique');
  const [tagsIds, setTagsIds]   = useState([]);
  const [contenu, setContenu]   = useState('');
  const [apercu, setApercu]     = useState(false);
  const [images, setImages]     = useState([]); // [{file, url, name}]
  const [tags, setTags]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const fileInputRef            = useRef();
  const navigate                = useNavigate();

  useEffect(() => { getTags().then(res => setTags(res.data)); }, []);

  // Live similar questions as user types the title
  useEffect(() => {
    if (titre.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      suggestQuestions(titre).then(res => setSuggestions(res.data)).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [titre]);

  const progress = Math.round(((step - 1) / (STEPS.length - 1)) * 100) || 33;

  const toggleTag = (tag) =>
    setTagsIds(prev => prev.includes(tag.id) ? prev.filter(i => i !== tag.id) : [...prev, tag.id]);

  const insertMarkdown = (syntax) => {
    const map = { G: '**texte**', I: '*texte*', code: '`code`', H2: '## Titre', liste: '- élément' };
    setContenu(prev => prev + (prev ? '\n' : '') + (map[syntax] || syntax));
  };

  const handleImages = (files) => {
    const valid = Array.from(files).filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} trop volumineux (max 5 Mo).`); return false; }
      // Accept any image type including jfif
      if (!f.type.startsWith('image/') && !f.name.match(/\.(jfif|jpe?g|png|gif|webp|bmp)$/i)) {
        toast.error(`${f.name} n'est pas une image valide.`); return false;
      }
      return true;
    });
    const newImgs = valid.map(f => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
    setImages(prev => [...prev, ...newImgs].slice(0, 5)); // max 5
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const canNext = () => {
    if (step === 1) return titre.trim().length >= 3;
    if (step === 2) return contenu.trim().length >= 3;
    return true;
  };

  const goNext = (n) => {
    setStep(n);
    setMaxStep(prev => Math.max(prev, n));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('contenu', contenu);
      tagsIds.forEach(id => formData.append('tags_ids', id));
      if (images.length > 0) formData.append('fichier', images[0].file);

      const res = await api.post('/questions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Question publiée avec succès !');
      navigate(`/questions/${res.data.id}`);
    } catch (err) {
      const detail = err?.response?.data;
      const msg = detail && typeof detail === 'object'
        ? Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : 'Erreur lors de la publication.';
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.h1}>❓ Poser une question médicale</h1>
          <p style={s.subtitle}>Partagez votre question avec la communauté MedStack</p>
        </div>

        {/* Progress bar */}
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: `${progress}%` }} />
          </div>
          <p style={s.progressLabel}>{progress}% complété</p>
        </div>

        {/* Disclaimer */}
        <DisclaimerBanner />

        {/* Step tabs */}
        <div style={s.tabs}>
          {STEPS.map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => st.id <= maxStep && setStep(st.id)}
              style={{
                ...s.tab,
                background: step === st.id ? '#4F46E5' : '#fff',
                color:      step === st.id ? '#fff'     : '#666',
                fontWeight: step === st.id ? '600'      : '400',
                cursor:     st.id <= maxStep ? 'pointer' : 'default',
              }}
            >
              {st.icon} {st.label}
            </button>
          ))}
        </div>

        {/* Step content */}
        <div style={s.card}>

          {/* ===== STEP 1: INFORMATIONS ===== */}
          {step === 1 && (
            <div style={s.stepContent}>
              <div style={s.field}>
                <label style={s.label}>Titre de la question <span style={s.required}>*</span></label>
                <input
                  value={titre}
                  onChange={e => setTitre(e.target.value.slice(0, 300))}
                  placeholder="Ex: Quels sont les symptômes de la pneumonie ?"
                  style={s.input}
                  maxLength={300}
                />
                <div style={s.charCount}>{titre.length}/300</div>

                {/* Live suggestions */}
                {suggestions.length > 0 && (
                  <div style={s.suggestBox}>
                    <p style={s.suggestLabel}>💡 Questions similaires déjà posées :</p>
                    {suggestions.map(q => (
                      <Link key={q.id} to={`/questions/${q.id}`} target="_blank" style={s.suggestItem}>
                        <span style={{ color: q.statut === 'resolue' ? '#0F6E56' : '#4F46E5' }}>
                          {q.statut === 'resolue' ? '✅' : '🔵'}
                        </span>
                        {q.titre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.field}>
                <label style={s.label}>Type de cas</label>
                <div style={s.selectWrap}>
                  <select
                    value={typeCas}
                    onChange={e => setTypeCas(e.target.value)}
                    style={s.select}
                  >
                    {TYPES_CAS.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <span style={s.selectArrow}>▾</span>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Tags médicaux <span style={s.required}>*</span></label>
                {tags.length === 0 ? (
                  <div style={s.emptyTags}>
                    Aucun tag disponible — ajoutez-en via{' '}
                    <a href="/admin" style={{ color: '#4F46E5' }}>l'admin Django</a>
                  </div>
                ) : (
                  <div style={s.tagsGrid}>
                    {tags.map(t => (
                      <TagBadge key={t.id} tag={t} onClick={toggleTag} active={tagsIds.includes(t.id)} size="md" />
                    ))}
                  </div>
                )}
              </div>

              <div style={s.navRow}>
                <div />
                <button
                  type="button"
                  onClick={() => goNext(2)}
                  disabled={!canNext()}
                  style={{ ...s.btnPrimary, opacity: canNext() ? 1 : 0.4 }}
                >
                  Suivant → Description
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: DESCRIPTION ===== */}
          {step === 2 && (
            <div style={s.stepContent}>
              <div style={s.field}>
                <label style={s.label}>
                  Description détaillée <span style={s.required}>*</span>
                  <span style={s.mdHint}> — Markdown supporté</span>
                </label>

                {/* Toolbar */}
                <div style={s.editorBox}>
                  <div style={s.toolbar}>
                    {[
                      { k: 'G',     label: 'G',      style: { fontWeight: '700' } },
                      { k: 'I',     label: 'I',      style: { fontStyle: 'italic' } },
                      { k: 'code',  label: '<>'  },
                      { k: 'H2',   label: 'H2'  },
                      { k: 'liste', label: '• Liste' },
                    ].map(btn => (
                      <button
                        key={btn.k}
                        type="button"
                        onClick={() => insertMarkdown(btn.k)}
                        style={{ ...s.toolbarBtn, ...btn.style }}
                      >
                        {btn.label}
                      </button>
                    ))}
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={() => setApercu(false)} style={{ ...s.viewBtn, background: !apercu ? '#4F46E5' : '#f1f5f9', color: !apercu ? '#fff' : '#666' }}>✏️ Écrire</button>
                    <button type="button" onClick={() => setApercu(true)}  style={{ ...s.viewBtn, background:  apercu ? '#4F46E5' : '#f1f5f9', color:  apercu ? '#fff' : '#666' }}>👁 Aperçu</button>
                  </div>

                  {!apercu ? (
                    <textarea
                      value={contenu}
                      onChange={e => setContenu(e.target.value)}
                      placeholder={'Décrivez votre question en détail...\n\nVous pouvez utiliser Markdown :\n**gras**, *italique*, `code`, ## titre, - liste'}
                      style={s.textarea}
                      rows={10}
                    />
                  ) : (
                    <div style={s.apercu}>
                      {contenu ? (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(contenu) }} />
                      ) : (
                        <p style={{ color: '#aaa', fontStyle: 'italic' }}>Rien à afficher...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tips box */}
              <div style={s.tips}>
                <p style={s.tipsTitle}>💡 Conseils pour une bonne question</p>
                <ul style={s.tipsList}>
                  <li>Décrivez le contexte clinique (âge, antécédents, symptômes)</li>
                  <li>Mentionnez les examens déjà réalisés</li>
                  <li>Précisez ce que vous avez déjà essayé</li>
                  <li>Anonymisez toute information personnelle</li>
                </ul>
              </div>

              <div style={s.navRow}>
                <button type="button" onClick={() => setStep(1)} style={s.btnSecondary}>← Retour</button>
                <button
                  type="button"
                  onClick={() => goNext(3)}
                  disabled={!canNext()}
                  style={{ ...s.btnPrimary, opacity: canNext() ? 1 : 0.4 }}
                >
                  Suivant → Images
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: IMAGES ===== */}
          {step === 3 && (
            <div style={s.stepContent}>
              <div style={s.field}>
                <label style={s.label}>Images médicales anonymisées</label>
                <p style={s.imgHint}>Radio, ECG, histologie, dermatologie... Assurez-vous d'anonymiser les images avant de les partager.</p>

                <div
                  style={s.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#4F46E5'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#c7c5f8'; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#c7c5f8'; handleImages(e.dataTransfer.files); }}
                >
                  <span style={{ fontSize: '36px' }}>🖼️</span>
                  <span style={s.dropText}>Cliquez pour ajouter des images (radio, ECG, histologie...)</span>
                  <span style={s.dropHint}>JPG, PNG, WEBP — max 5 Mo par image</span>
                  <input ref={fileInputRef} type="file" accept="image/*,.jfif" multiple onChange={e => handleImages(e.target.files)} style={{ display: 'none' }} />
                </div>

                {images.length > 0 && (
                  <div style={s.imageGrid}>
                    {images.map((img, i) => (
                      <div key={i} style={s.imageItem}>
                        <img src={img.url} alt={img.name} style={s.thumb} />
                        <button type="button" onClick={() => removeImage(i)} style={s.removeImg}>✕</button>
                        <span style={s.imgName}>{img.name.length > 20 ? img.name.slice(0, 18) + '…' : img.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.navRow}>
                <button type="button" onClick={() => setStep(2)} style={s.btnSecondary}>← Retour</button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ ...s.btnPublish, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Publication...' : '📤 Publier la question'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Minimal markdown renderer (bold, italic, code, h2, lists)
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h2 style="margin:.5rem 0;font-size:1.1rem">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1.2rem">$1</li>')
    .replace(/\n/g, '<br/>');
}

const s = {
  page:          { background: '#f4f6fb', minHeight: '100vh', padding: '2rem 1rem' },
  container:     { maxWidth: '780px', margin: '0 auto' },
  header:        { marginBottom: '1.5rem' },
  h1:            { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 0.25rem' },
  subtitle:      { color: '#888', fontSize: '14px', margin: 0 },
  progressWrap:  { marginBottom: '1.25rem' },
  progressTrack: { height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' },
  progressBar:   { height: '100%', background: '#4F46E5', borderRadius: '99px', transition: 'width .4s ease' },
  progressLabel: { fontSize: '12px', color: '#888', margin: '0.4rem 0 0' },
  tabs:          { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' },
  tab:           { padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', transition: 'all .2s' },
  card:          { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '2rem' },
  stepContent:   { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  field:         { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label:         { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
  required:      { color: '#e53e3e' },
  mdHint:        { color: '#aaa', fontWeight: '400', fontSize: '12px' },
  charCount:     { fontSize: '11px', color: '#aaa', textAlign: 'right' },
  input:         { padding: '0.8rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color .2s' },
  selectWrap:    { position: 'relative' },
  select:        { width: '100%', padding: '0.8rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', appearance: 'none', background: '#fff', cursor: 'pointer' },
  selectArrow:   { position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' },
  emptyTags:     { padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#888' },
  tagsGrid:      { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' },
  editorBox:     { border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' },
  toolbar:       { display: 'flex', gap: '0.4rem', padding: '0.6rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center' },
  toolbarBtn:    { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '3px 10px', fontSize: '13px', cursor: 'pointer', color: '#444' },
  viewBtn:       { border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  textarea:      { width: '100%', padding: '1rem', border: 'none', outline: 'none', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', minHeight: '220px', boxSizing: 'border-box', lineHeight: '1.7' },
  apercu:        { padding: '1rem', minHeight: '220px', fontSize: '14px', lineHeight: '1.7', color: '#333' },
  tips:          { background: '#EEEDFE', borderRadius: '10px', padding: '1rem 1.25rem' },
  tipsTitle:     { fontWeight: '700', color: '#3C3489', margin: '0 0 0.5rem', fontSize: '14px' },
  tipsList:      { margin: 0, paddingLeft: '1.25rem', color: '#555', fontSize: '13px', lineHeight: '2' },
  imgHint:       { fontSize: '13px', color: '#888', margin: 0 },
  dropzone:      { border: '2px dashed #c7c5f8', borderRadius: '12px', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'border-color .2s', background: '#fafafe' },
  dropText:      { fontSize: '14px', fontWeight: '500', color: '#4F46E5', textAlign: 'center' },
  dropHint:      { fontSize: '12px', color: '#aaa' },
  imageGrid:     { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' },
  imageItem:     { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '120px' },
  thumb:         { width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
  removeImg:     { position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  imgName:       { fontSize: '11px', color: '#888', textAlign: 'center', maxWidth: '120px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  navRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' },
  btnPrimary:    { background: '#4F46E5', color: '#fff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary:  { background: '#fff', color: '#666', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' },
  btnPublish:    { background: '#1D6A4A', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  suggestBox:    { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '0.25rem' },
  suggestLabel:  { fontSize: '12px', fontWeight: '600', color: '#92400E', margin: '0 0 0.5rem' },
  suggestItem:   { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', color: '#1a1a2e', textDecoration: 'none', padding: '4px 0', borderBottom: '1px solid #FDE68A' },
};
