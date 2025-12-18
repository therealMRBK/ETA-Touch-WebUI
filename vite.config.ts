
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    host: true, // Erlaubt Zugriff von außen
    hmr: false, // Deaktiviert WebSockets für Hot Module Replacement komplett
    allowedHosts: [
      'pellets.bravokilo.cloud',
      'pc.bravokilo.cloud'
    ]
  }
});
