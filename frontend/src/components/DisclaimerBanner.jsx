export default function DisclaimerBanner() {
  return (
    <div style={s.banner}>
      <div style={s.icon}>⚕️</div>
      <p style={s.text}>
        <strong>Avis médical :</strong> Les informations partagées sur MedStack sont à titre éducatif uniquement
        et ne remplacent pas une consultation médicale professionnelle.
        En cas d'urgence, appelez le <strong>15</strong>.
      </p>
    </div>
  );
}

const s = {
  banner: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
    border: '1px solid #FDE68A', borderLeft: '4px solid #F5A623',
    borderRadius: '10px', padding: '12px 16px',
    marginBottom: '1.5rem', fontSize: '13px', color: '#78350F', lineHeight: '1.6',
  },
  icon: { fontSize: '18px', flexShrink: 0, marginTop: '1px' },
  text: { flex: 1, margin: 0 },
};
