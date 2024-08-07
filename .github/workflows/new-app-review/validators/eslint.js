const { hasPackageJson } = require('../../app-review-utils.js');
module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    let hasEslintConfig = !!files.find(
      (file) => file.status === 'added' && (file.filename.startsWith(`${newAppDir}/.eslint`) || file.filename.startsWith(`${newAppDir}/eslint`))
    );
    let dependsOnEslint = false;

    if (hasPackageJson(files, newAppDir)) {
      const packageJson = require(`../../../../${newAppDir}/package.json`);
      dependsOnEslint = packageJson.devDependencies && packageJson.devDependencies.eslint;
      if (!hasEslintConfig) {
        hasEslintConfig = !!packageJson.eslintConfig;
      }
    }

    const result = hasEslintConfig && dependsOnEslint;
    const message = result ? 'ESLint check passed' : 'ESLint check failed: please include an ESLint configuration file and install ESLint as a dev dependency';

    return {
      result,
      message,
    };
  },
};
