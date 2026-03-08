import { useState, useEffect, useCallback } from 'react';
import LibraryView from './components/LibraryView.jsx';
import ThemeView from './components/ThemeView.jsx';
import GraphView from './components/GraphView.jsx';

const TABS = ['library', 'themes', 'graph'];
const TAB_LABELS = { library: 'Library', themes: 'Themes', graph: 'Graph' };

export default function App() {
  const [tab, setTab] = useState('library');
  const [entries, setEntries] = useState([]);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, themesRes] = await Promise.all([
        fetch('/entries'),
        fetch('/themes'),
      ]);
      setEntries(await entriesRes.json());
      setThemes(await themesRes.json());
    } catch (e) {
      setError('Could not connect to the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = useCallback(async (id) => {
    await fetch(`/entries/${id}`, { method: 'DELETE' });
    fetchData();
  }, [fetchData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Nav */}
      <nav style={{
        height: 'var(--nav-h)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 32,
        flexShrink: 0,
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--accent)', fontSize: 20 }}>◈</span>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>
            Reading Graph
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'var(--surface2)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--muted)',
                border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '5px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            {entries.length} {entries.length === 1 ? 'piece' : 'pieces'} · {themes.length} themes
          </span>
        </div>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
            <div>Loading your library…</div>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)' }}>
            <span style={{ fontSize: 36, color: 'var(--border)' }}>◈</span>
            <p style={{ fontSize: 15 }}>No readings yet.</p>
            <p style={{ fontSize: 12, maxWidth: 280, textAlign: 'center', lineHeight: 1.7 }}>
              Use the Chrome extension to capture your first article, video, or paper.
            </p>
          </div>
        ) : tab === 'library' ? (
          <LibraryView entries={entries} themes={themes} onDelete={handleDelete} />
        ) : tab === 'themes' ? (
          <ThemeView entries={entries} themes={themes} />
        ) : (
          <GraphView entries={entries} themes={themes} />
        )}
      </div>
    </div>
  );
}
