import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Daily Money Journal',
          short_name: 'MoneyJournal',
          description: 'Track daily finances, income, expenses, and notes with instant offline support.',
          theme_color: '#111827',
          background_color: '#f3f5f9',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: false,
        },
      }),
      {
        name: 'pwa-static-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const cleanUrl = req.url?.split('?')[0] || '';
            if (cleanUrl === '/manifest.json' || cleanUrl === '/manifest.webmanifest') {
              const manifestFile = path.resolve(__dirname, 'public/manifest.json');
              if (fs.existsSync(manifestFile)) {
                res.writeHead(200, {
                  'Content-Type': 'application/manifest+json; charset=utf-8',
                  'Cache-Control': 'no-cache',
                });
                fs.createReadStream(manifestFile).pipe(res);
                return;
              }
            }

            if (cleanUrl === '/sw.js') {
              const swFile = path.resolve(__dirname, 'public/sw.js');
              if (fs.existsSync(swFile)) {
                res.writeHead(200, {
                  'Content-Type': 'application/javascript; charset=utf-8',
                  'Service-Worker-Allowed': '/',
                  'Cache-Control': 'no-cache',
                });
                fs.createReadStream(swFile).pipe(res);
                return;
              }
            }

            if (cleanUrl.endsWith('.apk')) {
              const apkFile = path.resolve(__dirname, 'public/assets/daily-money-journal-v2.4.0.apk');
              if (fs.existsSync(apkFile)) {
                const stat = fs.statSync(apkFile);
                res.writeHead(200, {
                  'Content-Type': 'application/vnd.android.package-archive',
                  'Content-Disposition': 'attachment; filename="daily-money-journal.apk"',
                  'Content-Length': stat.size,
                  'Cache-Control': 'no-cache',
                });
                fs.createReadStream(apkFile).pipe(res);
                return;
              }
            }
            next();
          });

          if (!server.ws) {
            // Provide a safe fallback mock if server.ws is undefined (e.g. when HMR is disabled)
            server.ws = {
              send: () => {},
              close: () => {},
              on: () => {},
              off: () => {},
              clients: new Set(),
            } as any;
          } else if (typeof server.ws.send !== 'function') {
            server.ws.send = () => {};
          }
        },
      },
      {
        name: 'vite-client-send-guard',
        transform(code, id) {
          if (id.includes('vite/dist/client') || id.includes('/@vite/client')) {
            return code
              .replace(/ws\.send\(/g, 'ws?.send?.(')
              .replace(/this\.transport\.send\(/g, 'this.transport?.send?.(');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
    },
  };
});
