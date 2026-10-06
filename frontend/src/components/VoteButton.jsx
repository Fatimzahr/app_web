export default function VoteButton({ score, monVote, onVote, disabled = false }) {
  const isUp   = monVote === 'positif';
  const isDown = monVote === 'negatif';

  const handleClick = (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) onVote(type);
  };

  const scoreColor = score > 0 ? '#059669' : score < 0 ? '#DC2626' : '#64748B';

  return (
    <div style={s.wrap} onClick={e => e.stopPropagation()}>
      <button type="button" style={{ ...s.btn, ...(isUp ? s.upActive : s.btnBase) }} onClick={e => handleClick(e, 'positif')} disabled={disabled} title="Utile">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isUp ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        Utile
      </button>

      <span style={{ ...s.score, color: scoreColor }}>
        {score > 0 ? `+${score}` : score}
      </span>

      <button type="button" style={{ ...s.btn, ...(isDown ? s.downActive : s.btnBase) }} onClick={e => handleClick(e, 'negatif')} disabled={disabled} title="Pas utile">
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isDown ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
        Pas utile
      </button>
    </div>
  );
}

const s = {
  wrap:       { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  btn:        { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all .15s', fontFamily: 'Sora, sans-serif' },
  btnBase:    { background: '#F8FAFC', color: '#64748B', borderColor: '#E2E8F0' },
  upActive:   { background: '#D1FAE5', color: '#065F46', borderColor: '#6EE7B7' },
  downActive: { background: '#FEE2E2', color: '#991B1B', borderColor: '#FCA5A5' },
  score:      { fontSize: '14px', fontWeight: '800', minWidth: '24px', textAlign: 'center', fontFamily: 'Sora, sans-serif' },
};
