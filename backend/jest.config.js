export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
    },
    moduleNameMapper: {},
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'modules/**/*.js',
        '!modules/**/node_modules/**',
    ],
};
