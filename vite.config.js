import path from 'path';

import { defineConfig } from 'vite';

import vue      from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl';

import vuetify from 'vite-plugin-vuetify'

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
        alias: {
            '~noty': path.resolve(__dirname, 'node_modules/noty'),
        },
        extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
            '.vue',
            '.scss',
        ],
    },
});