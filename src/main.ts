import './style.css'
import { setupCounter } from './counter.ts'
import { renderHeader } from './components/header.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="min-h-screen bg-base-200" data-theme="light">
  <section class="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
    ${renderHeader()}

    <div class="hero rounded-box border border-base-300 bg-base-100 shadow-sm">
      <div class="hero-content flex-col py-10 w-full items-start">
        <div class="flex flex-row items-center">
          <a href="/asciify.html" class="btn btn-primary">Asciify</a>
          <div class="ps-2">convert text to plain ASCII</div>
        </div>
        <div class="flex flex-row items-center">
          <a href="/bytecount.html" class="btn btn-primary">Byte Count</a>
          <div class="ps-2">count which bytes are in a file</div>
        </div>
        <div class="flex flex-row items-center">
          <a href="/runecount.html" class="btn btn-primary">Rune Count</a>
          <div class="ps-2">count which characters are in a file</div>
        </div>
        <div class="flex flex-row items-center">
          <a href="/upside-down.html" class="btn btn-primary">Upside Down</a>
          <div class="ps-2">flip text upside down</div>
        </div>
        <div class="flex flex-row items-center">
          <a href="/urlencode.html" class="btn btn-primary">URL Encode</a>
          <div class="ps-2">encode and decode URL-escaped text</div>
        </div>
      </div>
    </div>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Command line</h2>
          <p class="text-base-content/70">Need to run locally or in CI?  Try the command line versions!</p>
          <div class="card-actions mt-2">
            <a href="https://github.com/FileFormatInfo/fftools?tab=readme-ov-file#programs" class="btn btn-sm">
              Documentation
            </a>
            <a href="https://github.com/FileFormatInfo/fftools/releases/latest" class="btn btn-sm">
              Downloads
            </a>
          </div>
        </div>
      </article>

      <article class="card border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">More useful stuff</h2>
          <p class="text-base-content/70">Other things I've made</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <a href="https://www.fileformat.info/" class="btn btn-sm">File Formats</a>
            <a href="https://resolve.rs/" class="btn btn-sm">Networking</a>
            <a href="https://www.regexplanet.com/" class="btn btn-sm">Regex</a>
            <a href="https://www.vectorlogo.zone/" class="btn btn-sm">Logos</a>
          </div>
        </div>
      </article>
    </section>
  </section>
</main>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
