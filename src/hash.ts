import './style.css'
import { renderHeader } from './components/header.ts'

type HashResult = {
  algorithm: string
  value: string
}

const hashAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const
const copyIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path><path d="M16 4h2a2 2 0 0 1 2 2v4"></path><path d="M21 14H11"></path><path d="m15 10-4 4 4 4"></path></svg>'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">Hash</h1>
      <p class="mt-3 text-base-content/70">Calculate hashes for files, bytes or strings in your browser.  Alternatives: <a class="underline" href="https://www.fileformat.info/tool/hash.htm">Java</a> and <a class="underline" href="https://resolve.rs/crypto/hash.html">NodeJS</a></p>

      <section class="mt-6 flex flex-col gap-4">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input string (UTF-8)</span>
          </div>
          <textarea id="input-string" rows="4" class="textarea textarea-bordered w-full" placeholder="Paste or type text here"></textarea>
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input bytes</span>
          </div>
          <textarea id="input-bytes" rows="4" class="textarea textarea-bordered w-full" placeholder="Examples: 0x48 0x65 0x6C 0x6C 0x6F or 72 101 108 108 111"></textarea>
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input file</span>
          </div>
          <input id="input-file" type="file" class="file-input file-input-bordered w-full" />
        </label>

        <div id="form-error" class="alert alert-error hidden" role="alert" aria-live="polite"></div>
      </section>

      <section id="input-info" class="mt-8 hidden">
        <h2 class="text-xl font-semibold">Input info</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="table">
            <tbody>
              <tr>
                <th class="w-56">Length</th>
                <td id="info-length"></td>
              </tr>
              <tr>
                <th>First bytes</th>
                <td id="info-bytes" class="font-mono"></td>
              </tr>
              <tr>
                <th>First characters</th>
                <td id="info-chars" class="whitespace-pre-wrap break-words"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="hash-results" class="mt-8 hidden">
        <h2 class="text-xl font-semibold">Hash results</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Hash (hex)</th>
              </tr>
            </thead>
            <tbody id="hash-results-body"></tbody>
          </table>
        </div>
      </section>
    </section>
  </section>
</main>
`

const inputFile = document.querySelector<HTMLInputElement>('#input-file')
const inputString = document.querySelector<HTMLTextAreaElement>('#input-string')
const inputBytes = document.querySelector<HTMLTextAreaElement>('#input-bytes')
const formError = document.querySelector<HTMLDivElement>('#form-error')

const inputInfoSection = document.querySelector<HTMLElement>('#input-info')
const infoLength = document.querySelector<HTMLTableCellElement>('#info-length')
const infoBytes = document.querySelector<HTMLTableCellElement>('#info-bytes')
const infoChars = document.querySelector<HTMLTableCellElement>('#info-chars')

const hashResultsSection = document.querySelector<HTMLElement>('#hash-results')
const hashResultsBody = document.querySelector<HTMLTableSectionElement>('#hash-results-body')

let updateCounter = 0

const nextUpdateId = (): number => {
  updateCounter += 1
  return updateCounter
}

const isCurrentUpdate = (id: number): boolean => id === updateCounter

const showError = (message: string) => {
  if (!formError) {
    return
  }

  formError.textContent = message
  formError.classList.remove('hidden')
}

const hideError = () => {
  if (!formError) {
    return
  }

  formError.textContent = ''
  formError.classList.add('hidden')
}

const hideResults = () => {
  inputInfoSection?.classList.add('hidden')
  hashResultsSection?.classList.add('hidden')
}

const formatCount = (value: number): string => value.toLocaleString()

const formatFirstBytes = (bytes: Uint8Array): string => {
  if (bytes.length === 0) {
    return '(none)'
  }

  const maxPreviewLength = 16
  const head = Array.from(bytes.slice(0, maxPreviewLength), (byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')

  return bytes.length > maxPreviewLength ? `${head} …` : head
}

const isAsciiByte = (byte: number): boolean => byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)
const isAsciiData = (bytes: Uint8Array): boolean => bytes.every((byte) => isAsciiByte(byte))

const getAsciiPreview = (bytes: Uint8Array): string => {
  if (bytes.length === 0) {
    return '(none)'
  }

  const maxChars = 64
  const preview = Array.from(bytes.slice(0, maxChars), (byte) => String.fromCharCode(byte)).join('')
  return bytes.length > maxChars ? `${preview}…` : preview
}

const bytesToHex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

const formatHashDisplay = (hexValue: string): string => {
  const chunks = hexValue.match(/.{1,8}/g)
  return (chunks ?? [hexValue]).map((chunk) => `<span class="whitespace-nowrap">${chunk}</span>`).join(' ')
}

const parseByteToken = (token: string): number => {
  if (/^0x[0-9a-fA-F]{1,2}$/.test(token)) {
    return Number.parseInt(token.slice(2), 16)
  }

  if (/^[0-9]+$/.test(token)) {
    return Number.parseInt(token, 10)
  }

  if (/^[0-9a-fA-F]{1,2}$/.test(token)) {
    return Number.parseInt(token, 16)
  }

  throw new Error(`Invalid byte token: ${token}`)
}

const parseBytesInput = (value: string): Uint8Array => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('Please enter at least one byte value.')
  }

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean)
  const parsed = tokens.map((token) => {
    const byte = parseByteToken(token)
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
      throw new Error(`Byte out of range (0-255): ${token}`)
    }

    return byte
  })

  return new Uint8Array(parsed)
}

const hashBytes = async (bytes: Uint8Array): Promise<HashResult[]> => {
  const digestInput = new Uint8Array(bytes.byteLength)
  digestInput.set(bytes)

  const results = await Promise.all(
    hashAlgorithms.map(async (algorithm) => {
      const digest = await crypto.subtle.digest(algorithm, digestInput)
      return {
        algorithm,
        value: bytesToHex(new Uint8Array(digest)),
      }
    }),
  )

  return results
}

const renderInputInfo = (bytes: Uint8Array, charPreview: string) => {
  if (!inputInfoSection || !infoLength || !infoBytes || !infoChars) {
    return
  }

  infoLength.textContent = `${formatCount(bytes.length)} bytes`
  infoBytes.textContent = formatFirstBytes(bytes)
  infoChars.textContent = charPreview

  inputInfoSection.classList.remove('hidden')
}

const renderHashResults = (results: HashResult[]) => {
  if (!hashResultsSection || !hashResultsBody) {
    return
  }

  hashResultsBody.innerHTML = results
    .map(
      (result) =>
        `<tr><td>${result.algorithm}</td><td><div class="flex items-center gap-2"><button type="button" class="btn btn-xs" data-copy-hash="${result.value}" title="Copy hash" aria-label="Copy ${result.algorithm} hash"><span class="block h-4 w-4">${copyIconSvg}</span></button><span class="font-mono">${formatHashDisplay(result.value)}</span></div></td></tr>`,
    )
    .join('')

  hashResultsSection.classList.remove('hidden')
}

const applyInput = async (bytes: Uint8Array, charPreview: string, updateId: number) => {
  const results = await hashBytes(bytes)
  if (!isCurrentUpdate(updateId)) {
    return
  }

  renderInputInfo(bytes, charPreview)
  renderHashResults(results)
}

const clearOtherInputs = (source: 'file' | 'string' | 'bytes') => {
  if (source !== 'file' && inputFile) {
    inputFile.value = ''
  }

  if (source !== 'string' && inputString) {
    inputString.value = ''
  }

  if (source !== 'bytes' && inputBytes) {
    inputBytes.value = ''
  }
}

const handleStringInput = async () => {
  const updateId = nextUpdateId()
  clearOtherInputs('string')
  hideError()

  const text = inputString?.value ?? ''
  const bytes = new TextEncoder().encode(text)
  const maxChars = 64
  const charPreview = text.length > maxChars ? `${text.slice(0, maxChars)}…` : text || '(none)'

  try {
    await applyInput(bytes, charPreview, updateId)
  } catch {
    if (!isCurrentUpdate(updateId)) {
      return
    }

    showError('Unable to hash input.')
    hideResults()
  }
}

const handleBytesInput = async () => {
  const updateId = nextUpdateId()
  clearOtherInputs('bytes')
  hideError()

  try {
    const bytes = parseBytesInput(inputBytes?.value ?? '')
    const charPreview = isAsciiData(bytes) ? getAsciiPreview(bytes) : '(not ASCII)'
    await applyInput(bytes, charPreview, updateId)
  } catch (error) {
    if (!isCurrentUpdate(updateId)) {
      return
    }

    const message = error instanceof Error ? error.message : 'Unable to parse bytes input.'
    showError(message)
    hideResults()
  }
}

const handleFileInput = async () => {
  const file = inputFile?.files?.[0]
  if (!file) {
    return
  }

  const updateId = nextUpdateId()
  clearOtherInputs('file')
  hideError()

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const charPreview = isAsciiData(bytes) ? getAsciiPreview(bytes) : '(not ASCII)'
    await applyInput(bytes, charPreview, updateId)
  } catch {
    if (!isCurrentUpdate(updateId)) {
      return
    }

    showError('Unable to read the selected file.')
    hideResults()
  } finally {
    if (inputFile) {
      inputFile.value = ''
    }
  }
}

hashResultsBody?.addEventListener('click', async (event) => {
  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  const button = target.closest<HTMLButtonElement>('button[data-copy-hash]')
  const value = button?.dataset.copyHash

  if (!button || !value) {
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    button.textContent = '✓'
  } catch {
    button.textContent = '!'
  }

  window.setTimeout(() => {
    button.innerHTML = `<span class="block h-4 w-4">${copyIconSvg}</span>`
  }, 1200)
})

inputString?.addEventListener('input', () => {
  void handleStringInput()
})

inputBytes?.addEventListener('input', () => {
  void handleBytesInput()
})

inputFile?.addEventListener('change', () => {
  void handleFileInput()
})

inputString?.focus()
void handleStringInput()
