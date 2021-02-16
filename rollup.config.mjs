import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import shebang from 'rollup-plugin-add-shebang';
import commonjs from '@rollup/plugin-commonjs';

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
            shebang({ include: 'dist/binary.mjs' }),
        ],
    },
    {
        input: 'src/Library.ts',
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
