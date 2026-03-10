import './style.css'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.ts'
import { renderHeader } from './components/header.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <div class="hero rounded-box border border-base-300 bg-base-100 shadow-sm">
      <div class="hero-content flex-col py-10 text-center">
        <div class="avatar">
          <div class="w-24 rounded-2xl bg-base-200 p-2">
            <img src="${heroImg}" alt="Starter illustration" />
          </div>
        </div>
        <div class="flex items-center justify-center gap-3">
          <img src="${typescriptLogo}" alt="TypeScript logo" class="h-8 w-8" />
          <img src="${viteLogo}" alt="Vite logo" class="h-8 w-8" />
        </div>
        <div>
          <h1 class="text-4xl font-bold">Get started</h1>
          <p class="mt-2 text-base-content/75">Edit <code class="rounded bg-base-200 px-2 py-1">src/main.ts</code> and save to test <code class="rounded bg-base-200 px-2 py-1">HMR</code></p>
        </div>
        <a href="/bytecount.html" class="btn btn-outline btn-secondary">Open Bytecount</a>
        <a href="/runecount.html" class="btn btn-outline">Open Runecount</a>
        <button id="counter" type="button" class="btn btn-primary"></button>
      </div>
    </div>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Documentation</h2>
          <p class="text-base-content/70">Your questions, answered</p>
          <div class="card-actions mt-2">
            <a href="https://vite.dev/" target="_blank" rel="noreferrer" class="btn btn-outline btn-sm">
              <img src="${viteLogo}" alt="" class="h-4 w-4" />
              Explore Vite
            </a>
            <a href="https://www.typescriptlang.org" target="_blank" rel="noreferrer" class="btn btn-outline btn-sm">
              <img src="${typescriptLogo}" alt="" class="h-4 w-4" />
              Learn more
            </a>
          </div>
        </div>
      </article>

      <article class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Connect with us</h2>
          <p class="text-base-content/70">Join the Vite community</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer" class="btn btn-sm">GitHub</a>
            <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer" class="btn btn-sm">Discord</a>
            <a href="https://x.com/vite_js" target="_blank" rel="noreferrer" class="btn btn-sm">X.com</a>
            <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noreferrer" class="btn btn-sm">Bluesky</a>
          </div>
        </div>
      </article>
    </section>
  </section>
</main>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
