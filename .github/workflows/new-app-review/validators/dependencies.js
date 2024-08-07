const { spawn } = require('child_process');

module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    return new Promise((resolve, reject) => {
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
        if (code === 0) {
          resolve({
            result: true,
            message: 'Dependency check finished',
          });
        } else if (output) {
          let warning = '';
          const outdatedDependencies = JSON.parse(output);
          if (Object.keys(outdatedDependencies).length > 0) {
            warning += 'The following dependencies are outdated:\n';
            warning += Object.keys(outdatedDependencies)
              .map((dependency) => `- ${dependency}`)
              .join('\n');
          }
          resolve({
            result: true,
            warning,
            message: 'Dependency check finished',
          });
        } else {
          resolve({
            result: false,
            message: 'Failed to check for outdated dependencies',
          });
        }
      });
    });
  },
};
