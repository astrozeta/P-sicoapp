import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // CRUCIAL: Esto arregla la pantalla en blanco en GitHub Pages
  build: {
    outDir: 'dist',
  },
});