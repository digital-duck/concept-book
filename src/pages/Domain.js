import { loadCatalog } from '../data/catalog.js'
import { Header } from '../components/Header.js'
import { GraphViewer } from '../components/GraphViewer.js'

export async function Domain(container, { id }) {
  container.innerHTML = ''

  let domainName = id
  try {
    const catalog = await loadCatalog()
    const domain = catalog.find(d => d.id === id)
    if (domain) domainName = domain.name
  } catch (_) {
    // fall back to raw id
  }

  container.appendChild(Header({ showBack: true, domainName }))

  const main = document.createElement('main')
  main.className = 'cb-domain'
  main.appendChild(GraphViewer(id))
  container.appendChild(main)
}
