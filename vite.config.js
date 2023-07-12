import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
    build: {
        assetsInlineLimit: 0,
    },
    plugins: [
        basicSsl()
    ]
});