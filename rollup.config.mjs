import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import shebang from 'rollup-plugin-add-shebang';
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        input: 'src/cli.ts',
        output: {
            file: './dist/igniter.cli.mjs',
        },
        plugins: [
            typescript(),
            nodeResolve(),
            commonjs(),
            shebang({ include: 'dist/igniter.cli.mjs' }),
        ],
    },
    {
        input: 'src/library.ts',
        output: {
            file: './dist/library.mjs',
        },
        plugins: [
            typescript(),
            nodeResolve(),
            commonjs(),
        ],
    },
];
