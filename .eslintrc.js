module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    ecmaVersion: 6,
    project: "./tsconfig.json",
    sourceType: "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "rules": {
    "eqeqeq": "off",
    "curly": "error",
    "quotes": ["error", "single", "avoid-escape"]
  }
}
