module.exports = {
  watchman: false,
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/scripts/jest-polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(svg|png|jpe?g|gif|webp|ico)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};
