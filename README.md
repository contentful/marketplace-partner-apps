# Marketplace Partner Apps

This repository contains the source code for partner apps on the [marketplace](https://www.contentful.com/marketplace/) and helpful resources to build your own apps for Contentful.

## Installing an app

Head over to the [marketplace](https://www.contentful.com/marketplace/) and follow the installation flow to set up any of the apps in your Contentful space.

## Adding and maintaining your app in this repo

The Marketplace Partner Apps repo is maintained as a single repository for apps, containing several ecosystem partner apps + the tools needed to build and maintain them. The `apps` folder contains each partner app, and each sub-folder within `apps` should contain all the code necessary to build, test, and deploy your app without references to other apps or folders.

### First time setup

The `marketplace-partner-apps` repo uses [Circle CI](https://circleci.com/docs/) (configured in `.circleci/config.yml`) to deploy itself, and [Lerna](https://lerna.js.org/) (configured in `lerna.json`) to manage the collection of partner apps.

When a PR is opened that introduces a new app, a [GitHub action](.github/workflows/new-app-review/README.md) runs to do some extra validation to ensure that the PR is ready for Contentful review. Specifically, here are some criteria it checks for:

- Have a `package.json` file with the following `scripts`:

  - `start`
    - Runs the app locally, such as `"vite"`
  - `install-ci`
    - Installs required dependencies for your project. Highly recommended that the script is `npm ci` that installs off of a package-lock file.
  - `build`
    - Creates a build artifact(s). `"vite build"` is common for most apps without specific needs, though whatever tool or process you prefer is fine so long as it creates artifacts that can be referenced in the deploy step.
  - `test`
    - Having at least basic testing and coverage is required to ensure your app does not deploy if breaking changes are introduced by your work or dependabot (see below). `"vitest"` is common for many apps and should be considered if you do not have complicated tests.
  - `lint`
    - Runs a script to lint your app's code. This is a required script to ensure code quality and consistency, and it is recommended to use [ESLlint](https://eslint.org/) in your app. See the Cloudinary app for an example [ESLint configuration](apps/cloudinary2/.eslintrc.json).

- Ensure that the package version number in your `package.json` file is below 1.0.0. The version of 1.0.0 is reserved for initial releases.

- Have a `LICENSE` file at the root of your app directory with a valid open source license agreement.

- Use [TypeScript](https://www.typescriptlang.org/). We require this to ensure code quality and maintainability for the marketplace apps.

- Ensure dependencies are up to date. The validation checks will provide warnings if a new app has outdated dependencies.
  > [!NOTE] > **Please note that dependabot is enabled in this repo and will run automatically.**
  > While it will attempt to only upgrade dependencies without breaking changes, it is possible it will still introduce issues. Creating and maintaining comprehensive tests is critical to preventing code and build issues. See [Keeping dependencies up to date](#keeping-dependencies-up-to-date) for more details.

### After a new app is introduced

After a new app has been introduced into the repo, the Contentful team will make a couple of updates:

- All code deployed by the `marketplace-partner-apps` repo must be hosted by Contentful. The Contentful team will add the necessary `deploy` script that will deploy your app to an app definition in our shared, official space. Please do not update it in subsequent changes/pull requests; doing so will prevent future updates from being deployed to your marketplace app definition.

- Add the new app to the repo's dependabot configuration.

- Add the new app to the `release-please-config.json` file so that the release workflow will include the new app. The release workflow encapsulates versioning as well as the creation and maintenance of a changelog.

### Committing and updating your repo

When you are ready to submit your app to the [marketplace apps repo](https://github.com/contentful/marketplace-partner-apps), clone the repo locally, create a new branch with a name that follows Conventional Commits standards (see below) for the app/changes you are introducing, and create a pull-request against the `main` branch. A Contentful team member will review your PR soon and let you know if any changes or clarifications are needed. To ensure the fastest approval time on your PR, make sure you:

- PR titles must confirm to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) standard. (A Github Action will emit a failing status check if your PR title does not match). If you are introducing a new app, please use the type `feat`.
- **Commit messages are public!** We highly recommend following standards for [good commit messages](https://github.com/googleapis/release-please#how-should-i-write-my-commits). Commit messages are automatically pulled into your app's changelog for each release and should be clear and understandable to the end user.
- Fill out the pull request template as much as possible. Screenshots, images, and videos are often helpful for providing context and are encouraged.
- You should include your company, agency, or individual name in the PR description.
- Comment your changes, either in GitHub or the code itself to provide reviewers more context than they might get otherwise.
- Ensure your changes are wholly contained within your app's folder, and do not make alterations to other folders or the root level. If you have need for root-level changes, please create an issue instead.
- Prevent / reduce references to external resources and code. The `marketplace-partner-apps` is intended to be open and transparent and any external resources will be _highly_ scrutinized.
- Submit the [Contentful Marketplace Listing Questionnaire](https://contentful.typeform.com/to/fHkaviJq) if you haven't already.

### Keeping dependencies up to date

It is the responsibility of all partner app developers to ensure their app is kept up to date with the latest versions of all dependencies required by their app. This is required not only to ensure their app continues to function as expected alongside the constantly evolving Contentful platform, but also to ensure that critical security updates are applied in a timely fashion and are not slowed down by out of date cross dependencies.

To keep dependencies up to date, Contentful uses [Dependabot](https://docs.github.com/en/code-security/dependabot) in this repository. Dependabot will:

- Open PRs to propose dependency updates for every dependency listed in your app's package.json file.
- Automatically approve and merge PRs for patch and minor version updates.
- Hold off on merging PRs for major version updates pending manual review by the app owner, you.

> [!TIP]
> We recommend specifying bare versions (e.g. `1.2.3`) of dependencies in your package.json file vs. a range of versions (e.g. `1.2.x` or `~1.2.3`). Dependabot will increment versions in your package.json file automatically.

As an app developer, it is important to review and approve any dependency update PRs assigned to you on a frequent basis. Specifically we ask that you:

- Provide a reasonably confident test suite that exercises the main functionality of your app. Test suites generally do an excellent job of catching errors caused by breaking changes in updated dependencies.
- Respond to, review, and approve (adding a PR comment suffices as an approval) any dependency-related PRs that are opened against your app (whether by Dependabot or the Contentful team) in a timely fashion. If errors exist in aforementioned dependency-related PRs, please resolve these errors.
- Talk to us if you have a specific requirement to firmly pin a dependency version. We can make custom modifications to our Dependabot configuration to support exceptions as needed.

## Building your own app

The best way to get started on app development is with our [create-contentful-app](https://github.com/contentful/create-contentful-app) CLI tool.
This tool will bootstrap a brand new project with all the boilerplate code you need to start building an app.
If you are interested in learning how to build a simple example app, you can check out our [tutorial](https://www.contentful.com/developers/docs/extensibility/apps/building-apps/).

Detailed documentation can be found in the [App SDK documentation](https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/) and the [Management HTTP API reference documentation](https://www.contentful.com/developers/docs/references/content-management-api/).

Please note that each app has its individual source code license associated with it. Refer to the LICENSE file in the apps root folder.

## Resources

- [Tutorial: Building your first app](https://www.contentful.com/developers/docs/extensibility/apps/building-apps/)
- [Webinar: How to build your first app with Contentful’s new App Framework](https://www.contentful.com/resources/build-app-contentful-app-framework-webinar/)
- [App SDK documentation](https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/)
- [Management HTTP API reference documentation](https://www.contentful.com/developers/docs/references/content-management-api/)
- [Marketplace](https://www.contentful.com/marketplace/)
- [App documentation](https://www.contentful.com/developers/docs/extensibility/apps/)
- [Contentful Changelog](https://www.contentful.com/developers/changelog/)
- [Forma 36: The Contentful Design System](https://f36.contentful.com/)

## Support and feature requests

If you require support, or want to request a new feature then please
use the appropriate support channel which will be listed with the app on our [app
marketplace](https://www.contentful.com/marketplace/).
