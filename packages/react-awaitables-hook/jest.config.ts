/* eslint-disable */
export default {
  displayName: 'react-awaitables-hook',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/react-awaitables-hook',
  setupFilesAfterEnv: ['./jest.setupTests.ts'],
};
