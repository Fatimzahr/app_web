export default function TagBadge({ tag, onClick, active = false, size = 'md' }) {
  const clickable = typeof onClick === 'function';
  const small = size === 'sm';

  return (
    <span
      onClick={clickable ? (e) => { e.stopPropagation(); onClick(tag); } : undefined}
      title={tag.specialite ? `Spécialité : ${tag.specialite}` : tag.nom}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: small ? '2px 8px' : '4px 12px',
        borderRadius: '99px', fontSize: small ? '11px' : '12px',
        fontWeight: '500', cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none', border: '1px solid',
        background: active ? '#1B4FBF' : '#EFF6FF',
        color:      active ? '#fff'     : '#1E40AF',
        borderColor: active ? '#1B4FBF' : '#BFDBFE',
        transition: 'all .15s',
        boxShadow: active ? '0 2px 6px rgba(27,79,191,0.3)' : 'none',
        fontFamily: 'Sora, sans-serif',
      }}
    >
      {tag.nom}
    </span>
  );
}
