module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parserOptions: {
      ecmaVersion: 6,
      project: "./tsconfig.json",
      sourceType: "module"
    }
  }