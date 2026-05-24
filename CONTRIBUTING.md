# Contributing to Claril

Thank you for your interest in contributing to Claril! This document outlines the guidelines and best practices for submitting changes, reporting bugs, and helping make Claril a world-class document intelligence platform.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the project maintainers.

## How to Contribute

### 1. Reporting Bugs & Requesting Features
- Search the issue tracker to see if your bug or feature request has already been reported.
- If not, open a new issue using the appropriate template:
  - For bugs: [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
  - For features: [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)

### 2. Proposing Changes
- Fork the repository and create a new feature branch:
  ```bash
  git checkout -b feat/your-feature-name
  # or for bug fixes:
  git checkout -b fix/your-bug-name
  ```
- Make your changes in a clean, isolated commit history.
- Ensure that the local project builds successfully and passes all checks:
  ```bash
  pnpm build
  pnpm lint
  ```

### 3. Commit Messages
We follow a structured commit style similar to Conventional Commits:
- `feat:` for new features or capabilities (e.g., `feat: add Google Gemini vision extraction support`)
- `fix:` for bug fixes (e.g., `fix: resolve auth redirection on middleware`)
- `docs:` for documentation updates (e.g., `docs: update deployment instructions in BUILD.md`)
- `style:` for changes that do not affect the meaning of the code (formatting, linting)
- `refactor:` for code restructurings that neither fix bugs nor add features

### 4. Submitting Pull Requests
- Push your branch to your fork.
- Open a Pull Request (PR) against our `main` branch.
- Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely.
- Ensure your PR is well-scoped, has a clear description, and addresses an open issue where applicable.
- Once submitted, the automated CI checks will run. Maintainers will review your code and request changes or merge it.

## Coding Style & Standards

- **TypeScript:** Use strict type checking, avoid using `any` types where possible, and prefer explicit types.
- **Styling:** Use standard CSS files with Tailwind v4 utilities. Focus on premium, beautiful, and responsive designs.
- **Architecture:** Keep components reusable and separate server components from client components in Next.js. Make use of server-side AI execution for security.
- **Testing:** Add or update tests when modifying complex logical components.

Thanks again for contributing!
