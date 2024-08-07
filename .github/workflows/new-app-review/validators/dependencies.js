const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    let warning = '';
    let result = true;
    let message = 'Dependency check finished';
    try {
      const { stdout, stderr } = await execPromise(`cd ${newAppDir} && npm outdated --json`);
      console.log({ stdout, stderr });

      // if (stderr) {
      //   result = false;
      //   message = 'Unable to check for outdated dependencies';
      //   console.error(`stderr: ${stderr}`);
      // }

      // console.log({stdout);
      const outdatedDependencies = JSON.parse(stdout);

      if (Object.keys(outdatedDependencies).length > 0) {
        warning += 'The following dependencies are outdated:\n';
        warning += outdatedDependencies;
        console.log(warning);
      }
    } catch (error) {
      message = 'Failed to check for outdated dependencies';
      console.error(`exec error: ${error.stderr.toString()}`);
      result = false;
    }

    return {
      result,
      message,
      warning,
    };
  },
};
