import { defineConfig } from 'vite';

import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl';

import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
    build: {
        assetsInlineLimit: 0,
    },
    plugins: [
        basicSsl(),
        vue(),
        vuetify({
            autoImport: true
        }),
    ],
    resolve: {
        extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
            '.vue',
        ],
    },
});