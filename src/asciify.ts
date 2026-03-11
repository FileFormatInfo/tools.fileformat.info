import './style.css'
import { renderHeader } from './components/header.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">Asciify</h1>
      <p class="mt-3 text-base-content/70">Type text below to convert it to ASCII in your browser.</p>

      <form class="mt-6 flex flex-col gap-4" action="#" method="post" onsubmit="return false;">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Input text</span>
          </div>
          <textarea id="input-text" class="textarea textarea-bordered min-h-40 w-full" placeholder="Paste or type text here"></textarea>
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">ASCII output</span>
          </div>
          <textarea id="output-text" class="textarea textarea-bordered min-h-40 w-full" readonly></textarea>
        </label>
      </form>
    </section>
  </section>
</main>
`

const inputText = document.querySelector<HTMLTextAreaElement>('#input-text')
const outputText = document.querySelector<HTMLTextAreaElement>('#output-text')

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
void updateOutput()
