
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    host: true, // Erlaubt den Zugriff von außen (0.0.0.0)
    allowedHosts: [
      'pellets.bravokilo.cloud',
      'pc.bravokilo.cloud'
    ]
  }
});
