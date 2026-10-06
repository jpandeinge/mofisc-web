module.exports = {
    extends: [
      'react-app',
      'react-app/jest',
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
      "varsIgnorePattern": "^_",
      "argsIgnorePattern": "^_"
    }]
    },
  };