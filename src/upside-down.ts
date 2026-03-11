import './style.css'
import { renderHeader } from './components/header.ts'

const baseFlipTable: Record<string, string> = {
  '\u0021': '\u00A1',
  '\u0022': '\u201E',
  '\u0026': '\u214B',
  '\u0027': '\u002C',
  '\u0028': '\u0029',
  '\u002E': '\u02D9',
  '\u0033': '\u0190',
  '\u0034': '\u152D',
  '\u0036': '\u0039',
  '\u0037': '\u2C62',
  '\u003B': '\u061B',
  '\u003C': '\u003E',
  '\u003F': '\u00BF',
  '\u0041': '\u2200',
  '\u0042': '\u{10412}',
  '\u0043': '\u2183',
  '\u0044': '\u25D6',
  '\u0045': '\u018E',
  '\u0046': '\u2132',
  '\u0047': '\u2141',
  '\u004A': '\u017F',
  '\u004B': '\u22CA',
  '\u004C': '\u2142',
  '\u004D': '\u0057',
  '\u004E': '\u1D0E',
  '\u0050': '\u0500',
  '\u0051': '\u038C',
  '\u0052': '\u1D1A',
  '\u0054': '\u22A5',
  '\u0055': '\u2229',
  '\u0056': '\u1D27',
  '\u0059': '\u2144',
  '\u005B': '\u005D',
  '\u005F': '\u203E',
  '\u0061': '\u0250',
  '\u0062': '\u0071',
  '\u0063': '\u0254',
  '\u0064': '\u0070',
  '\u0065': '\u01DD',
  '\u0066': '\u025F',
  '\u0067': '\u0183',
  '\u0068': '\u0265',
  '\u0069': '\u0131',
  '\u006A': '\u027E',
  '\u006B': '\u029E',
  '\u006C': '\u0283',
  '\u006D': '\u026F',
  '\u006E': '\u0075',
  '\u0072': '\u0279',
  '\u0074': '\u0287',
  '\u0076': '\u028C',
  '\u0077': '\u028D',
  '\u0079': '\u028E',
  '\u007B': '\u007D',
  '\u203F': '\u2040',
  '\u2045': '\u2046',
  '\u2234': '\u2235',
}

const flipTable: Record<string, string> = { ...baseFlipTable }
for (const [left, right] of Object.entries(baseFlipTable)) {
  if (!(right in flipTable)) {
    flipTable[right] = left
  }
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-3xl font-bold">Upside Down</h1>
        <button id="demo-button" type="button" class="btn btn-sm">Demo</button>
      </div>
      <p class="mt-3 text-base-content/70">Type text below to flip it upside down in your browser.</p>

      <form class="mt-6 flex flex-col gap-4" action="#" method="post" onsubmit="return false;">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input text</span>
          </div>
          <textarea id="input-text" class="textarea textarea-bordered min-h-40 w-full" placeholder="Paste or type text here"></textarea>
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Upside-down output</span>
          </div>
          <textarea id="output-text" class="textarea textarea-bordered min-h-40 w-full" readonly></textarea>
        </label>

        <div>
          <button id="copy-button" type="button" class="btn btn-sm">Copy to clipboard</button>
        </div>
      </form>
    </section>
  </section>
</main>
`

const inputText = document.querySelector<HTMLTextAreaElement>('#input-text')
const outputText = document.querySelector<HTMLTextAreaElement>('#output-text')
const copyButton = document.querySelector<HTMLButtonElement>('#copy-button')
const demoButton = document.querySelector<HTMLButtonElement>('#demo-button')

const extractFortuneRaw = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const raw = (payload as Record<string, unknown>).raw

  return typeof raw === 'string' ? raw : null
}

const fetchFortuneJsonp = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const windowRecord = window as unknown as Record<string, unknown>
    const callbackName = `fortuneJsonp_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`
    const script = document.createElement('script')
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Timed out loading fortune'))
    }, 10000)

    const cleanup = () => {
      window.clearTimeout(timeout)
      script.remove()
      delete windowRecord[callbackName]
    }

    windowRecord[callbackName] = (payload: unknown) => {
      cleanup()

      const text = extractFortuneRaw(payload)
      if (!text) {
        reject(new Error('No raw value in response'))
        return
      }

      resolve(text.trim())
    }

    script.onerror = () => {
      cleanup()
      reject(new Error('Unable to load fortune JSONP script'))
    }

    script.src = `http://www.fortune.ninja/fortune/bsd_linux.json?callback=${encodeURIComponent(callbackName)}`
    document.body.appendChild(script)
  })

const toUpsideDown = (value: string): string => {
  let result = ''

  for (const character of value) {
    const flipped = flipTable[character] ?? character
    result = flipped + result
  }

  return result
}

const updateOutput = () => {
  if (!inputText || !outputText) {
    return
  }

  outputText.value = toUpsideDown(inputText.value)
}

inputText?.addEventListener('input', updateOutput)
updateOutput()

demoButton?.addEventListener('click', async () => {
  if (!inputText) {
    return
  }

  demoButton.disabled = true
  demoButton.textContent = 'Loading...'

  try {
    const fortune = await fetchFortuneJsonp()
    inputText.value = fortune
    updateOutput()
    demoButton.textContent = 'Loaded'
  } catch {
    demoButton.textContent = 'Failed'
  }

  window.setTimeout(() => {
    demoButton.disabled = false
    demoButton.textContent = 'Demo'
  }, 1500)
})

copyButton?.addEventListener('click', async () => {
  if (!outputText) {
    return
  }

  try {
    await navigator.clipboard.writeText(outputText.value)
    copyButton.textContent = 'Copied!'
  } catch {
    copyButton.textContent = 'Copy failed'
  }

  window.setTimeout(() => {
    copyButton.textContent = 'Copy to clipboard'
  }, 1500)
})
