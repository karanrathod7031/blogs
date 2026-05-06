import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Load Firebase config from JSON if it exists (for AI Studio/Local Dev)
  let firebaseEnv = {};
  const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      const fbConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
      firebaseEnv = {
        'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(fbConfig.apiKey),
        'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(fbConfig.authDomain),
        'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(fbConfig.projectId),
        'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(fbConfig.storageBucket),
        'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(fbConfig.messagingSenderId),
        'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(fbConfig.appId),
        'import.meta.env.VITE_FIREBASE_DATABASE_ID': JSON.stringify(fbConfig.firestoreDatabaseId),
      };
    } catch (e) {
      console.warn('Failed to load firebase-applet-config.json', e);
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    base: '/',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      ...firebaseEnv,
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd()),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('/firebase/')) return 'firebase';
            if (id.includes('/@tiptap/') || id.includes('/prosemirror-') || id.includes('/tiptap-markdown')) return 'editor';
            if (id.includes('/react-markdown/') || id.includes('/remark-') || id.includes('/rehype-') || id.includes('/unified/') || id.includes('/micromark/')) return 'markdown';
            if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts';
            if (id.includes('/@google/genai/')) return 'ai';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
