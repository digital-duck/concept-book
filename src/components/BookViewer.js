export function BookViewer(domainId) {
  const el = document.createElement('div')
  el.className = 'cb-book-viewer'

  const src = `${import.meta.env.BASE_URL}domains/${domainId}/concept_book.html`
  const frame = document.createElement('iframe')
  frame.className = 'cb-book-viewer__frame'
  frame.src = src
  frame.title = `${domainId} concept book`

  el.appendChild(frame)
  return el
}
