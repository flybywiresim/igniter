module.exports = {
    root: true,
    extends: ['airbnb-typescript/base'],
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        'quotes': ['error', 'single'],
        'no-restricted-syntax': ['off'],
        '@typescript-eslint/indent': ['error', 4],

        'import/no-extraneous-dependencies': ['error', {
            devDependencies: true,
        }],

        '@typescript-eslint/naming-convention': ['error', {
            selector: 'variableLike',
            format: ['camelCase'],
        }],

        'max-len': ['error', {
            code: 128,
            ignoreUrls: true,
            ignoreTrailingComments: true,
        }],

        'implicit-arrow-linebreak': ['off'],
    }
};
