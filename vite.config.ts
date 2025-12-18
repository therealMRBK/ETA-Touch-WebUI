
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    host: true, // Erlaubt Zugriff von außen (0.0.0.0)
    hmr: false, // Deaktiviert Hot Module Replacement (WebSockets)
    watch: {
      usePolling: true, // Nutzt Dateisystem-Polling statt Native Watcher (falls nötig)
    },
    allowedHosts: [
      'pellets.bravokilo.cloud',
      'pc.bravokilo.cloud'
    ]
  },
  // Verhindert, dass Vite versucht, WebSocket-Code in den Client zu injizieren
  optimizeDeps: {
    disabled: true
  },
  build: {
    // Falls wir eine Production-Build machen, stellen wir sicher, dass kein Socket-Code enthalten ist
    commonjsOptions: {
      include: []
    }
  }
});
