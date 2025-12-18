
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080,
    allowedHosts: [
      'pellets.bravokilo.cloud',
      'pc.bravokilo.cloud'
    ]
  }
});
