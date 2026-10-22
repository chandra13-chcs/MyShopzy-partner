# React + TypeScript + Vite

## Local partner preview

Run `npm run dev` with the example environment to open the partner workspace with local demo fixtures. The preview is only enabled in Vite development mode; it does not sign in, request partner configuration from the API, or persist changes. To exercise the real partner APIs locally, set `VITE_DEMO_MODE=false`, configure the Auth0 domain, client ID, and audience, and use the API base URL. In Vite development, `VITE_API_BASE_URL` defaults to `http://localhost:3000/api/v1` when unset; set it explicitly to use a different backend. Production builds require `VITE_API_BASE_URL` to be configured and always use the authenticated flow; they never load local demo fixtures.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
