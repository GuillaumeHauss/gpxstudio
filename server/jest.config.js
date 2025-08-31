module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/routes/**/*.test.js'],
  verbose: true,
  forceExit: true, // This can help with issues where tests hang
};
