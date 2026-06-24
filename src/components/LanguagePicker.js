import { getLocale } from '../i18n.js'

const LANG_LABELS = {
  en: 'EN', zh: '中', es: 'ES', fr: 'FR', de: 'DE',
  ja: '日', ko: '한', pt: 'PT', ar: 'ع', hi: 'हि',
}

export function LanguagePicker() {
  const el = document.createElement('div')
  el.className = 'cb-lang-picker'

  function render() {
    const code = getLocale()
    const label = LANG_LABELS[code] || code.toUpperCase()
    el.innerHTML = `<span class="cb-lang-btn active" title="${code}">${label}</span>`
  }

  render()
  return el
}
