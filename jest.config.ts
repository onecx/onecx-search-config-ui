/* eslint-disable */
export default {
  displayName: 'onecx-search-config',
  preset: './jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: './reports/coverage/',
  coveragePathIgnorePatterns: ['src/app/shared/generated'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@ngrx|(?!deck.gl)|d3-scale|(?!.*.mjs$))',
  ],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*(*.)@(spec|test).[jt]s?(x)',
  ],
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: './reports/',
        outputName: 'sonarqube_report.xml',
        reportedFilePath: 'absolute',
      },
    ],
  ],
};
