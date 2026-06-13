import { getLocale, setLocale } from '../i18n.js'

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  // Phase 2: { code: 'zh', label: '中', name: '中文' },
]

export function LanguagePicker() {
  const el = document.createElement('div')
  el.className = 'cb-lang-picker'

  function render() {
    const current = getLocale()
    el.innerHTML = LANGUAGES.map(l =>
      `<button class="cb-lang-btn ${l.code === current ? 'active' : ''}" data-code="${l.code}" title="${l.name}">${l.label}</button>`
    ).join('')
    el.querySelectorAll('.cb-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setLocale(btn.dataset.code)
        render()
      })
    })
  }

  render()
  return el
}
