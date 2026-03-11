import './style.css'
import { renderHeader } from './components/header.ts'

const demoSamples = [
  'French (Latin): René François Lacôte',
  'German (Latin): Blöße',
  'Vietnamese (Latin): Trần Hưng Đạo',
  'Norwegian (Latin): Nærøy',
  'Ancient Greek (Greek): Φειδιππίδης',
  'Modern Greek (Greek): Δημήτρης Φωτόπουλος',
  'Russian (Cyrillic): Борис Николаевич Ельцин',
  'Ukrainian (Cyrillic): Володимир Горбулін',
  'Bulgarian (Cyrillic): Търговище',
  'Mandarin Chinese (Han): 深圳',
  'Cantonese Chinese (Han): 深水埗',
  'Korean (Hangul): 화성시',
  'Korean (Han): 華城市',
  'Japanese (Hiragana): さいたま',
  'Japanese (Han): 埼玉県',
  'Amharic (Ethiopic): ደብረ ዘይት',
  'Tigrinya (Ethiopic): ደቀምሓረ',
  'Arabic: دمنهور',
  'Armenian: Աբովյան',
  'Georgian: სამტრედია',
  'Hebrew: אברהם הלוי פרנקל',
  'Unified English Braille (Braille): ⠠⠎⠁⠽⠀⠭⠀⠁⠛',
  'Bengali: ময়মনসিংহ',
  'Burmese (Myanmar): ထန်တလန်',
  'Gujarati: પોરબંદર',
  'Hindi (Devanagari): महासमुंद',
  'Kannada: ಬೆಂಗಳೂರು',
  'Khmer: សៀមរាប',
  'Lao: ສະຫວັນນະເຂດ',
  'Malayalam: കളമശ്ശേരി',
  'Odia: ଗଜପତି',
  'Punjabi (Gurmukhi): ਜਲੰਧਰ',
  'Sinhala: රත්නපුර',
  'Tamil: கன்னியாகுமரி',
  'Telugu: శ్రీకాకుళం',
  'Thai: สงขลา',
  'Emojis: 👑 🌴',
  'Misc.: ☆ ♯ ♰ ⚄ ⛌',
  'Letterlike: № ℳ ⅋ ⅍',
]

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-3xl font-bold">Asciify</h1>
        <button id="demo-button" type="button" class="btn btn-sm">Demo</button>
      </div>
      <p class="mt-3 text-base-content/70">Type text below to convert it to ASCII using <a href="https://github.com/anyascii/anyascii">AnyAscii</a>.</p>

      <form class="mt-6 flex flex-col gap-4" action="#" method="post" onsubmit="return false;">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Load from file</span>
          </div>
          <input id="input-file" type="file" class="file-input file-input-bordered w-full" />
        </label>

        <label class="form-control w-full">
          <div class="label w-full items-center">
            <span class="label-text">Input text</span>
            <button id="clear-button" type="button" class="btn btn-sm ml-auto">
              Clear
            </button>
          </div>
          <textarea id="input-text" class="textarea textarea-bordered min-h-40 w-full" placeholder="Paste or type text here"></textarea>
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">ASCII output</span>
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
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')
const inputFile = document.querySelector<HTMLInputElement>('#input-file')

type AnyAsciiFn = (value: string) => string
let anyAsciiPromise: Promise<AnyAsciiFn> | undefined

const loadAnyAscii = (): Promise<AnyAsciiFn> => {
  if (!anyAsciiPromise) {
    anyAsciiPromise = import('any-ascii').then((module) => module.default)
  }

  return anyAsciiPromise
}

const updateOutput = async () => {
  if (!inputText || !outputText) {
    return
  }

  const anyAscii = await loadAnyAscii()
  outputText.value = anyAscii(inputText.value)
}

inputText?.addEventListener('input', () => {
  void updateOutput()
})

inputFile?.addEventListener('change', async () => {
  if (!inputText) {
    return
  }

  const [file] = inputFile.files ?? []
  if (!file) {
    return
  }

  try {
    inputText.value = await file.text()
    inputText.focus()
    void updateOutput()
  } finally {
    inputFile.value = ''
  }
})

void updateOutput()
inputText?.focus()

demoButton?.addEventListener('click', () => {
  if (!inputText) {
    return
  }

  const randomIndex = Math.floor(Math.random() * demoSamples.length)
  inputText.value = demoSamples[randomIndex]
  void updateOutput()
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

clearButton?.addEventListener('click', () => {
  if (!inputText) {
    return
  }

  inputText.value = ''
  inputText.focus()
  void updateOutput()
})

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !inputText) {
    return
  }

  const activeElement = document.activeElement
  if (
    activeElement instanceof HTMLElement &&
    activeElement !== inputText &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable)
  ) {
    return
  }

  inputText.value = ''
  inputText.focus()
  void updateOutput()
})
