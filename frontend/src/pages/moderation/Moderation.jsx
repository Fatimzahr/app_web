import { useEffect, useState } from 'react';
import {
  getSignalements, traiterSignalement,
  getUtilisateurs, modifierRole, suspendreUtilisateur,
} from '../../services/api';
import toast from 'react-hot-toast';

export default function Moderation() {
  const [onglet, setOnglet]           = useState('signalements');
  const [signalements, setSignalements] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, [onglet]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      if (onglet === 'signalements') {
        const res = await getSignalements();
        setSignalements(res.data);
      } else if (onglet === 'utilisateurs') {
        const res = await getUtilisateurs();
        setUtilisateurs(res.data);
      }
    } catch { toast.error('Erreur de chargement.'); }
    finally { setLoading(false); }
  };

  const handleTraiterSignalement = async (id, action) => {
    try {
      await traiterSignalement(id, {
        action,
        decision: `${action} le ${new Date().toLocaleDateString('fr-FR')}`
      });
      toast.success(`Signalement ${action} !`);
      setSignalements(s => s.filter(sig => sig.id !== id));
    } catch { toast.error('Erreur.'); }
  };

  const handleModifierRole = async (userId, role) => {
    try {
      await modifierRole(userId, { role });
      toast.success(`Rôle mis à jour : ${role}`);
      chargerDonnees();
    } catch { toast.error('Erreur lors du changement de rôle.'); }
  };

  const handleSuspendre = async (userId) => {
    try {
      const res = await suspendreUtilisateur(userId);
      toast.success(res.data.detail);
      chargerDonnees();
    } catch { toast.error('Erreur.'); }
  };

  const roleColor = (role) => ({
    admin:      { bg: '#FAECE7', color: '#993C1D' },
    moderateur: { bg: '#FAEEDA', color: '#854F0B' },
    medecin:    { bg: '#E1F5EE', color: '#0F6E56' },
    etudiant:   { bg: '#EEEDFE', color: '#3C3489' },
    patient:    { bg: '#F1EFE8', color: '#5F5E5A' },
  }[role] || { bg: '#F1EFE8', color: '#5F5E5A' });

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🛡️ Panel de Modération</h2>

      {/* Onglets */}
      <div style={styles.tabs}>
        <button
          onClick={() => setOnglet('signalements')}
          style={{ ...styles.tab, ...(onglet === 'signalements' ? styles.tabActive : {}) }}
        >
          🚩 Signalements {signalements.length > 0 && `(${signalements.length})`}
        </button>
        <button
          onClick={() => setOnglet('utilisateurs')}
          style={{ ...styles.tab, ...(onglet === 'utilisateurs' ? styles.tabActive : {}) }}
        >
          👥 Utilisateurs
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>Chargement...</p>
      ) : (

        /* ===== ONGLET SIGNALEMENTS ===== */
        onglet === 'signalements' ? (
          <div>
            {signalements.length === 0 ? (
              <div style={styles.empty}>✅ Aucun signalement en attente.</div>
            ) : (
              signalements.map(s => (
                <div key={s.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.motifBadge}>🚩 Signalement</span>
                    <span style={styles.date}>
                      {new Date(s.date_signalement).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p style={styles.motif}><strong>Motif :</strong> {s.motif}</p>
                  {s.question && (
                    <p style={styles.cible}>
                      📌 Question signalée
                    </p>
                  )}
                  {s.reponse && (
                    <p style={styles.cible}>
                      💬 Réponse signalée
                    </p>
                  )}
                  <div style={styles.actions}>
                    <button
                      onClick={() => handleTraiterSignalement(s.id, 'traite')}
                      style={styles.btnTraite}
                    >
                      ✅ Valider le signalement
                    </button>
                    <button
                      onClick={() => handleTraiterSignalement(s.id, 'rejete')}
                      style={styles.btnRejete}
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (

          /* ===== ONGLET UTILISATEURS ===== */
          <div>
            <p style={styles.subtitle}>
              {utilisateurs.length} utilisateur(s) enregistré(s)
            </p>
            {utilisateurs.map(u => (
              <div key={u.id} style={{
                ...styles.userCard,
                opacity: u.est_actif ? 1 : 0.5,
                borderLeft: u.est_actif ? '4px solid #4F46E5' : '4px solid #fc8181',
              }}>
                <div style={styles.userInfo}>

                  {/* Avatar */}
                  <div style={styles.avatar}>
                    {u.prenom[0]}{u.nom[0]}
                  </div>

                  <div style={styles.userDetails}>
                    <div style={styles.userName}>
                      {u.prenom} {u.nom}
                      {u.est_verifie && <span style={styles.verified}> ✅</span>}
                      {!u.est_actif && <span style={styles.suspended}> 🔴 Suspendu</span>}
                    </div>
                    <div style={styles.userEmail}>{u.email}</div>
                    <div style={styles.userMeta}>
                      <span style={{
                        ...styles.roleBadge,
                        background: roleColor(u.role).bg,
                        color: roleColor(u.role).color,
                      }}>
                        {u.role}
                      </span>
                      <span style={styles.reputation}>
                        ⭐ {u.score_reputation} pts
                      </span>
                      <span style={styles.dateInscription}>
                        Inscrit le {new Date(u.date_inscription).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={styles.userActions}>

                  {/* Modifier le rôle */}
                  <select
                    value={u.role}
                    onChange={e => handleModifierRole(u.id, e.target.value)}
                    style={styles.selectRole}
                  >
                    <option value="patient">Patient</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="medecin">Médecin</option>
                    <option value="moderateur">Modérateur</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* Suspendre / Réactiver */}
                  <button
                    onClick={() => handleSuspendre(u.id)}
                    style={u.est_actif ? styles.btnSuspendre : styles.btnReactiver}
                  >
                    {u.est_actif ? '🔴 Suspendre' : '🟢 Réactiver'}
                  </button>

                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

const styles = {
  container:    { maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' },
  title:        { fontSize: '22px', fontWeight: '700', marginBottom: '1.5rem', color: '#1a1a2e' },
  tabs:         { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' },
  tab:          { padding: '0.6rem 1.2rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#666', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive:    { color: '#4F46E5', borderBottom: '2px solid #4F46E5', fontWeight: '500' },
  empty:        { textAlign: 'center', color: '#0F6E56', background: '#E1F5EE', padding: '2rem', borderRadius: '10px', fontSize: '15px' },
  subtitle:     { fontSize: '13px', color: '#888', marginBottom: '1rem' },

  // Signalements
  card:         { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' },
  cardHeader:   { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' },
  motifBadge:   { background: '#FAEEDA', color: '#854F0B', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  date:         { fontSize: '12px', color: '#888' },
  motif:        { fontSize: '14px', color: '#333', marginBottom: '0.5rem' },
  cible:        { fontSize: '13px', color: '#666', marginBottom: '0.75rem' },
  actions:      { display: 'flex', gap: '0.75rem' },
  btnTraite:    { background: '#E1F5EE', color: '#0F6E56', border: '1px solid #5DCAA5', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  btnRejete:    { background: '#FAECE7', color: '#993C1D', border: '1px solid #F0997B', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },

  // Utilisateurs
  userCard:     { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  userInfo:     { display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 },
  avatar:       { width: '44px', height: '44px', borderRadius: '50%', background: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 },
  userDetails:  { flex: 1 },
  userName:     { fontSize: '15px', fontWeight: '600', color: '#1a1a2e', marginBottom: '2px' },
  verified:     { color: '#0F6E56', fontSize: '13px' },
  suspended:    { color: '#993C1D', fontSize: '12px' },
  userEmail:    { fontSize: '12px', color: '#888', marginBottom: '6px' },
  userMeta:     { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' },
  roleBadge:    { padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  reputation:   { fontSize: '12px', color: '#666' },
  dateInscription: { fontSize: '11px', color: '#aaa' },
  userActions:  { display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 },
  selectRole:   { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  btnSuspendre: { background: '#FAECE7', color: '#993C1D', border: '1px solid #F0997B', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' },
  btnReactiver: { background: '#E1F5EE', color: '#0F6E56', border: '1px solid #5DCAA5', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' },
};