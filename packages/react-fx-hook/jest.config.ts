/* eslint-disable */
export default {
  displayName: 'react-fx-hook',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/react-fx-hook',
  setupFilesAfterEnv: ['./jest.setupTests.ts'],
};
