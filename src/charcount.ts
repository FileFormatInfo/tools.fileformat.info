import './style.css'
import { renderHeader } from './components/header.ts'

type RuneStats = {
  count: number
  first: number
  last: number
}

type CountRunesResult = {
  runeCounts: Map<number, RuneStats>
  decodeErrorCount: number
}

type CharsetKey = 'utf8' | 'utf16' | 'latin1'

const charsetToEncoding: Record<CharsetKey, string> = {
  utf8: 'utf-8',
  utf16: 'utf-16le',
  latin1: 'iso-8859-1',
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">Character Count</h1>
      <p class="mt-3 text-base-content/70">Choose a text file to start counting Unicode code points.</p>

      <form id="charcount-form" class="mt-6 flex flex-col gap-4" action="#" method="post">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input file</span>
          </div>
          <input id="input-file" type="file" name="inputFile" class="file-input file-input-bordered w-full" />
        </label>

        <label class="form-control w-full md:max-w-xs">
          <div class="label">
            <span class="label-text">Character set</span>
          </div>
          <select id="charset-select" name="charset" class="select select-bordered w-full">
            <option value="utf8" selected>UTF-8</option>
            <option value="utf16">UTF-16</option>
            <option value="latin1">Latin-1</option>
          </select>
        </label>

        <div id="form-error" class="alert alert-error hidden" role="alert" aria-live="polite"></div>
      </form>

      <section id="results" class="mt-8 hidden">
        <h2 class="text-xl font-semibold">Character Counts</h2>
        <p id="results-summary" class="mt-2 text-base-content/70"></p>

        <div class="mt-4 overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th class="text-center">Char</th>
                <th class="text-center">Code Point</th>
                <th class="text-right">Count</th>
                <th class="text-right">First</th>
                <th class="text-right">Last</th>
              </tr>
            </thead>
            <tbody id="results-body"></tbody>
          </table>
        </div>
      </section>
    </section>
  </section>
</main>
`

const fileInput = document.querySelector<HTMLInputElement>('#input-file')
const charsetSelect = document.querySelector<HTMLSelectElement>('#charset-select')
const formError = document.querySelector<HTMLDivElement>('#form-error')
const resultsSection = document.querySelector<HTMLElement>('#results')
const resultsSummary = document.querySelector<HTMLParagraphElement>('#results-summary')
const resultsBody = document.querySelector<HTMLTableSectionElement>('#results-body')
let errorTimeoutId: number | undefined

const hideError = () => {
  if (!formError) {
    return
  }

  formError.textContent = ''
  formError.classList.add('hidden')

  if (errorTimeoutId !== undefined) {
    window.clearTimeout(errorTimeoutId)
    errorTimeoutId = undefined
  }
}

const showError = (message: string) => {
  if (!formError) {
    return
  }

  formError.textContent = message
  formError.classList.remove('hidden')

  if (errorTimeoutId !== undefined) {
    window.clearTimeout(errorTimeoutId)
  }

  errorTimeoutId = window.setTimeout(() => {
    hideError()
  }, 5000)

  document.addEventListener('click', hideError, { once: true })
}

const isCharsetKey = (value: string): value is CharsetKey => value in charsetToEncoding

const countRunes = async (file: File, charset: CharsetKey): Promise<CountRunesResult> => {
  const runeCounts = new Map<number, RuneStats>()
  const fileBuffer = await file.arrayBuffer()
  const text = new TextDecoder(charsetToEncoding[charset]).decode(fileBuffer)
  let decodeErrorCount = 0

  let runeOffset = 0
  for (const character of text) {
    const codePoint = character.codePointAt(0)

    if (codePoint === undefined) {
      continue
    }

    if (codePoint === 0xfffd) {
      decodeErrorCount += 1
    }

    const existing = runeCounts.get(codePoint)

    if (existing) {
      existing.count += 1
      existing.last = runeOffset
      runeOffset += 1
      continue
    }

    runeCounts.set(codePoint, {
      count: 1,
      first: runeOffset,
      last: runeOffset,
    })

    runeOffset += 1
  }

  return { runeCounts, decodeErrorCount }
}

const formatOffsetHex = (offset: number): string => `0x${offset.toString(16).toUpperCase().padStart(4, '0')}`
const formatOffsetTitle = (offset: number): string => `${offset.toLocaleString()} (decimal)`
const formatCount = (count: number): string => count.toLocaleString()

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const toCharDisplay = (codePoint: number): string => {
  if (codePoint === 0x00ad) {
    return 'SOFT HYPHEN'
  }

  if (codePoint === 9) {
    return 'TAB'
  }

  if (codePoint === 10) {
    return 'LF'
  }

  if (codePoint === 13) {
    return 'CR'
  }

  if (codePoint === 32) {
    return 'SPACE'
  }

  return escapeHtml(String.fromCodePoint(codePoint))
}

const toCodePointDisplay = (codePoint: number): string => {
  const hex = codePoint.toString(16).toUpperCase().padStart(4, '0')

  return `U+${hex}`
}

const toCodePointUrl = (codePoint: number): string => {
  const hex = codePoint.toString(16).toUpperCase().padStart(4, '0')

  return `https://www.fileformat.info/info/unicode/char/${hex}/index.htm`
}

const renderRuneTable = (runeCounts: Map<number, RuneStats>, totalRunes: number, decodeErrorCount: number) => {
  if (!resultsBody || !resultsSummary || !resultsSection) {
    return
  }

  const rows = Array.from(runeCounts.entries())
    .sort(([left], [right]) => left - right)
    .map(
      ([codePoint, stats]) =>
        `<tr><td class="text-center">${toCharDisplay(codePoint)}</td><td class="text-center"><a class="link link-primary" href="${toCodePointUrl(codePoint)}" target="_blank" rel="noreferrer">${toCodePointDisplay(codePoint)}</a></td><td class="text-right">${formatCount(stats.count)}</td><td class="text-right" title="${formatOffsetTitle(stats.first)}">${formatOffsetHex(stats.first)}</td><td class="text-right" title="${formatOffsetTitle(stats.last)}">${formatOffsetHex(stats.last)}</td></tr>`,
    )

  resultsBody.innerHTML = rows.join('')
  const baseSummary = `${totalRunes.toLocaleString()} total code points, ${runeCounts.size} distinct values.`
  resultsSummary.innerHTML =
    decodeErrorCount > 0
      ? `${baseSummary} <span class="inline-flex items-center gap-1"><span aria-hidden="true">⚠️</span><span>${decodeErrorCount.toLocaleString()} decoding errors</span></span>`
      : baseSummary

  resultsSection.classList.remove('hidden')
}

const runCount = async () => {
  const selectedFile = fileInput?.files?.[0]
  const selectedCharset = charsetSelect?.value ?? 'utf8'

  if (!selectedFile) {
    resultsSection?.classList.add('hidden')
    return
  }

  if (!isCharsetKey(selectedCharset)) {
    showError('Please choose a supported character set.')
    return
  }

  hideError()

  if (fileInput) {
    fileInput.disabled = true
  }

  if (charsetSelect) {
    charsetSelect.disabled = true
  }

  try {
    const countResult = await countRunes(selectedFile, selectedCharset)
    const totalRunes = Array.from(countResult.runeCounts.values()).reduce((total, stats) => total + stats.count, 0)
    renderRuneTable(countResult.runeCounts, totalRunes, countResult.decodeErrorCount)
  } catch {
    showError('Unable to read the selected file.')
  } finally {
    if (fileInput) {
      fileInput.disabled = false
    }

    if (charsetSelect) {
      charsetSelect.disabled = false
    }
  }
}

fileInput?.addEventListener('change', () => {
  void runCount()
})

charsetSelect?.addEventListener('change', () => {
  void runCount()
})
