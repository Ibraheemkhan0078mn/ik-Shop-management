export default {
    preset: undefined,
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {},
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'modules/**/*.js',
        '!modules/**/node_modules/**',
    ],
};
