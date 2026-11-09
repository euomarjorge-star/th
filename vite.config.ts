import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/*
 * Build do PAINEL (/admin) — e SÓ dele.
 *
 * O funil é um bundle pronto que vive em `assets/` e NÃO passa por aqui; o
 * `index.html` da raiz é dele. Por isso a entrada deste build é `admin.html`:
 * apontar o Vite para a raiz faria ele tentar reprocessar o funil inteiro.
 *
 * A saída vai para `dist/`, que o server.js serve em `/admin`. Chama-se
 * `dist` (e não `admin-dist`) porque o Vercel, sem framework declarado,
 * sempre procura por esse nome como Output Directory — e as configurações
 * manuais do dashboard do projeto insistiam em sobrescrever qualquer outro
 * valor vindo do vercel.json.
 * Em produção (Netlify/Vercel) o mesmo diretório é publicado nessa rota.
 *
 * A tela chama `/api/admin/...` na MESMA origem — sem CORS, sem
 * VITE_API_BASE_URL para configurar.
 */
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'admin.html'),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT ?? 3000}`,
        changeOrigin: true,
      },
    },
  },
});
