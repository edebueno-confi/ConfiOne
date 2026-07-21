import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_'],
  server: {
    host: '127.0.0.1',
    port: 4173,
    allowedHosts: ['host.docker.internal', '127.0.0.1', 'localhost'],
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    allowedHosts: ['host.docker.internal', '127.0.0.1', 'localhost'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'analytics-vendor',
              test: /node_modules[\\/](recharts|d3-)/,
              minSize: 20 * 1024,
            },
            {
              name: 'editor-vendor',
              test: /node_modules[\\/](@tiptap|prosemirror)/,
              minSize: 20 * 1024,
            },
            {
              name: 'supabase-vendor',
              test: /node_modules[\\/]@supabase[\\/]/,
              minSize: 20 * 1024,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              minSize: 20 * 1024,
            },
          ],
        },
      },
    },
  },
});
