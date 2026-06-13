import { loadCatalog } from '../data/catalog.js'
import { Header } from '../components/Header.js'
import { GraphViewer } from '../components/GraphViewer.js'

export async function Domain(container, { id }) {
  container.innerHTML = ''

  const controller = new AbortController()
  window.addEventListener('hashchange', () => controller.abort(), { once: true, signal: controller.signal })

  let domain = { id, name: id, has_book: false, books: [], generated_concepts: [], capstone: null }
  try {
    const catalog = await loadCatalog()
    domain = catalog.find(d => d.id === id) ?? domain
  } catch (_) {}

  container.appendChild(Header({ showBack: true, domainName: domain.name }))

  const main = document.createElement('main')
  main.className = 'cb-domain'
  main.appendChild(GraphViewer(domain))
  container.appendChild(main)
}
