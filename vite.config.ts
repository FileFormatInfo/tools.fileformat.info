import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        bytecount: resolve(__dirname, 'bytecount.html'),
        runecount: resolve(__dirname, 'runecount.html'),
        asciify: resolve(__dirname, 'asciify.html'),
        upsideDown: resolve(__dirname, 'upside-down.html'),
        urlencode: resolve(__dirname, 'urlencode.html'),
        strings: resolve(__dirname, 'strings.html'),
        haikunator: resolve(__dirname, 'haikunator.html'),
        hash: resolve(__dirname, 'hash.html'),
      },
    },
  },
})
