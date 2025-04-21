import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import json from "@eslint/json";
import html from "@html-eslint/eslint-plugin";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import jest from "eslint-plugin-jest";
import nodePlugin from "eslint-plugin-n";

const variableGlobalesBrowser = {'jQuery': true, '$': true, }

export default defineConfig([
  {
    ignores: ["coverage/", "reports/", "public/vendor/", "eslint.config.mjs", ".*/"],
  },
  { // Jest
    files: ["**/*.spec.js", "**/*.test.js"],
    plugins: { jest },
    languageOptions: {
      globals: {
        ...jest.environments.globals.globals,
        ...globals.browser,
        ...globals.node
      },
      sourceType: "commonjs"
    },
    rules: {
      "jest/no-hooks": "off",
      "jest/prefer-lowercase-title": "off",
    },
  },
  { // NodeJS
    files: ["**/*.{js,mjs,cjs}"],
    // ignores: ["public/javascripts/**/*.js"],
    plugins: { js, n: nodePlugin },
    extends: ["js/recommended", nodePlugin.configs["flat/recommended-script"]],
    languageOptions: {
      globals: {
        ...globals.node
      },
      sourceType: "commonjs"
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", }],
      "n/exports-style": ["error", "module.exports"],
      "n/file-extension-in-import": ["error", "always"],
      "n/prefer-global/buffer": ["error", "always"],
      "n/prefer-global/console": ["error", "always"],
      "n/prefer-global/process": ["error", "always"],
      "n/prefer-global/url-search-params": ["error", "always"],
      "n/prefer-global/url": ["error", "always"],
      "n/prefer-promises/dns": "error",
      "n/prefer-promises/fs": "error",
      "n/no-unpublished-require": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", }],
    },
  },
  { files: ["**/*.json"], ignores: ["package-lock.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm", extends: ["markdown/recommended"] },
  { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
  { 
    ...html.configs["flat/recommended"],
    files: ["**/*.html"],
    rules: {
      "@html-eslint/indent": ["warn", 2,
        {
          "Attribute": 2,
          "tagChildrenIndent": {
            "html": 0,
            // ...
          }
        }]
    }
  },
]);