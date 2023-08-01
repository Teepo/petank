import path from 'path';

import yargs from 'yargs';

import { defineConfig } from 'vite';

import vue      from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl';

import vuetify from 'vite-plugin-vuetify';

const argv = yargs(process.argv).argv;

const isHTTPS = argv.https;

const plugins = [
    vue(),
    vuetify({
        autoImport: true
    }),
];

if (isHTTPS) {
    plugins.push(basicSsl());
}

export default defineConfig({
    build: {
        assetsInlineLimit: 0,
    },
    plugins: plugins,
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