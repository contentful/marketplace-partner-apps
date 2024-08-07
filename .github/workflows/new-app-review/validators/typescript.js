const { hasPackageJson } = require('../../app-review-utils.js');
module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    const hasTsConfig = !!files.find((file) => file.status === 'added' && file.filename.startsWith(`${newAppDir}/tsconfig.json`));
    const hasTsFiles = !!files.find(
      (file) => file.status === 'added' && file.filename.startsWith(newAppDir) && (file.filename.endsWith('.ts') || file.filename.endsWith('.tsx'))
    );
    let dependsOnTypescript = false;
    if (hasPackageJson(files, newAppDir)) {
      const packageJson = require(`../../../../${newAppDir}/package.json`);
      dependsOnTypescript = packageJson.devDependencies && packageJson.devDependencies.typescript;
    }

    return {
      result: hasTsConfig && hasTsFiles,
      message:
        hasTsConfig && hasTsFiles && dependsOnTypescript
          ? 'TypeScript check passed'
          : 'TypeScript check failed: please include a tsconfig.json file, install typescript as a dev dependency, and TypeScript files in your app directory',
    };
  },
};
