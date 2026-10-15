import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

// Gera um único dist/index.html com JS e CSS embutidos.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { chunkSizeWarningLimit: 4000 },
})
