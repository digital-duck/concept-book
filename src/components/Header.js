import { t } from '../i18n.js'
import { navigate } from '../router.js'
import { LanguagePicker } from './LanguagePicker.js'

export function Header({ showBack = false, domainName = '' } = {}) {
  const el = document.createElement('header')
  el.className = 'cb-header'

  const inner = document.createElement('div')
  inner.className = 'cb-header__inner'

  if (showBack) {
    const back = document.createElement('button')
    back.className = 'cb-btn-ghost cb-header__back'
    back.textContent = t('domain.back')
    back.addEventListener('click', () => navigate('/'))
    inner.appendChild(back)
  }

  const logo = document.createElement('a')
  logo.className = 'cb-header__logo'
  logo.href = '#/'
  logo.textContent = t('app.title')
  inner.appendChild(logo)

  if (domainName) {
    const dn = document.createElement('span')
    dn.className = 'cb-header__domain'
    dn.textContent = domainName
    inner.appendChild(dn)
  }

  const spacer = document.createElement('span')
  spacer.className = 'cb-header__spacer'
  inner.appendChild(spacer)

  inner.appendChild(LanguagePicker())

  const nav = document.createElement('nav')
  nav.className = 'cb-header__nav'
  nav.innerHTML = `<a href="#/about">${t('nav.about')}</a>`
  inner.appendChild(nav)

  el.appendChild(inner)
  return el
}
