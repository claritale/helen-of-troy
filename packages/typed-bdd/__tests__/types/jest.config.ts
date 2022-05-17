import sharedConfig from '../../jest.config';

export default {
  ...sharedConfig,
  rootDir: '../../',
  testPathIgnorePatterns: ['./__tests__/unit/'],
  setupFilesAfterEnv: ['./__tests__/types/jest.setupTests.ts'],

  cache: false,
};
