import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

function offlineBundle(): Plugin {
  return {
    name: 'market-rental-offline-bundle',
    apply: 'build',
    closeBundle() {
      const dist = join(process.cwd(), 'dist')
      const files: string[] = []
      function walk(folder: string) {
        for (const e of readdirSync(folder, { withFileTypes: true })) {
          const path = join(folder, e.name)
          if (e.isDirectory()) walk(path)
          else if (e.name !== 'sw.js') files.push('/' + relative(dist, path).split('\\').join('/'))
        }
      }
      walk(dist)
      const cacheName = 'market-rental-offline-' + Date.now()
      const js = `const CACHE=${JSON.stringify(cacheName)};
` +
        `const ASSETS=${JSON.stringify(Array.from(new Set(['/', '/index.html', ...files])))};
` +
        `self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(ASSETS.map(url=>cache.add(url)));await self.skipWaiting()})())});
` +
        `self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('market-rental-offline-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
` +
        `self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;if(req.mode==='navigate'){event.respondWith((async()=>{try{const res=await fetch(req);if(res.ok)(await caches.open(CACHE)).put('/index.html',res.clone());return res}catch{return await caches.match('/index.html')||Response.error()}})());return;}event.respondWith((async()=>{const cached=await caches.match(req);if(cached)return cached;try{const res=await fetch(req);if(res.ok)(await caches.open(CACHE)).put(req,res.clone());return res}catch{return Response.error()}})())})`;
      writeFileSync(join(dist,'sw.js'), js)
    },
  }
}

export default defineConfig({
  plugins: [react(), offlineBundle()],
  server: {proxy: {'/api/client-access': {target:'http://localhost:3001',changeOrigin:true}}},
  build: { target: 'es2018', cssMinify: true, sourcemap: false },
})
