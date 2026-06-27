import { Header } from '../components/Header.js'
import { getLocale } from '../i18n.js'

export function getContentLang() {
  return getLocale()
}

const ADAPTERS = {
  claude_cli: {
    label: 'Claude CLI',
    models: [
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
      { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
      { value: 'claude-opus-4-8', label: 'Opus 4.8' },
    ],
  },
  openrouter: {
    label: 'OpenRouter',
    models: [
      { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
      { value: 'anthropic/claude-opus-4-8', label: 'Claude Opus 4.8' },
      { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
      { value: 'openai/o3-mini', label: 'o3-mini' },
      { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
      { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
    ],
  },
  ollama: {
    label: 'Ollama (local)',
    models: null,
  },
}

async function populateModels(adapterSel, modelSel) {
  const adapter = ADAPTERS[adapterSel.value]
  modelSel.innerHTML = ''
  if (!adapter) return

  let models = adapter.models
  if (adapterSel.value === 'ollama' && !models) {
    try {
      const res = await fetch('/api/settings/ollama-models')
      if (res.ok) models = await res.json()
    } catch (_) {}
    if (!models || models.length === 0) {
      const opt = document.createElement('option')
      opt.value = ''
      opt.textContent = '(ollama not available)'
      modelSel.appendChild(opt)
      return
    }
    ADAPTERS.ollama.models = models
  }

  for (const m of models) {
    const opt = document.createElement('option')
    opt.value = m.value
    opt.textContent = m.label
    modelSel.appendChild(opt)
  }
}

function ttlHint(hours) {
  if (hours === 0) return 'never expires'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours === 1) return '1 hour'
  if (hours < 24) return `${hours} hours`
  const days = hours / 24
  return Number.isInteger(days) ? `${days} day${days > 1 ? 's' : ''}` : `${hours} hours`
}

export async function Settings(container) {
  container.innerHTML = ''
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-settings'
  main.innerHTML = `
    <h2>Settings</h2>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">LLM</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">Adapter</label>
          <select id="cb-adapter" class="cb-settings__select">
            ${Object.entries(ADAPTERS).map(([k, v]) =>
              `<option value="${k}">${v.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="cb-settings__field cb-settings__field--grow">
          <label class="cb-settings__label">Model</label>
          <select id="cb-model" class="cb-settings__select"></select>
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-settings-save" class="cb-btn">Save</button>
        <span id="cb-settings-status" class="cb-settings__status"></span>
      </div>
      <div class="cb-settings__current" id="cb-current-llm"></div>
    </section>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">Compare Cache</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">TTL (hours)</label>
          <input id="cb-cache-ttl" type="number" min="0" step="1" value="24"
            class="cb-settings__select" style="width:100px"
            title="How long a cached comparison result is reused. 0 = never expire.">
        </div>
        <div class="cb-settings__field" style="align-self:flex-end;padding-bottom:4px">
          <span id="cb-cache-ttl-hint" style="font-size:0.82rem;color:#6b7280"></span>
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-cache-save" class="cb-btn">Save</button>
        <span id="cb-cache-status" class="cb-settings__status"></span>
      </div>
    </section>
  `
  container.appendChild(main)

  // ── LLM section ────────────────────────────────────────────────────────────
  const adapterSel = main.querySelector('#cb-adapter')
  const modelSel = main.querySelector('#cb-model')
  const saveBtn = main.querySelector('#cb-settings-save')
  const status = main.querySelector('#cb-settings-status')
  const currentLlm = main.querySelector('#cb-current-llm')

  adapterSel.addEventListener('change', () => populateModels(adapterSel, modelSel))
  await populateModels(adapterSel, modelSel)

  // ── Compare Cache section ──────────────────────────────────────────────────
  const ttlInput = main.querySelector('#cb-cache-ttl')
  const ttlHintEl = main.querySelector('#cb-cache-ttl-hint')
  const cacheSaveBtn = main.querySelector('#cb-cache-save')
  const cacheStatus = main.querySelector('#cb-cache-status')

  ttlInput.addEventListener('input', () => {
    const h = Number(ttlInput.value)
    ttlHintEl.textContent = isNaN(h) || h < 0 ? '' : ttlHint(h)
  })

  // ── Load current settings ──────────────────────────────────────────────────
  try {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()

      // LLM
      currentLlm.textContent = `Current: ${data.llm}`
      const [adapter, ...modelParts] = data.llm.split(':')
      const model = modelParts.join(':')
      if (ADAPTERS[adapter]) {
        adapterSel.value = adapter
        await populateModels(adapterSel, modelSel)
        if ([...modelSel.options].some(o => o.value === model)) {
          modelSel.value = model
        }
      }

      // Compare Cache TTL — server stores seconds, UI shows hours
      const hours = Math.round(data.compare_cache_ttl / 3600)
      ttlInput.value = hours
      ttlHintEl.textContent = ttlHint(hours)
    }
  } catch (_) {
    status.textContent = 'API not reachable — run the backend to change settings'
    status.style.color = '#dc2626'
  }

  // ── Save LLM ───────────────────────────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    const llm = `${adapterSel.value}:${modelSel.value}`
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llm }),
      })
      if (res.ok) {
        currentLlm.textContent = `Current: ${llm}`
        status.textContent = 'Saved'
        status.style.color = '#16a34a'
      } else {
        status.textContent = 'Save failed'
        status.style.color = '#dc2626'
      }
    } catch (_) {
      status.textContent = 'API not reachable'
      status.style.color = '#dc2626'
    }
    setTimeout(() => { status.textContent = '' }, 3000)
  })

  // ── Save Compare Cache TTL ─────────────────────────────────────────────────
  cacheSaveBtn.addEventListener('click', async () => {
    const hours = Number(ttlInput.value)
    if (isNaN(hours) || hours < 0) {
      cacheStatus.textContent = 'Enter a valid number ≥ 0'
      cacheStatus.style.color = '#dc2626'
      setTimeout(() => { cacheStatus.textContent = '' }, 3000)
      return
    }
    const seconds = Math.round(hours * 3600)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compare_cache_ttl: seconds }),
      })
      if (res.ok) {
        ttlHintEl.textContent = ttlHint(hours)
        cacheStatus.textContent = 'Saved'
        cacheStatus.style.color = '#16a34a'
      } else {
        cacheStatus.textContent = 'Save failed'
        cacheStatus.style.color = '#dc2626'
      }
    } catch (_) {
      cacheStatus.textContent = 'API not reachable'
      cacheStatus.style.color = '#dc2626'
    }
    setTimeout(() => { cacheStatus.textContent = '' }, 3000)
  })
}
