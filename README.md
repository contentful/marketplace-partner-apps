# Marketplace Partner Apps

This repository contains the source code for partner apps on the [Contentful Marketplace](https://www.contentful.com/marketplace/) and helpful resources to build your own apps for Contentful.

## Installing an App

Head over to the [Contentful Marketplace](https://www.contentful.com/marketplace/) and follow the installation flow to set up any of the apps in your Contentful space.

## Contributing to This Repository

The Marketplace Partner Apps repository is maintained as a monorepo containing several ecosystem partner apps and the tools needed to build and maintain them. The `apps` folder contains each partner app, with each sub-folder containing all the code necessary to build, test, and deploy that app independently.

### Repository Structure

This repository uses:
- [Circle CI](https://circleci.com/docs/) (configured in `.circleci/config.yml`) for deployment
- [Lerna](https://lerna.js.org/) (configured in `lerna.json`) to manage the collection of partner apps

### Adding a New App

When you open a PR that introduces a new app, a [GitHub action](.github/workflows/new-app-review/README.md) runs validation to ensure your PR is ready for Contentful review.

#### Required Files and Scripts

Your app must include:

**1. `package.json` with required scripts:**
- `start` - Runs the app locally (e.g., `"vite"`)
- `install-ci` - Installs dependencies (recommended: `"npm ci"`)
- `build` - Creates build artifacts (e.g., `"vite build"`)
- `test` - Runs your test suite (e.g., `"vitest"`)
- `lint` - Lints your code (recommended: [ESLint](https://eslint.org/))

**2. Additional Requirements:**
- Package version must be below 1.0.0 (1.0.0 is reserved for initial release)
- `LICENSE` file with a valid open source license
- [TypeScript](https://www.typescriptlang.org/) usage (required for code quality)
- Up-to-date dependencies

> **Note:** [Dependabot](https://docs.github.com/en/code-security/dependabot) is enabled and will automatically upgrade dependencies. Comprehensive tests are critical to prevent issues from automatic updates.

### Post-Submission Process

After your app is accepted, the Contentful team will:

1. **Add deployment configuration** - We'll add the necessary `deploy` script to host your app on Contentful's infrastructure. Please don't modify this script in future PRs.

2. **Configure automation** - We'll add your app to:
   - Dependabot configuration for dependency updates
   - `release-please-config.json` for automated versioning and changelog generation

### Submitting Changes

To submit your app or updates:

1. **Clone and branch** - Create a new branch following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) standards
2. **Create a pull request** against the `main` branch

#### PR Requirements

- **Title** must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) format (use `feat` for new apps)
- **Clear commit messages** - These become part of your app's public changelog
- **Complete PR template** - Include screenshots, videos, and context where helpful
- **Include your organization name** in the PR description
- **Comment your changes** for reviewer context
- **Scope changes to your app folder only** - Don't modify other folders or root-level files
- **Minimize external dependencies** - External resources will be scrutinized
- **Submit the [Contentful Marketplace Listing Questionnaire](https://contentful.typeform.com/to/fHkaviJq)** if you haven't already

### Dependency Management

App developers are responsible for keeping dependencies up to date for security and compatibility.

#### How Dependabot Works

Dependabot will automatically:
- Open PRs for dependency updates
- Auto-merge patch and minor version updates
- Hold major version updates for manual review

#### Your Responsibilities

- **Maintain comprehensive tests** to catch breaking changes
- **Review and approve dependency PRs promptly**
- **Use specific versions** (e.g., `1.2.3`) rather than ranges (e.g., `~1.2.3`) in `package.json`
- **Contact us** if you need to pin specific dependency versions

## Building Your Own App

The best way to get started is with our [create-contentful-app](https://github.com/contentful/create-contentful-app) CLI tool, which bootstraps a new project with all necessary boilerplate code.

For a step-by-step guide, check out our [tutorial on building your first app](https://www.contentful.com/developers/docs/extensibility/apps/building-apps/).

## Documentation and Resources

### Development Documentation
- [App SDK documentation](https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/)
- [Management HTTP API reference](https://www.contentful.com/developers/docs/references/content-management-api/)
- [App documentation](https://www.contentful.com/developers/docs/extensibility/apps/)

### Learning Resources
- [Tutorial: Building your first app](https://www.contentful.com/developers/docs/extensibility/apps/building-apps/)
- [Webinar: How to build your first app with Contentful's new App Framework](https://www.contentful.com/resources/build-app-contentful-app-framework-webinar/)

### Tools and Design
- [Forma 36: The Contentful Design System](https://f36.contentful.com/)
- [Contentful Marketplace](https://www.contentful.com/marketplace/)
- [Contentful Changelog](https://www.contentful.com/developers/changelog/)

## Licensing

Each app has its individual source code license. Refer to the LICENSE file in each app's root folder.

## Support and Feature Requests

For support or feature requests, use the appropriate support channel listed with the app on the [Contentful Marketplace](https://www.contentful.com/marketplace/).
