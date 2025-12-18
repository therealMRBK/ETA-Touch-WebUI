
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    host: true,
    hmr: false,
    allowedHosts: [
      'pellets.bravokilo.cloud',
      'pc.bravokilo.cloud'
    ]
  },
  plugins: [
    {
      name: 'remove-vite-client',
      transformIndexHtml(html) {
        // Entfernt das injizierte Vite-Client-Script, das für WebSockets verantwortlich ist
        return html.replace(/<script type="module" src="\/@vite\/client"><\/script>/g, '');
      }
    }
  ],
  optimizeDeps: {
    disabled: true
  }
});
