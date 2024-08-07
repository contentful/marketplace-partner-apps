module.exports = async ({ github, context, core }) => {
  const prNumber = context.payload.pull_request.number;
  const { data: files } = await github.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const newAppDirs = files
    .filter((file) => file.status === 'added' && file.filename.startsWith('apps/'))
    .map((file) => file.filename.split('/').slice(0, 2).join('/'));

  const uniqueNewAppDirs = [...new Set(newAppDirs)];

  if (uniqueNewAppDirs.length === 0) {
    console.log('No new app submissions found.');
    return;
  }

  console.log('New app submissions found:', uniqueNewAppDirs);

  // load all validators
  const validators = require('./app-review');
  const failures = {};
  for (const newAppDir of uniqueNewAppDirs) {
    for (const [check, validator] of Object.entries(validators)) {
      if (typeof validator.validate === 'function') {
        const { result, message } = await validator.validate({ github, context, core }, newAppDir);
        if (!result) {
          failures[check] = message ?? `${check} check failed`;
        }
      }
    }
  }

  if (Object.keys(failures).length > 0) {
    const issue_number = context.payload.pull_request.number;
    const comment_body = '😡\n' + Object.values(failures).join('\n');
    const label_name = 'needs work';

    // Add a comment to the PR
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number,
      body: comment_body,
    });

    // Add a label to the PR
    await github.rest.issues.addLabels({
      ...context.repo,
      issue_number,
      labels: [label_name],
    });
  }
};
