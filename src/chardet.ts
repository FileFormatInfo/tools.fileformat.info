import './style.css'
import { renderHeader } from './components/header.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">Character Set Detection</h1>
      <p class="mt-3 text-base-content/70">Choose a file to estimate character encoding.</p>

      <form class="mt-6 flex flex-col gap-4" action="#" method="post" onsubmit="return false;">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input file</span>
          </div>
          <input id="input-file" type="file" name="inputFile" class="file-input file-input-bordered w-full" />
        </label>

        <div id="form-error" class="alert alert-error hidden" role="alert" aria-live="polite"></div>
      </form>

      <section id="results" class="mt-8 hidden">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold">Detection Results</h2>
          <button id="clear-results-button" type="button" class="btn btn-sm ml-auto">Clear</button>
        </div>
        <p id="results-summary" class="mt-2 text-base-content/70"></p>

        <div class="mt-4 overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Library</th>
                <th>Encoding</th>
                <th class="text-right">Confidence</th>
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

type DetectionResult = {
  library: string
  encoding: string
  confidence?: number
}

const fileInput = document.querySelector<HTMLInputElement>('#input-file')
const formError = document.querySelector<HTMLDivElement>('#form-error')
const resultsSection = document.querySelector<HTMLElement>('#results')
const resultsSummary = document.querySelector<HTMLParagraphElement>('#results-summary')
const resultsBody = document.querySelector<HTMLTableSectionElement>('#results-body')
const clearResultsButton = document.querySelector<HTMLButtonElement>('#clear-results-button')
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

const formatConfidence = (confidence?: number): string => {
  if (confidence === undefined || Number.isNaN(confidence)) {
    return '—'
  }

  const normalized = confidence <= 1 ? confidence * 100 : confidence
  return `${Math.round(normalized)}%`
}

const hasHighBytes = (bytes: Uint8Array): boolean => bytes.some((byte) => byte > 0x7f)

const detectWithJschardet = async (bytes: Uint8Array): Promise<DetectionResult[]> => {
  const { default: jschardet } = await import('jschardet')

  const maxSampleBytes = 100_000
  const sample = bytes.slice(0, maxSampleBytes)
  const sampleText = new TextDecoder('latin1').decode(sample)

  const allDetections = jschardet
    .detectAll(sampleText, { minimumThreshold: 0 })
    .filter((entry) => Boolean(entry.encoding))
    .map((entry) => ({
      library: 'jschardet',
      encoding: entry.encoding,
      confidence: entry.confidence ?? 0,
    }))

  if (allDetections.length === 0) {
    return []
  }

  if (!hasHighBytes(bytes)) {
    return allDetections
  }

  const nonAsciiFirst = allDetections.find((entry) => entry.encoding.toUpperCase() !== 'ASCII')
  if (!nonAsciiFirst) {
    return allDetections
  }

  const remaining = allDetections.filter((entry) => entry !== nonAsciiFirst)
  return [nonAsciiFirst, ...remaining]
}

const detectWithEncodingJs = async (bytes: Uint8Array): Promise<DetectionResult[]> => {
  const { default: encodingJs } = await import('encoding-japanese')

  const maxSampleBytes = 100_000
  const sample = Array.from(bytes.slice(0, maxSampleBytes))
  const detected = encodingJs.detect(sample, ['UTF8', 'UTF16', 'UTF32', 'SJIS', 'EUCJP', 'JIS', 'ASCII', 'BINARY'])

  if (!detected) {
    return []
  }

  return [
    {
      library: 'encoding.js',
      encoding: detected,
    },
  ]
}

const detectWithChardet = async (bytes: Uint8Array): Promise<DetectionResult[]> => {
  const { analyse, detect } = await import('chardet')

  const maxSampleBytes = 100_000
  const sample = bytes.slice(0, maxSampleBytes)
  const analysed = analyse(sample).slice(0, 5)

  if (analysed.length > 0) {
    return analysed.map((entry) => ({
      library: 'chardet',
      encoding: entry.name,
      confidence: entry.confidence,
    }))
  }

  const primary = detect(sample)
  if (!primary) {
    return []
  }

  return [
    {
      library: 'chardet',
      encoding: primary,
    },
  ]
}

const renderResults = (results: DetectionResult[], fileSize: number) => {
  if (!resultsSection || !resultsSummary || !resultsBody) {
    return
  }

  resultsBody.innerHTML = results.length
    ? results
        .slice(0, 30)
        .map(
          (result) =>
            `<tr><td>${result.library}</td><td>${result.encoding}</td><td class="text-right">${formatConfidence(result.confidence)}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="3">No result</td></tr>'

  resultsSummary.textContent = `${fileSize.toLocaleString()} bytes analyzed.`
  resultsSection.classList.remove('hidden')
}

clearResultsButton?.addEventListener('click', () => {
  if (resultsBody) {
    resultsBody.innerHTML = ''
  }

  if (resultsSummary) {
    resultsSummary.textContent = ''
  }

  resultsSection?.classList.add('hidden')
})

fileInput?.addEventListener('change', async () => {
  const selectedFile = fileInput.files?.[0]

  if (!selectedFile) {
    resultsSection?.classList.add('hidden')
    showError('Please choose a file before starting.')
    return
  }

  hideError()

  if (fileInput) {
    fileInput.disabled = true
  }

  try {
    const bytes = new Uint8Array(await selectedFile.arrayBuffer())
    const [jschardetResults, encodingJsResults, chardetResults] = await Promise.all([
      detectWithJschardet(bytes),
      detectWithEncodingJs(bytes),
      detectWithChardet(bytes),
    ])

    const combinedResults = [...jschardetResults, ...encodingJsResults, ...chardetResults]

    if (combinedResults.length === 0) {
      showError('Unable to detect encoding for the selected file.')
      resultsSection?.classList.add('hidden')
      return
    }

    renderResults(combinedResults, selectedFile.size)
  } catch {
    showError('Unable to read the selected file.')
  } finally {
    if (fileInput) {
      fileInput.disabled = false
      fileInput.value = ''
    }
  }
})
