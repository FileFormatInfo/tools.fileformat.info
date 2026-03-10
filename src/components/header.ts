
export function renderHeader(): string {
  return `
<header class="navbar rounded-box border border-base-300 bg-base-100 px-4 shadow-sm">
  <div class="navbar-start">
    <a href="/" class="btn btn-ghost gap-2 text-lg normal-case">
      <img src="/favicon.svg" alt="FFTools Logo" class="h-6 w-6" />
      <span>Online File Format Tools</span>
    </a>
  </div>
  <div class="navbar-end flex gap-6">
    <a href="https://github.com/FileFormatInfo/tools.fileformat.info" class="">Source</a>
    <a href="https://andrew.marcuse.info/contact.html" class="">Contact</a>
  </div>
</header>
`
}
