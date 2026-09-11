import { defineConfig } from 'vite';

export default defineConfig({
  // Base relativa para compatibilidad con subdirectorios
  base: './',

  // Middleware para servidor local de desarrollo (npm run dev)
  plugins: [
    {
      name: 'jedrar-dev-redirect',
      configureServer(server) {
        server.middlewares.use((req: any, res: any, next: any) => {
          const rawUrl = (req?.url || '').split('?')[0];

          // Si ya está exactamente en la URL destino con barra final, no hacer nada
          if (rawUrl === '/JedRar/') {
            return next();
          }

          // Si ingresan /jedrar, /jedrar/ o /JedRar (sin barra final), redirigir a /JedRar/
          const cleanPath = rawUrl.toLowerCase().replace(/\/+$/, '');
          if (cleanPath === '/jedrar') {
            res.writeHead(302, { Location: '/JedRar/' });
            res.end();
            return;
          }

          next();
        });
      },
    },
  ],

  // Declaración explícita de páginas para el empaquetador de producción
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        jedrar: './JedRar/index.html',
        privacy: './privacy.html',
      },
    },
  },
});
