# Contributing

Thanks for your interest in contributing to FlowPilot.

## Development Setup

```bash
npm install
npm run build
```

## Branching

- Use short feature/fix branches from main.
- Keep each pull request focused on one logical change.

## Pull Request Checklist

- Update docs for behavior or API changes.
- Update [CHANGELOG.md](CHANGELOG.md) for notable user-facing changes.
- Ensure build passes locally: `npm run build:all`.
- Keep examples working if runtime behavior changes.

## Commit Message Guidance

Use clear, scoped messages. Example:

- `feat(runtime): add JSON completion rule evaluator`
- `docs(api): document completion rule operators`

## Reporting Issues

When reporting bugs, include:

- environment (browser, OS)
- reproduction steps
- expected vs actual behavior
- sample workflow/mapping config if relevant

## Code of Conduct

All contributors are expected to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
