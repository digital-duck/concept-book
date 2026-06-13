import { loadCatalog } from '../data/catalog.js'
import { DomainCard } from '../components/DomainCard.js'
import { Header } from '../components/Header.js'
import { t } from '../i18n.js'

export async function Home(container) {
  container.innerHTML = ''
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-home'
  main.innerHTML = `<p class="cb-loading">${t('loading')}</p>`
  container.appendChild(main)

  let catalog
  try {
    catalog = await loadCatalog()
  } catch (err) {
    main.innerHTML = `<p class="cb-error">Could not load domains. ${err.message}</p>`
    return
  }

  const allTags = [...new Set(catalog.flatMap(d => d.tags))].sort()
  let activeTag = 'all'

  function render(tag) {
    activeTag = tag
    const filtered = tag === 'all' ? catalog : catalog.filter(d => d.tags.includes(tag))

    main.innerHTML = `
      <div class="cb-home__hero">
        <p class="cb-home__subtitle">${t('home.subtitle')}</p>
      </div>
      <div class="cb-home__filters">
        <button class="cb-filter-btn ${activeTag === 'all' ? 'active' : ''}" data-tag="all">
          ${t('home.filter.all')}
        </button>
        ${allTags.map(t_ =>
          `<button class="cb-filter-btn ${activeTag === t_ ? 'active' : ''}" data-tag="${t_}">${t_}</button>`
        ).join('')}
      </div>
      <div class="cb-card-grid"></div>
    `

    const grid = main.querySelector('.cb-card-grid')
    filtered.forEach(domain => grid.appendChild(DomainCard(domain)))

    main.querySelectorAll('.cb-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => render(btn.dataset.tag))
    })
  }

  render('all')
}
