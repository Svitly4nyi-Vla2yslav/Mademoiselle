import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
const hasShare=existsSync(new URL('./public/brand/share.jpg',import.meta.url));
export default defineConfig({ plugins: [react(),{name:'approved-brand-assets',transformIndexHtml(html){if(!hasShare)return html;return html.replaceAll('/media/interior/desktop/poster.webp','/brand/share.jpg').replace('</head>','<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><link rel="apple-touch-icon" href="/brand/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="/brand/icon-32.png"><link rel="icon" type="image/png" sizes="16x16" href="/brand/icon-16.png"></head>');}}], base: '/' });
