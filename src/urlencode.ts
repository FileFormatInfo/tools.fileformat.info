import './style.css'
import { renderHeader } from './components/header.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <section class="rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
      <h1 class="text-3xl font-bold">URL Encode/Decode</h1>
      <p class="mt-3 text-base-content/70">Edit either side and the other updates automatically.</p>

      <form class="mt-6 flex flex-col gap-4" action="#" method="post" onsubmit="return false;">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Plain text</span>
          </div>
          <textarea id="plain-text" class="textarea textarea-bordered min-h-40 w-full" placeholder="Type plain text"></textarea>
        </label>

        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">URL-encoded text</span>
          </div>
          <textarea id="encoded-text" class="textarea textarea-bordered min-h-40 w-full" placeholder="Type URL-encoded text"></textarea>
        </label>
      </form>
    </section>
  </section>
</main>
`

const plainText = document.querySelector<HTMLTextAreaElement>('#plain-text')
const encodedText = document.querySelector<HTMLTextAreaElement>('#encoded-text')
let isSyncing = false

const syncFromPlain = () => {
  if (!plainText || !encodedText || isSyncing) {
    return
  }

  isSyncing = true
  encodedText.value = encodeURIComponent(plainText.value)
  isSyncing = false
}

const syncFromEncoded = () => {
  if (!plainText || !encodedText || isSyncing) {
    return
  }

  isSyncing = true

  try {
    plainText.value = decodeURIComponent(encodedText.value)
  } catch {
    plainText.value = encodedText.value
  }

  isSyncing = false
}

plainText?.addEventListener('input', syncFromPlain)
encodedText?.addEventListener('input', syncFromEncoded)
