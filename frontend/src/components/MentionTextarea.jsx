import { useState, useRef, useEffect } from 'react';
import { searchUsers } from '../services/api';

/**
 * MentionTextarea — textarea with @mention autocomplete
 * Props: value, onChange, placeholder, rows, style, required
 * Calls onChange(newValue) just like a regular textarea
 */
export default function MentionTextarea({ value, onChange, placeholder, rows = 5, style = {}, required }) {
  const [suggestions, setSuggestions] = useState([]);
  const [mentionStart, setMentionStart] = useState(null); // index of @
  const [query, setQuery]               = useState('');
  const [selectedIdx, setSelectedIdx]   = useState(0);
  const textareaRef = useRef();
  const debounceRef = useRef();

  const handleChange = (e) => {
    const val    = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(val);

    // Detect @mention being typed
    const textBefore = val.slice(0, cursor);
    const match      = textBefore.match(/@(\w*)$/);

    if (match) {
      const q = match[1];
      setMentionStart(cursor - match[0].length);
      setQuery(q);
      setSelectedIdx(0);

      clearTimeout(debounceRef.current);
      if (q.length >= 1) {
        debounceRef.current = setTimeout(async () => {
          try {
            const res = await searchUsers(q);
            setSuggestions(res.data);
          } catch { setSuggestions([]); }
        }, 250);
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setMentionStart(null);
    }
  };

  const insertMention = (user) => {
    const before = value.slice(0, mentionStart);
    const after  = value.slice(textareaRef.current.selectionStart);
    const mention = `@${user.nom} `;
    const newVal  = before + mention + after;
    onChange(newVal);
    setSuggestions([]);
    setMentionStart(null);

    // Restore cursor after mention
    setTimeout(() => {
      const pos = before.length + mention.length;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(suggestions[selectedIdx]); }
    if (e.key === 'Escape') { setSuggestions([]); }
  };

  const roleIcon = (role) => role === 'medecin' ? '🩺' : role === 'etudiant' ? '🎓' : '👤';

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        required={required}
        style={{
          width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0',
          borderRadius: '8px', fontSize: '14px', resize: 'vertical',
          fontFamily: 'Sora, sans-serif', boxSizing: 'border-box', lineHeight: '1.7',
          ...style,
        }}
      />

      {/* Hint */}
      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
        Tapez <strong style={{ color: '#4F46E5' }}>@nom</strong> pour mentionner un membre
      </div>

      {/* Dropdown */}
      {suggestions.length > 0 && (
        <div style={s.dropdown}>
          {suggestions.map((u, i) => (
            <div
              key={u.id}
              onClick={() => insertMention(u)}
              style={{ ...s.item, background: i === selectedIdx ? '#EFF6FF' : '#fff' }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span style={s.avatar}>{u.prenom[0]}{u.nom[0]}</span>
              <div>
                <span style={s.name}>{u.prenom} {u.nom}</span>
                {u.est_verifie && <span style={s.verifBadge}>✓ Vérifié</span>}
                <span style={s.role}>{roleIcon(u.role)} {u.role}</span>
              </div>
            </div>
          ))}
          <div style={s.hint}>↑↓ naviguer · Entrée pour insérer · Échap fermer</div>
        </div>
      )}
    </div>
  );
}

const s = {
  dropdown:  { position: 'absolute', top: 'calc(100% - 24px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' },
  item:      { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', transition: 'background .1s' },
  avatar:    { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1B4FBF, #2563EB)', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:      { fontSize: '13px', fontWeight: '600', color: '#0F172A', display: 'block' },
  verifBadge:{ fontSize: '10px', background: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: '99px', marginLeft: '6px' },
  role:      { fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '1px' },
  hint:      { padding: '6px 14px', fontSize: '10px', color: '#aaa', background: '#f8fafc', borderTop: '1px solid #f1f5f9' },
};
