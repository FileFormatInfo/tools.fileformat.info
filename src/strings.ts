import './style.css'
import { renderHeader } from './components/header.ts'

type FoundString = {
  value: string
  offset: number
  length: number
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">Strings</h1>
      <p class="mt-3 text-base-content/70">Scan a file for human-readable strings.</p>

      <form id="strings-form" class="mt-6 flex flex-col gap-4" action="#" method="post">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input file</span>
          </div>
          <input id="input-file" type="file" name="inputFile" class="file-input file-input-bordered w-full" />
        </label>

        <label class="form-control w-full md:max-w-xs">
          <div class="label">
            <span class="label-text">Minimum length</span>
          </div>
          <input id="min-length" type="number" min="1" step="1" value="6" class="input input-bordered w-full" />
        </label>

        <label class="form-control w-full md:max-w-xs">
          <div class="label">
            <span class="label-text">Minimum contiguous letters</span>
          </div>
          <input id="min-contiguous-letters" type="number" min="1" step="1" value="3" class="input input-bordered w-full" />
        </label>

        <label class="form-control w-full md:max-w-xs">
          <div class="label">
            <span class="label-text">Minimum letters</span>
          </div>
          <input id="min-letters" type="number" min="1" step="1" value="4" class="input input-bordered w-full" />
        </label>

        <div id="form-error" class="alert alert-error hidden" role="alert" aria-live="polite"></div>

        <div>
          <button id="start-button" type="submit" class="btn btn-primary">Start</button>
        </div>
      </form>

      <section id="results" class="mt-8 hidden">
        <h2 class="text-xl font-semibold">Strings</h2>
        <p id="results-summary" class="mt-2 text-base-content/70"></p>

        <div class="mt-4 overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th class="text-right">Offset</th>
                <th class="text-right">Length</th>
                <th>String</th>
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

const form = document.querySelector<HTMLFormElement>('#strings-form')
const fileInput = document.querySelector<HTMLInputElement>('#input-file')
const minLengthInput = document.querySelector<HTMLInputElement>('#min-length')
const minContiguousLettersInput = document.querySelector<HTMLInputElement>('#min-contiguous-letters')
const minLettersInput = document.querySelector<HTMLInputElement>('#min-letters')
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

const byteToChar = (byte: number): string => {
  if (byte === 9) {
    return '\\t'
  }

  return String.fromCharCode(byte)
}

const isReadableByte = (byte: number): boolean => byte === 9 || (byte >= 32 && byte <= 126)

const isAsciiLetter = (character: string): boolean => /[A-Za-z]/.test(character)

const analyzeLetters = (value: string): { totalLetters: number; maxContiguousLetters: number } => {
  let totalLetters = 0
  let maxContiguousLetters = 0
  let currentRun = 0

  for (const character of value) {
    if (isAsciiLetter(character)) {
      totalLetters += 1
      currentRun += 1
      if (currentRun > maxContiguousLetters) {
        maxContiguousLetters = currentRun
      }
      continue
    }

    currentRun = 0
  }

  return { totalLetters, maxContiguousLetters }
}

const shouldIncludeString = (
  value: string,
  minLength: number,
  minContiguousLetters: number,
  minLetters: number,
): boolean => {
  if (value.length < minLength) {
    return false
  }

  const { totalLetters, maxContiguousLetters } = analyzeLetters(value)
  return totalLetters >= minLetters && maxContiguousLetters >= minContiguousLetters
}

const scanStrings = async (
  file: File,
  minLength: number,
  minContiguousLetters: number,
  minLetters: number,
): Promise<FoundString[]> => {
  const fileBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(fileBuffer)
  const found: FoundString[] = []

  let currentOffset = -1
  let current = ''

  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index]

    if (isReadableByte(byte)) {
      if (currentOffset === -1) {
        currentOffset = index
      }

      current += byteToChar(byte)
      continue
    }

    if (shouldIncludeString(current, minLength, minContiguousLetters, minLetters)) {
      found.push({
        value: current,
        offset: currentOffset,
        length: current.length,
      })
    }

    currentOffset = -1
    current = ''
  }

  if (shouldIncludeString(current, minLength, minContiguousLetters, minLetters)) {
    found.push({
      value: current,
      offset: currentOffset,
      length: current.length,
    })
  }

  return found
}

const renderResults = (strings: FoundString[]) => {
  if (!resultsBody || !resultsSummary || !resultsSection) {
    return
  }

  const rows = strings.map(
    (entry) =>
      `<tr><td class="text-right" title="${formatOffsetTitle(entry.offset)}">${formatOffsetHex(entry.offset)}</td><td class="text-right">${formatCount(entry.length)}</td><td>${escapeHtml(entry.value)}</td></tr>`,
  )

  resultsBody.innerHTML = rows.join('')
  resultsSummary.textContent = `${formatCount(strings.length)} strings found.`
  resultsSection.classList.remove('hidden')
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const selectedFile = fileInput?.files?.[0]
  const minLengthValue = Number(minLengthInput?.value ?? '6')
  const minContiguousLettersValue = Number(minContiguousLettersInput?.value ?? '3')
  const minLettersValue = Number(minLettersInput?.value ?? '4')

  if (!selectedFile) {
    if (resultsSection) {
      resultsSection.classList.add('hidden')
    }

    showError('Please choose a file before starting.')
    return
  }

  if (!Number.isInteger(minLengthValue) || minLengthValue < 1) {
    showError('Minimum length must be a whole number greater than or equal to 1.')
    return
  }

  if (!Number.isInteger(minContiguousLettersValue) || minContiguousLettersValue < 1) {
    showError('Minimum contiguous letters must be a whole number greater than or equal to 1.')
    return
  }

  if (!Number.isInteger(minLettersValue) || minLettersValue < 1) {
    showError('Minimum letters must be a whole number greater than or equal to 1.')
    return
  }

  hideError()

  if (startButton) {
    startButton.disabled = true
    startButton.textContent = 'Scanning...'
  }

  try {
    const strings = await scanStrings(selectedFile, minLengthValue, minContiguousLettersValue, minLettersValue)
    renderResults(strings)
  } catch {
    showError('Unable to read the selected file.')
  } finally {
    if (startButton) {
      startButton.disabled = false
      startButton.textContent = 'Start'
    }
  }
})
