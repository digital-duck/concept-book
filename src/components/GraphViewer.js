export function GraphViewer(domain) {
  const { id: domainId, has_book, capstone } = domain

  const el = document.createElement('div')
  el.className = 'cb-graph-viewer'

  const frame = document.createElement('iframe')
  frame.className = 'cb-graph-viewer__frame'
  frame.src = `${import.meta.env.BASE_URL}domains/${domainId}/graph.html`
  frame.title = `${domainId} concept graph`
  frame.setAttribute('allowfullscreen', '')

  frame.addEventListener('load', () => {
    try {
      const win = frame.contentWindow
      if (!win) return

      // graph.html uses `const RAW` and `const nodeIndex` — these are NOT on window.
      // Expose them so we can read from the parent.
      win.eval('window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex')

      // ── 1. Broadcast concept list to parent (for ConceptPanel target select) ──
      const concepts = (win.__cb_RAW?.nodes || []).map(n => ({
        id: n.id, label: n.label, kind: n.kind, tier: n.tier ?? 0,
      }))
      window.dispatchEvent(new CustomEvent('cb:graphLoaded', { detail: { concepts } }))

      // ── 2. Patch handleSelect → emit cb:nodeSelected ──
      const _orig = win.handleSelect
      win.handleSelect = function (nodeId) {
        _orig.call(win, nodeId)
        const node = win.__cb_nodeIndex?.[nodeId]
        if (node) {
          window.dispatchEvent(new CustomEvent('cb:nodeSelected', { detail: { nodeId, node } }))
        }
      }

      // ── 3. Inject "Generate concept book" into the graph's left sidebar ──
      if (!has_book) {
        _injectGenerateSection(win, frame.contentDocument, domainId, capstone)
      }
    } catch (_) { /* cross-origin safety */ }
  })

  el.appendChild(frame)

  el.selectNode = (nodeId) => {
    try { frame.contentWindow?.selectNode?.(nodeId) } catch (_) {}
  }

  return el
}

// ── Sidebar injection ─────────────────────────────────────────────────────────

function _injectGenerateSection(win, doc, domainId, capstone) {
  const sidebar = doc.querySelector('#path-sidebar')
  const pathHeader = doc.querySelector('#path-header')
  if (!sidebar || !pathHeader || doc.querySelector('#cb-gen')) return

  const div = doc.createElement('div')
  div.id = 'cb-gen'
  div.style.cssText = [
    'padding:12px 14px',
    'border-bottom:1px solid #dde0e6',
    'flex-shrink:0',
    'background:#f5f6f8',
  ].join(';')

  div.innerHTML = `
    <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;
                color:#888;font-weight:700;margin-bottom:8px">
      Generate Book
    </div>
    <select id="cb-target-sel"
      style="width:100%;padding:5px 8px;border:1px solid #ccc;border-radius:5px;
             background:#fff;color:#2a2a2a;font-size:12px;margin-bottom:6px;
             font-family:system-ui,sans-serif">
      <option value="">Select target concept…</option>
    </select>
    <button id="cb-gen-btn" disabled
      style="width:100%;padding:6px 10px;background:#2563eb;color:#fff;
             border:none;border-radius:5px;font-size:12px;cursor:pointer;
             font-family:system-ui,sans-serif">
      Generate
    </button>
    <pre id="cb-gen-log"
      style="display:none;margin-top:8px;font-size:10px;line-height:1.5;
             color:#2a2a2a;background:#e8eaed;padding:8px;border-radius:4px;
             max-height:160px;overflow-y:auto;white-space:pre-wrap;
             font-family:Menlo,Consolas,monospace"></pre>
  `

  pathHeader.insertAdjacentElement('afterend', div)

  // Populate target select from graph data
  const sel = div.querySelector('#cb-target-sel')
  const btn = div.querySelector('#cb-gen-btn')
  const log = div.querySelector('#cb-gen-log')

  const sorted = (win.__cb_RAW?.nodes || [])
    .filter(n => n.kind !== 'primitive')
    .sort((a, b) => {
      const ko = { application: 0, concept: 1 }
      return (ko[a.kind] ?? 2) - (ko[b.kind] ?? 2) || (b.tier ?? 0) - (a.tier ?? 0)
    })

  sorted.forEach(c => {
    const opt = doc.createElement('option')
    opt.value = c.id
    opt.textContent = c.label
    if (c.id === capstone) opt.selected = true
    sel.appendChild(opt)
  })

  if (sel.value) btn.disabled = false

  sel.addEventListener('change', () => { btn.disabled = !sel.value })

  btn.addEventListener('click', () => {
    const target = sel.value
    if (!target) return

    btn.disabled = true
    btn.textContent = 'Generating…'
    log.style.display = 'block'
    log.textContent = `▶ target: ${target}\n`

    // EventSource runs from iframe origin — same origin as parent, Vite proxies /api
    const url = `/api/generate?domain=${encodeURIComponent(domainId)}&target=${encodeURIComponent(target)}`
    const es = new win.EventSource(url)

    es.addEventListener('log', e => {
      const { message } = JSON.parse(e.data)
      log.textContent += message + '\n'
      log.scrollTop = log.scrollHeight
    })

    es.addEventListener('done', () => {
      es.close()
      log.textContent += '\n✓ Done — reloading…'
      setTimeout(() => win.parent.location.reload(), 1200)
    })

    es.addEventListener('gen_error', e => {
      es.close()
      log.textContent += `\n✗ ${JSON.parse(e.data).message}`
      btn.disabled = false
      btn.textContent = 'Retry'
    })

    es.onerror = () => {
      if (es.readyState === win.EventSource.CLOSED) return
      es.close()
      log.textContent += '\n✗ API not reachable.\n  Run: bash scripts/start-api.sh'
      btn.disabled = false
      btn.textContent = 'Retry'
    }
  })
}
