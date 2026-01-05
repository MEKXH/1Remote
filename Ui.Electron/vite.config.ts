import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import ui from '@nuxt/ui/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ui({
      router: false
    }),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['electron', 'path', 'url', 'fs'],
              output: {
                format: 'esm',
                entryFileNames: '[name].js',
              }
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload()
        },
        vite: {
          build: {
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].js',
              }
            }
          }
        }
      },
    ]),
    renderer(),
  ],
})
