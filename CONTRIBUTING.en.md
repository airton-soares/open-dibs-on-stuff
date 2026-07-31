# Contributing

🇺🇸 English | 🇧🇷 [Português](CONTRIBUTING.md)

Thanks for considering contributing to `open-dibs-on-stuff`. This document explains how to set up
the environment, which checks to run before opening a PR, and the conventions used in the project.

## Setting up the environment

- [Deno](https://deno.com/) 2.x, preferably via [asdf](https://asdf-vm.com/) (the exact version is
  pinned in `.tool-versions`):

  ```sh
  asdf plugin add deno https://github.com/asdf-community/asdf-deno.git
  asdf install
  ```

- [Slack CLI](https://docs.slack.dev/tools/slack-cli/) logged in (`slack login`). Only needed if
  you're testing against a real Slack workspace (`slack run` / `slack deploy`); to run
  lint/fmt/tests, Deno alone is enough.

## Running locally

```sh
slack run
```

## Checklist before opening a PR

CI runs these commands in this order; run all of them locally before submitting:

```sh
deno task fmt         # formats (or `deno task fmt:check` to just check)
deno task lint
deno check manifest.ts triggers/*.ts
deno task test
```

## Architecture

The project follows the "pure core + thin shell" pattern: business decisions live in pure, testable
modules in `functions/internals/`, with no network and no Slack client. Custom functions in
`functions/*.ts` are thin shells that delegate the decision to the core and handle IO (Datastore,
messages). See [CLAUDE.md](CLAUDE.md) for more detail on how the modules fit together.

When adding new behavior, prefer to:

- Write the decision logic in `functions/internals/`, with co-located tests (`*_test.ts`) that don't
  depend on the network.
- Keep custom functions as thin shells, with no decision logic directly in the function.
- Cover the new case with a test before considering the change done.

## Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`,
`refactor:`, `test:`, `chore:`, etc.). Existing history uses short, imperative descriptions in
Portuguese. Matching that style is fine, but a clear imperative description in English works too.

This isn't just style: releases on `main` are automated by
[semantic-release](https://semantic-release.gitbook.io/), which reads these prefixes to decide the
next version. `fix:` bumps patch, `feat:` bumps minor, and a `BREAKING CHANGE:` footer (or `!` right
after the type, like `feat!:`) bumps major. A commit outside this format just doesn't trigger a
release. Each version's changelog lives on the
[Releases tab](https://github.com/airton-soares/open-dibs-on-stuff/releases) on GitHub, not in a
file in the repo.

## Pull requests

`main` is protected: no direct pushes, every change goes through a PR.

- One PR per logical change; avoid mixing a refactor with a feature.
- Describe what changed and why (the "why" matters more than the "what", which the diff already
  shows).
- Make sure CI passes (fmt, lint, check, test) before requesting review.

## Reporting bugs and proposing features

Open an issue describing the problem (or the need) and the context: steps to reproduce for a bug, or
the use case for a feature.

## License

This project is licensed under [GPL-3.0](LICENSE). By contributing, you agree that your contribution
will be licensed under the same terms.
