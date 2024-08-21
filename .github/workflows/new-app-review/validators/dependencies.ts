import { spawn } from 'child_process';
import type { ValidatorOptions, ValidatorResult, PullRequestFile } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, _files: PullRequestFile[]): Promise<ValidatorResult> => {
  return new Promise((resolve, reject) => {
    const outdatedCommand = `npm outdated --json`;
    const auditCommand = `npm audit --json`;

    const outdatedChild = spawn(outdatedCommand, { shell: true, cwd: newAppDir });

    let outdatedOutput = '';
    let outdatedErrorOutput = '';

    outdatedChild.stdout.on('data', (data) => {
      outdatedOutput += data.toString();
    });

    outdatedChild.stderr.on('data', (data) => {
      outdatedErrorOutput += data.toString();
    });

    outdatedChild.on('close', (outdatedCode) => {
      if (outdatedCode === 0 || outdatedOutput) {
        let warning = '';
        const outdatedDependencies = outdatedOutput ? JSON.parse(outdatedOutput) : {};

        if (Object.keys(outdatedDependencies).length > 0) {
          warning += 'The following dependencies are outdated:\n';
          warning += Object.keys(outdatedDependencies)
            .map((dependency) => `  - ${dependency}`)
            .join('\n');
          warning += '\n\n';
        }

        const auditChild = spawn(auditCommand, { shell: true, cwd: newAppDir });

        let auditOutput = '';
        let auditErrorOutput = '';

        auditChild.stdout.on('data', (data) => {
          auditOutput += data.toString();
        });

        auditChild.stderr.on('data', (data) => {
          auditErrorOutput += data.toString();
        });

        auditChild.on('close', (auditCode) => {
          if (auditCode === 0 || auditOutput) {
            const auditResults = auditOutput ? JSON.parse(auditOutput) : {};
            const vulnerabilities = auditResults?.vulnerabilities || {};

            if (Object.keys(vulnerabilities).length > 0) {
              warning += 'The following security vulnerabilities were found:\n';
              warning += Object.keys(vulnerabilities)
                .map((key) => {
                  const advisory = vulnerabilities[key];
                  const via = advisory.via && advisory.via[0] ? advisory.via[0] : null;
                  const title = via && via.title ? via.title : '';
                  const url = via && via.url ? via.url : '';
                  return `  - ${advisory.name} (${advisory.severity}) ${title} ${url}`;
                })
                .join('\n');
            }

            resolve({
              result: true,
              warning: warning.trim(),
              message: 'Successfully checked for outdated dependencies and security vulnerabilities',
            });
          } else {
            resolve({
              result: false,
              message: 'Failed to check for security vulnerabilities',
            });
          }
        });
      } else {
        resolve({
          result: false,
          message: 'Failed to check for outdated dependencies',
        });
      }
    });
  });
};
