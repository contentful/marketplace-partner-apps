const { spawn } = require('child_process');

module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    let warning = '';
    let result = true;
    let message = 'Dependency check finished';

    try {
      const stdout = await new Promise((resolve, reject) => {
        const command = `npm outdated --json`;
        const child = spawn(command, { shell: true, cwd: newAppDir });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        child.on('close', (code) => {
          if (code !== 0) {
            console.log({ output, errorOutput });
            reject(new Error(`Child process exited with code ${code}`));
          } else if (errorOutput) {
            reject(new Error(errorOutput));
          } else {
            resolve(output);
          }
        });
      });

      const outdatedDependencies = JSON.parse(stdout);

      if (Object.keys(outdatedDependencies).length > 0) {
        warning += 'The following dependencies are outdated:\n';
        warning += JSON.stringify(outdatedDependencies, null, 2);
        console.log(warning);
      }
    } catch (error) {
      message = 'Failed to check for outdated dependencies';
      console.error(`exec error: ${error.message}`);
      result = false;
    }

    return {
      result,
      message,
      warning,
    };
  },
};
