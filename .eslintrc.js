module.exports = {
  "parser": "babel-eslint",

  "plugins": [
    "flowtype"
  ],

  "extends": [
    "airbnb-base",
    "plugin:flowtype/recommended"
  ],

  "env": {
    "mocha": true,
    "node": true,
    "es6": true
  },

  "rules": {
    "comma-dangle": ["error", "never"],
    "no-console": "off"
  },
};
