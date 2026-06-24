import { t } from '../i18n.js'
import { navigate } from '../router.js'
import { LanguagePicker } from './LanguagePicker.js'

export function Header({ showBack = false, domainName = '' } = {}) {
  const el = document.createElement('header')
  el.className = 'cb-header'

  const topRow = document.createElement('div')
  topRow.className = 'cb-header__top'

  const logo = document.createElement('a')
  logo.className = 'cb-header__logo'
  logo.href = '#/'
  logo.textContent = t('app.title')
  topRow.appendChild(logo)

  const spacer = document.createElement('span')
  spacer.className = 'cb-header__spacer'
  topRow.appendChild(spacer)

  topRow.appendChild(LanguagePicker())

  const nav = document.createElement('nav')
  nav.className = 'cb-header__nav'
  nav.innerHTML = `<a href="#/settings">${t('nav.settings')}</a> <a href="#/about">${t('nav.about')}</a>`
  topRow.appendChild(nav)

  el.appendChild(topRow)

  if (showBack || domainName) {
    const subRow = document.createElement('div')
    subRow.className = 'cb-header__sub'

    if (showBack) {
      const back = document.createElement('button')
      back.className = 'cb-btn-ghost cb-header__back'
      back.textContent = t('domain.back')
      back.addEventListener('click', () => navigate('/'))
      subRow.appendChild(back)
    }

    if (domainName) {
      const dn = document.createElement('span')
      dn.className = 'cb-header__domain'
      dn.textContent = domainName
      subRow.appendChild(dn)
    }

    el.appendChild(subRow)
  }

  return el
}
