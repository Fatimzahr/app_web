import { useEffect, useState } from 'react';
import { getProfil, getMesBadges } from '../../services/api';

export default function Profile() {
  const [user, setUser]     = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    getProfil().then(res => setUser(res.data));
    getMesBadges().then(res => setBadges(res.data));
  }, []);

  if (!user) return <p style={{ textAlign: 'center', marginTop: '3rem' }}>Chargement...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatar}>
            {user.prenom[0]}{user.nom[0]}
          </div>
          <div>
            <h2 style={styles.name}>{user.prenom} {user.nom}
              {user.est_verifie && <span style={styles.verified}> ✅ Vérifié</span>}
            </h2>
            <p style={styles.role}>{user.role}</p>
            <p style={styles.email}>{user.email}</p>
          </div>
        </div>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{user.score_reputation}</div>
            <div style={styles.statLabel}>Score réputation</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{badges.length}</div>
            <div style={styles.statLabel}>Badges obtenus</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>
              {new Date(user.date_inscription).toLocaleDateString('fr-FR')}
            </div>
            <div style={styles.statLabel}>Membre depuis</div>
          </div>
        </div>

        {badges.length > 0 && (
          <div style={styles.badgesSection}>
            <h3 style={styles.sectionTitle}>🏅 Mes badges</h3>
            <div style={styles.badgesGrid}>
              {badges.map(b => (
                <div key={b.badge.id} style={{
                  ...styles.badge,
                  background: b.badge.niveau === 'or' ? '#FAEEDA' :
                              b.badge.niveau === 'argent' ? '#F1EFE8' :
                              b.badge.niveau === 'platine' ? '#EEEDFE' : '#F5F5F5',
                }}>
                  <div style={styles.badgeIcon}>🏅</div>
                  <div style={styles.badgeName}>{b.badge.nom}</div>
                  <div style={styles.badgeLevel}>{b.badge.niveau}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:    { maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' },
  card:         { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', padding: '2rem' },
  header:       { display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' },
  avatar:       { width: '70px', height: '70px', borderRadius: '50%', background: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', flexShrink: 0 },
  name:         { fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 0.25rem' },
  verified:     { fontSize: '14px', color: '#0F6E56' },
  role:         { fontSize: '13px', color: '#4F46E5', fontWeight: '500', textTransform: 'capitalize', margin: '0 0 0.25rem' },
  email:        { fontSize: '13px', color: '#888', margin: 0 },
  stats:        { display: 'flex', gap: '1rem', margin: '1.5rem 0', padding: '1.5rem', background: '#f8fafc', borderRadius: '10px' },
  stat:         { flex: 1, textAlign: 'center' },
  statValue:    { fontSize: '20px', fontWeight: '700', color: '#1a1a2e' },
  statLabel:    { fontSize: '12px', color: '#888', marginTop: '4px' },
  badgesSection:{ marginTop: '1.5rem' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '1rem', color: '#1a1a2e' },
  badgesGrid:   { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' },
  badge:        { padding: '0.75rem 1rem', borderRadius: '10px', textAlign: 'center', minWidth: '100px' },
  badgeIcon:    { fontSize: '24px', marginBottom: '4px' },
  badgeName:    { fontSize: '13px', fontWeight: '600', color: '#1a1a2e' },
  badgeLevel:   { fontSize: '11px', color: '#888', textTransform: 'capitalize', marginTop: '2px' },
};