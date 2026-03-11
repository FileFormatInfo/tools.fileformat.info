import './style.css'
import Haikunator from 'haikunator'
import { renderHeader } from './components/header.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">Haikunator</h1>
      <p class="mt-3 text-base-content/70">Generate Heroku-style random names with live options.</p>

      <form class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" action="#" method="post" onsubmit="return false;">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Delimiter</span>
          </div>
          <input id="delimiter" type="text" value="-" class="input input-bordered w-full" />
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Token length</span>
          </div>
          <input id="token-length" type="number" min="0" step="1" value="4" class="input input-bordered w-full" />
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Token characters</span>
          </div>
          <input id="token-chars" type="text" value="0123456789" class="input input-bordered w-full" />
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Number of names</span>
          </div>
          <input id="name-count" type="number" min="1" step="1" value="10" class="input input-bordered w-full" />
        </label>

        <label class="form-control w-full md:col-span-2">
          <div class="label">
            <span class="label-text">Generated names</span>
          </div>
          <div id="output-list" class="w-full rounded-box border border-base-300 bg-base-200 p-3"></div>
        </label>

        <div class="md:col-span-2">
          <button id="copy-all-button" type="button" class="btn btn-sm">Copy all to clipboard</button>
        </div>
      </form>
    </section>
  </section>
</main>
`

const delimiterInput = document.querySelector<HTMLInputElement>('#delimiter')
const tokenLengthInput = document.querySelector<HTMLInputElement>('#token-length')
const tokenCharsInput = document.querySelector<HTMLInputElement>('#token-chars')
const nameCountInput = document.querySelector<HTMLInputElement>('#name-count')
const outputList = document.querySelector<HTMLDivElement>('#output-list')
const copyAllButton = document.querySelector<HTMLButtonElement>('#copy-all-button')
let generatedNames: string[] = []

const copyIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path><path d="M16 4h2a2 2 0 0 1 2 2v4"></path><path d="M21 14H11"></path><path d="m15 10-4 4 4 4"></path></svg>'

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const clampInteger = (value: number, min: number): number => {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.max(min, Math.floor(value))
}

const renderNames = () => {
  if (!outputList) {
    return
  }

  outputList.innerHTML = generatedNames
    .map(
      (name, index) =>
        `<div class="mb-2 flex items-center gap-2 last:mb-0"><button type="button" class="btn btn-xs" data-copy-index="${index}" title="Copy name" aria-label="Copy ${escapeHtml(name)}"><span class="block h-4 w-4">${copyIconSvg}</span></button><span class="font-mono">${escapeHtml(name)}</span></div>`,
    )
    .join('')
}

const generateNames = () => {
  if (!delimiterInput || !tokenLengthInput || !tokenCharsInput || !nameCountInput) {
    return
  }

  const delimiter = delimiterInput.value
  const tokenLength = clampInteger(Number(tokenLengthInput.value), 0)
  const nameCount = clampInteger(Number(nameCountInput.value), 1)
  const tokenChars = tokenCharsInput.value || '0123456789'

  const haikunator = new Haikunator()
  const names: string[] = []

  for (let index = 0; index < nameCount; index += 1) {
    names.push(
      haikunator.haikunate({
        delimiter,
        tokenLength,
        tokenChars,
      }),
    )
  }

  generatedNames = names
  renderNames()
}

const inputs = [delimiterInput, tokenLengthInput, tokenCharsInput, nameCountInput]
for (const input of inputs) {
  input?.addEventListener('input', generateNames)
}

outputList?.addEventListener('click', async (event) => {
  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  const button = target.closest<HTMLButtonElement>('button[data-copy-index]')
  if (!button) {
    return
  }

  const index = Number(button.dataset.copyIndex)
  const value = generatedNames[index]

  if (!value) {
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    button.textContent = '✅'
  } catch {
    button.textContent = '❌'
  }

  window.setTimeout(() => {
    button.innerHTML = `<span class="block h-4 w-4">${copyIconSvg}</span>`
  }, 1000)
})

copyAllButton?.addEventListener('click', async () => {
  if (generatedNames.length === 0) {
    return
  }

  try {
    await navigator.clipboard.writeText(generatedNames.join('\n'))
    copyAllButton.textContent = 'Copied!'
  } catch {
    copyAllButton.textContent = 'Copy failed'
  }

  window.setTimeout(() => {
    copyAllButton.textContent = 'Copy all to clipboard'
  }, 1500)
})

generateNames()
