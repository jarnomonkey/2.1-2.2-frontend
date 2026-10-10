import eslint from "@eslint/js";
import globals from "globals";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            ".svelte-kit/**",
            "build/**",
            "node_modules/**",
            "playwright-report/**",
            "test-results/**"
        ]
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...svelte.configs["flat/recommended"],
    {
        files: ["**/*.svelte"],
        languageOptions: {
            globals: {
                ...globals.browser
            },
            parserOptions: {
                parser: tseslint.parser
            }
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "svelte/no-navigation-without-resolve": "off",
            "svelte/prefer-svelte-reactivity": "off",
            "svelte/prefer-writable-derived": "off",
            "svelte/require-each-key": "off"
        }
    },
    {
        files: ["**/*.{js,ts}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        rules: {
            "no-console": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
            ]
        }
    }
);
