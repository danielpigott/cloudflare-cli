module.exports = {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/test/**/*.js'],
    reporters: [
    'default',
    ['jest-junit', {outputDirectory: 'junit', outputName: 'report.xml'}],
  ],
};
