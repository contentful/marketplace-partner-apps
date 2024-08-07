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
};
