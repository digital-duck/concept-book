export function GraphViewer(domainId) {
  const el = document.createElement('div')
  el.className = 'cb-graph-viewer'

  const src = `${import.meta.env.BASE_URL}domains/${domainId}/graph.html`
  const frame = document.createElement('iframe')
  frame.className = 'cb-graph-viewer__frame'
  frame.src = src
  frame.title = `${domainId} concept graph`
  frame.setAttribute('allowfullscreen', '')

  el.appendChild(frame)
  return el
}
