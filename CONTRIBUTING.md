# Contributing

Thanks for your interest in contributing to this project.

## Before You Start

- Read `README.md` and `ARCHITECTURE.md` for product and technical context.
- Check open issues and pull requests to avoid duplicate work.
- For security issues, do not open a public issue. Follow `SECURITY.md`.

## Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .dev.vars
   ```

3. Fill required variables:

- `LOVENSE_DEV_TOKEN`
- `JWT_SECRET`

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Branches and Commits

- Create a focused branch for each change.
- Keep commits small and descriptive.
- Use clear commit messages that explain why the change is needed.

## Pull Request Guidelines

- Keep PRs focused and reasonably sized.
- Include a short summary of the problem and solution.
- Add test/verification notes (what you ran and what passed).
- Update docs when behavior or architecture changes.

## Quality Checks

Before opening a PR, run:

```bash
npm run lint
npm run build
```

If your change affects Cloudflare deployment behavior, also run:

```bash
npm run build:cloudflare
```

## Code Style

- Follow the existing TypeScript and React patterns in the repository.
- Prefer small, composable hooks/components.
- Avoid introducing unrelated refactors in feature PRs.
