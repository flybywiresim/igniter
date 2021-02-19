import { nodeResolve } from '@rollup/plugin-node-resolve';
import shebang from 'rollup-plugin-add-shebang';
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@wessberg/rollup-plugin-ts";
import json from '@rollup/plugin-json';

export default [
    {
        input: 'src/Binary.ts',
        output: {
            file: './dist/binary.mjs',
        },
        plugins: [
            typescript(),
            nodeResolve(),
            commonjs(),
            json(),
            shebang({ include: 'dist/binary.mjs' }),
        ],
    },
    {
        input: 'src/Library/Index.ts',
        output: {
            file: './dist/index.mjs',
        },
        plugins: [
            typescript(),
            nodeResolve(),
            commonjs(),
        ],
    },
];
