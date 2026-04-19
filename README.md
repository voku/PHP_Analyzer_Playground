# PHP Analyzer Playground

Browser-based playground for running PHPStan analysis, previewing PHP-CS-Fixer changes, and iterating on PHP snippets without leaving the editor.

## Features

- Run PHPStan analysis against PHP snippets
- Preview formatting changes before applying them
- Upload local `.php` files for quick inspection
- Switch between bundled examples to explore analyzer behavior
- Deploy the static frontend to GitHub Pages

## Live Site

- Production: https://voku.github.io/PHP_Analyzer_Playground/
- Repository: https://github.com/voku/PHP_Analyzer_Playground

## Requirements

- Node.js 20+ (Node.js 22 recommended)
- npm 10+

## Local Development

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000`.

No local environment variables are required for the default setup.

## Production Build

Create an optimized build:

```bash
npm run build
```

Preview the production bundle locally:

```bash
npm run preview
```

Type-check the project:

```bash
npm run lint
```

Run the unit tests:

```bash
npm test
```

## Deployment

The project is configured for GitHub Pages deployment from the `main` branch.

### Automatic deployment

- Workflow file: `.github/workflows/deploy.yml`
- Trigger: pushes to `main` or manual workflow dispatch
- Build output: `dist/`

### Required GitHub repository settings

1. Open **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Merge changes to `main`

## Project Structure

- `src/App.tsx` — main playground UI
- `src/api.ts` — PHPStan and PHP-CS-Fixer API calls
- `src/examples.ts` — starter snippets
- `index.html` — document metadata, favicon, and social tags
- `vite.config.ts` — Vite configuration and GitHub Pages base path
- `public/` — static assets such as the favicon and social preview image

## Key Files Detector Helper Prompt

Use this helper prompt when you want an AI assistant to quickly identify the most relevant files for a change:

```text
You are reviewing the PHP Analyzer Playground codebase.

Goal:
- Identify the key files that should be inspected for the requested change.

Output:
- Group files by purpose
- Explain why each file matters
- Call out any likely follow-up files if deployment, metadata, or docs are involved

Focus areas:
- UI behavior and layout
- External API integration
- Static metadata and assets
- Build and deployment configuration
- Documentation
```

## External Services

The frontend currently calls these public endpoints:

- `https://php.moelleken.org/phpstan/analyze`
- `https://php.moelleken.org/php-cs-fixer/fix`

## Contributing

Contributions are welcome: https://github.com/voku/PHP_Analyzer_Playground
