module.exports = {
    automock: true,
    collectCoverageFrom: [
        'src/**/*.ts'
    ],
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.ts'
    ],
};
