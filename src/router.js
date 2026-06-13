const _routes = {}

export function register(pattern, handler) {
  _routes[pattern] = handler
}

export function navigate(path) {
  window.location.hash = path
}

function _resolve() {
  const hash = window.location.hash.slice(1) || '/'

  const domainMatch = hash.match(/^\/domain\/(.+)$/)
  if (domainMatch) {
    _routes['/domain/:id']?.({ id: domainMatch[1] })
    return
  }

  _routes[hash]?.({})
}

export function start() {
  window.addEventListener('hashchange', _resolve)
  _resolve()
}
