const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const FAILURE_LABEL = 'Further development recommended';
const SUCCESS_LABEL = 'Ready for review';

const getPullRequestFiles = async (github, context, prNumber) => {
  const { data: files } = await github.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });
  return files;
};

const getNewAppDirectories = (files) => {
  const newAppDirs = files
    .filter((file) => file.status === 'added' && file.filename.startsWith('apps/'))
    .map((file) => file.filename.split('/').slice(0, 2).join('/'));
  return [...new Set(newAppDirs)];
};

const installAppDependencies = async (newAppDir) => {
  try {
    await execPromise(`(cd ${newAppDir} && npm ci)`);
  } catch (error) {
    console.error(`Failed to install app dependencies for ${newAppDir}: ${error}`);
  }
};

const validateNewApps = async (validators, { github, context, core }, newAppDirs, files) => {
  const failures = {};
  const warnings = {};
  for (const newAppDir of newAppDirs) {
    await installAppDependencies(newAppDir);
    for (const [check, validator] of Object.entries(validators)) {
      if (typeof validator.validate === 'function') {
        const validation = await validator.validate({ github, context, core }, newAppDir, files);
        validation.message = validation.message ?? `${check} check ${validation.result ? 'passed' : 'failed'}`;
        console.log(validation.message);
        if (!validation.result) {
          failures[check] = validation.message;
        }
        if (validation.warning) {
          warnings[check] = validation.warning;
        }
      }
    }
  }
  return {
    failures,
    warnings,
  };
};

const handleValidationFailures = async (github, context, prNumber, failures) => {
  const commentBody = '😡\n' + Object.values(failures).join('\n');

  await github.rest.issues.createComment({
    ...context.repo,
    issue_number: prNumber,
    body: commentBody,
  });

  try {
    await github.rest.issues.removeLabel({
      ...context.repo,
      issue_number: prNumber,
      name: [SUCCESS_LABEL],
    });
  } catch (error) {}

  await github.rest.issues.addLabels({
    ...context.repo,
    issue_number: prNumber,
    labels: [FAILURE_LABEL],
  });
};

const handleValidationSuccess = async (github, context, prNumber) => {
  try {
    await github.rest.issues.removeLabel({
      ...context.repo,
      issue_number: prNumber,
      name: [FAILURE_LABEL],
    });
  } catch (error) {}
  await github.rest.issues.addLabels({
    ...context.repo,
    issue_number: prNumber,
    labels: [SUCCESS_LABEL],
  });
};

const handleValidationWarnings = async (github, context, prNumber, warnings) => {
  const commentBody =
    'Please acknowledge the following warnings:\n' +
    Object.values(warnings)
      .map((warning) => `- [ ] ${warning}`)
      .join('\n');

  await github.rest.issues.createComment({
    ...context.repo,
    issue_number: prNumber,
    body: commentBody,
  });
};

const hasPackageJson = async (files, newAppDir) => !!files.find((file) => file.status === 'added' && file.filename.startsWith(`${newAppDir}/package.json`));

module.exports = {
  getPullRequestFiles,
  getNewAppDirectories,
  validateNewApps,
  handleValidationFailures,
  handleValidationSuccess,
  handleValidationWarnings,
  hasPackageJson,
};
