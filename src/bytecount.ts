import './style.css'
import { renderHeader } from './components/header.ts'

type ByteStats = {
  count: number
  first: number
  last: number
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">Byte Count</h1>
      <p class="mt-3 text-base-content/70">Choose a file and start counting bytes.</p>

      <form id="bytecount-form" class="mt-6 flex flex-col gap-4" action="#" method="post">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input file</span>
          </div>
          <input id="input-file" type="file" name="inputFile" class="file-input file-input-bordered w-full" />
        </label>

        <div id="form-error" class="alert alert-error hidden" role="alert" aria-live="polite"></div>

        <div>
          <button id="start-button" type="submit" class="btn btn-primary">Start</button>
        </div>
      </form>

      <section id="results" class="mt-8 hidden">
        <h2 class="text-xl font-semibold">Byte Counts</h2>
        <p id="results-summary" class="mt-2 text-base-content/70"></p>

        <div class="mt-4 overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th class="text-center">ASCII</th>
                <th class="text-center">Decimal</th>
                <th class="text-center">Hex</th>
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

const form = document.querySelector<HTMLFormElement>('#bytecount-form')
const fileInput = document.querySelector<HTMLInputElement>('#input-file')
const formError = document.querySelector<HTMLDivElement>('#form-error')
const startButton = document.querySelector<HTMLButtonElement>('#start-button')
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

const countFileBytes = async (file: File): Promise<Map<number, ByteStats>> => {
  const byteCounts = new Map<number, ByteStats>()
  const fileBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(fileBuffer)

  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index]
    const existing = byteCounts.get(byte)

    if (existing) {
      existing.count += 1
      existing.last = index
      continue
    }

    byteCounts.set(byte, {
      count: 1,
      first: index,
      last: index,
    })
  }

  return byteCounts
}

const toAsciiDisplay = (byte: number): string => {
  if (byte === 9) {
    return 'TAB'
  }

  if (byte === 10) {
    return 'LF'
  }

  if (byte === 13) {
    return 'CR'
  }

  if (byte === 32) {
    return 'SPACE'
  }

  if (byte < 33 || byte > 126) {
    return ''
  }

  const value = String.fromCharCode(byte)

  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

  const formatOffsetHex = (offset: number): string => `0x${offset.toString(16).toUpperCase().padStart(4, '0')}`
  const formatByteHex = (byte: number): string => `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`

  const formatOffsetTitle = (offset: number): string => `${offset.toLocaleString()} (decimal)`

  const formatCount = (count: number): string => count.toLocaleString()

const renderByteCountTable = (byteCounts: Map<number, ByteStats>, totalBytes: number) => {
  if (!resultsBody || !resultsSummary || !resultsSection) {
    return
  }

  const rows = Array.from(byteCounts.entries())
    .sort(([left], [right]) => left - right)
    .map(
      ([byte, stats]) =>
        `<tr><td class="text-center">${toAsciiDisplay(byte)}</td><td class="text-center">${byte}</td><td class="text-center">${formatByteHex(byte)}</td><td class="text-right">${formatCount(stats.count)}</td><td class="text-right" title="${formatOffsetTitle(stats.first)}">${formatOffsetHex(stats.first)}</td><td class="text-right" title="${formatOffsetTitle(stats.last)}">${formatOffsetHex(stats.last)}</td></tr>`,
    )

  resultsBody.innerHTML = rows.join('')
  resultsSummary.textContent = `${totalBytes.toLocaleString()} total bytes, ${byteCounts.size} distinct values.`
  resultsSection.classList.remove('hidden')
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const selectedFile = fileInput?.files?.[0]

  if (!selectedFile) {
    if (resultsSection) {
      resultsSection.classList.add('hidden')
    }

    showError('Please choose a file before starting.')

    return
  }

  hideError()

  if (startButton) {
    startButton.disabled = true
    startButton.textContent = 'Counting...'
  }

  try {
    const byteCounts = await countFileBytes(selectedFile)
    renderByteCountTable(byteCounts, selectedFile.size)
  } catch {
    showError('Unable to read the selected file.')
  } finally {
    if (startButton) {
      startButton.disabled = false
      startButton.textContent = 'Start'
    }
  }
})
