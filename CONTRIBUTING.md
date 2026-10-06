# Contributing

Thank you for helping improve Mofisc.

## Before you start

- Check existing issues before opening a new one.
- Keep changes focused; separate refactors from product changes.
- Use synthetic identities, statements, and transactions in tests and examples.
- Never include credentials, customer records, or unredacted screenshots.

## Development workflow

```bash
cp .env.example .env
npm ci
npm start
```

Create a short branch from the current default branch. Before opening a pull
request, run:

```bash
npm run typecheck
npm test -- --runInBand --watchAll=false
npm run test:security
npm run build
```

## Pull requests

Describe the user-visible change, the checks you ran, and any configuration or
migration impact. Add tests for changed behaviour. Include screenshots only
when they clarify a visual change, and redact all sensitive values first.

By contributing, you agree that your contribution is licensed under the
repository's MIT License.
