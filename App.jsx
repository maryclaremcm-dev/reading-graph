import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

function themeColor(theme) {
  const COLORS = ['#c9a84c','#4a9e8a','#c45c5c','#7b5ea7','#5c8dc4','#c47a3d','#4a8a5c','#c45c8d','#5ca8c4','#a8c45c'];
  let h = 0;
  for (const c of theme) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return COLORS[h % COLORS.length];
}

function dominantTheme(entry) {
  return entry.themes?.[0] || null;
}

export default function GraphView({ entries }) {
  const svgRef = useRef();
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!entries.length || !svgRef.current) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    defs.append('filter').attr('id', 'glow')
      .append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');

    // Build graph data
    const nodes = entries.map(e => ({
      id: e.id,
      title: e.title,
      themes: e.themes,
      url: e.url,
      source_type: e.source_type,
      quoteCount: e.quotes.length,
      color: dominantTheme(e) ? themeColor(dominantTheme(e)) : '#555',
    }));

    const links = [];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const shared = entries[i].themes.filter(t => entries[j].themes.includes(t));
        if (shared.length > 0) {
          links.push({
            source: entries[i].id,
            target: entries[j].id,
            sharedThemes: shared,
            weight: shared.length,
          });
        }
      }
    }

    // Zoom/pan
    const g = svg.append('g');
    svg.call(d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', e => g.attr('transform', e.transform))
    );

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => 120 - d.weight * 15).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(32));

    // Links
    const link = g.append('g').selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#2a2a2a')
      .attr('stroke-width', d => Math.min(d.weight * 1.5, 4))
      .attr('stroke-opacity', 0.7);

    // Nodes
    const node = g.append('g').selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelected(prev => prev?.id === d.id ? null : entries.find(e => e.id === d.id));
      })
      .on('mouseenter', (event, d) => setHovered(d.id))
      .on('mouseleave', () => setHovered(null));

    // Node circle glow ring
    node.append('circle')
      .attr('r', d => 12 + d.quoteCount * 1.5)
      .attr('fill', d => d.color + '22')
      .attr('stroke', d => d.color + '44')
      .attr('stroke-width', 1);

    // Node circle
    node.append('circle')
      .attr('r', d => 8 + d.quoteCount)
      .attr('fill', d => d.color + 'cc')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5);

    // Node label (short)
    node.append('text')
      .attr('dy', d => -(10 + d.quoteCount) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#b0a898')
      .attr('font-size', 10)
      .attr('font-family', 'DM Sans, system-ui, sans-serif')
      .attr('pointer-events', 'none')
      .text(d => d.title.length > 30 ? d.title.slice(0, 28) + '…' : d.title);

    svg.on('click', () => setSelected(null));

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [entries]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: 20, left: 20,
        background: 'rgba(14,14,14,0.9)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 14px',
        zIndex: 5,
        maxWidth: 180,
      }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
          How to read
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#c9a84c88" stroke="#c9a84c" strokeWidth="1.5" /></svg>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Node = one piece</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="#2a2a2a" strokeWidth="3" /></svg>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Edge = shared theme</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#c9a84c88" /><circle cx="7" cy="7" r="3" fill="#c9a84ccc" /></svg>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Size = quote count</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#4a9e8a88" stroke="#4a9e8a" strokeWidth="1.5" /></svg>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Color = top theme</span>
          </div>
        </div>
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
          Click node for details. Drag to rearrange. Scroll to zoom.
        </p>
      </div>

      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Side panel */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: 320,
          height: '100%',
          background: 'rgba(10,10,10,0.97)',
          borderLeft: '1px solid var(--border)',
          overflowY: 'auto',
          padding: '24px 20px',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <span className={`badge badge-${selected.source_type}`}>{selected.source_type}</span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 0 }}>×</button>
          </div>

          <a
            href={selected.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, display: 'block', marginBottom: 14 }}
          >
            {selected.title}
          </a>

          {/* Themes */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Themes</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {selected.themes.map(t => (
                <span key={t} style={{
                  fontSize: 11, padding: '2px 9px', borderRadius: 20,
                  background: `${themeColor(t)}15`, color: themeColor(t),
                  border: `1px solid ${themeColor(t)}30`,
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Quotes */}
          {selected.quotes?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Quotes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.quotes.map((q, i) => (
                  <div key={i} style={{
                    borderLeft: `2px solid ${selected.themes[0] ? themeColor(selected.themes[0]) : 'var(--border)'}`,
                    paddingLeft: 12,
                  }}>
                    <p style={{ fontStyle: 'italic', fontSize: 12, lineHeight: 1.75, color: 'var(--text-dim)', marginBottom: 4 }}>
                      "{q.text}"
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{q.locationHint}</span>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {(q.themes || []).map(t => (
                          <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.note && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Note</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.6 }}>{selected.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
