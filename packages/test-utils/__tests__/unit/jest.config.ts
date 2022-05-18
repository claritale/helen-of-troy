import sharedConfig from '../../jest.config';

export default {
  ...sharedConfig,
  rootDir: '../../',
  testPathIgnorePatterns: ['./__tests__/types/'],
  setupFilesAfterEnv: ['./__tests__/unit/jest.setupTests.ts'],

  cache: true,
};
