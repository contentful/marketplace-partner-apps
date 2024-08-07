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

const validateNewApps = async (validators, { github, context, core }, newAppDirs) => {
  const failures = {};
  for (const newAppDir of newAppDirs) {
    for (const [check, validator] of Object.entries(validators)) {
      if (typeof validator.validate === 'function') {
        const validation = await validator.validate({ github, context, core }, newAppDir);
        validation.message = validation.message ?? `${check} check ${validation.result ? 'passed' : 'failed'}`;
        console.log(validation.message);
        if (!validation.result) {
          failures[check] = validation.message;
        }
      }
    }
  }
  return failures;
};

const handleValidationFailures = async (github, context, prNumber, failures) => {
  const comment_body = '😡\n' + Object.values(failures).join('\n');
  const label_name = 'needs work';

  await github.rest.issues.createComment({
    ...context.repo,
    issue_number: prNumber,
    body: comment_body,
  });

  await github.rest.issues.addLabels({
    ...context.repo,
    issue_number: prNumber,
    labels: [label_name],
  });
};

module.exports = {
  getPullRequestFiles,
  getNewAppDirectories,
  validateNewApps,
  handleValidationFailures,
};
