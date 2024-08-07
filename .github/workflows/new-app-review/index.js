const { getPullRequestFiles, getNewAppDirectories, validateNewApps, handleValidationFailures } = require('../app-review-utils.js');
const fs = require('fs');
const path = require('path');

function loadValidators(directory) {
  const validators = {};
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    if (file.endsWith('.js')) {
      const validatorName = path.basename(file, '.js');
      validators[validatorName] = require(path.join(directory, file));
    }
  });

  return validators;
}

const validators = loadValidators(path.join(__dirname, 'validators'));

async function review({ github, context, core }) {
  const prNumber = context.payload.pull_request.number;

  const files = await getPullRequestFiles(github, context, prNumber);
  const newAppDirs = getNewAppDirectories(files);

  if (newAppDirs.length === 0) {
    console.log('No new app submissions found.');
    return;
  }

  console.log('New app submissions found:', newAppDirs);

  const failures = await validateNewApps(validators, { github, context, core }, newAppDirs);

  if (Object.keys(failures).length > 0) {
    await handleValidationFailures(github, context, prNumber, failures);
  }
}

module.exports = {
  review,
};
