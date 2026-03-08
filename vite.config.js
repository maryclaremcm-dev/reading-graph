import { useState, useMemo } from 'react';

function themeColor(theme) {
  const COLORS = ['#c9a84c','#4a9e8a','#c45c5c','#7b5ea7','#5c8dc4','#c47a3d','#4a8a5c','#c45c8d','#5ca8c4','#a8c45c'];
  let h = 0;
  for (const c of theme) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return COLORS[h % COLORS.length];
}

export default function ThemeView({ entries, themes }) {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]?.name || null);

  const { themeEntries, themeQuotes } = useMemo(() => {
    if (!selectedTheme) return { themeEntries: [], themeQuotes: [] };

    const themeEntries = entries.filter(e => e.themes.includes(selectedTheme));

    const themeQuotes = [];
    entries.forEach(entry => {
      entry.quotes.forEach(q => {
        if ((q.themes || []).includes(selectedTheme)) {
          themeQuotes.push({ ...q, entryTitle: entry.title, entryUrl: entry.url, entryId: entry.id });
        }
      });
    });

    return { themeEntries, themeQuotes };
  }, [selectedTheme, entries]);

  const color = selectedTheme ? themeColor(selectedTheme) : 'var(--accent)';

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Theme sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        padding: '20px 0',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 16px', marginBottom: 10 }}>
          All themes
        </p>
        {themes.map(t => {
          const c = themeColor(t.name);
          const active = selectedTheme === t.name;
          return (
            <button
              key={t.name}
              onClick={() => setSelectedTheme(t.name)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: active ? `${c}12` : 'none',
                border: 'none',
                borderLeft: `2px solid ${active ? c : 'transparent'}`,
                color: active ? 'var(--text)' : 'var(--muted)',
                fontSize: 12,
                padding: '7px 16px 7px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                lineHeight: 1.4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: 4 }}>
                  {t.name}
                </span>
                <span style={{ fontSize: 10, opacity: 0.5, flexShrink: 0 }}>{t.count}</span>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Main panel */}
      {selectedTheme ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {/* Theme header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: 'var(--font-head)',
              fontSize: 26,
              fontWeight: 500,
              color: color,
              marginBottom: 8,
            }}>
              {selectedTheme}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {themeEntries.length} {themeEntries.length === 1 ? 'piece' : 'pieces'} · {themeQuotes.length} tagged {themeQuotes.length === 1 ? 'quote' : 'quotes'}
            </p>
          </div>

          {/* Quotes section — this is the core "find relevant quotes" feature */}
          {themeQuotes.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 14,
              }}>
                Relevant quotes across all readings
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {themeQuotes.map((q, i) => (
                  <div key={i} style={{
                    background: 'var(--surface)',
                    border: `1px solid var(--border)`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: '0 6px 6px 0',
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontStyle: 'italic', fontSize: 13, lineHeight: 1.75, color: 'var(--text-dim)', marginBottom: 10 }}>
                      "{q.text}"
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <a
                        href={q.entryUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 11, color: 'var(--accent)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {q.entryTitle}
                      </a>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {q.locationHint && (
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{q.locationHint}</span>
                        )}
                        {(q.themes || []).filter(t => t !== selectedTheme).map(t => (
                          <span key={t} onClick={() => setSelectedTheme(t)} style={{
                            fontSize: 10,
                            padding: '1px 7px',
                            borderRadius: 20,
                            background: `${themeColor(t)}12`,
                            color: themeColor(t),
                            border: `1px solid ${themeColor(t)}25`,
                            cursor: 'pointer',
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Entries section */}
          <section>
            <h2 style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 14,
            }}>
              Readings tagged with this theme
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {themeEntries.map(e => {
                const date = new Date(e.date_saved).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={e.id} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontFamily: 'var(--font-head)', fontSize: 14, color: 'var(--text)', display: 'block', marginBottom: 6 }}
                      >
                        {e.title}
                      </a>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {e.themes.filter(t => t !== selectedTheme).map(t => (
                          <span
                            key={t}
                            onClick={() => setSelectedTheme(t)}
                            style={{
                              fontSize: 10,
                              padding: '1px 7px',
                              borderRadius: 20,
                              background: `${themeColor(t)}12`,
                              color: themeColor(t),
                              border: `1px solid ${themeColor(t)}25`,
                              cursor: 'pointer',
                            }}
                          >{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <span className={`badge badge-${e.source_type}`}>{e.source_type}</span>
                      <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          Select a theme to explore
        </div>
      )}
    </div>
  );
}
