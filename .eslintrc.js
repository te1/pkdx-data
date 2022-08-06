module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],

  plugins: ['@typescript-eslint', 'prettier'],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: '2022',
    sourceType: 'module',
  },

  env: {
    node: true,
    es2022: true,
  },
};
