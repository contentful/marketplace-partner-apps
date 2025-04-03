import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';


export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  const invalidBoilerPlate = files
    .filter((file) => file.status === 'added' && (file.filename.endsWith('.ts') || file.filename.endsWith('.tsx')))
    .some((file) => {

      if (file.patch) {
        const paragraphComponentRegex = /<Paragraph[^>]*>([\s\S]*?)<\/Paragraph>/i;
        const paragraphComponent = file.patch.match(paragraphComponentRegex);

        if (paragraphComponent) {
          const innerContent = paragraphComponent[1];
          const helloRegex = /Hello/i;
          return helloRegex.test(innerContent);
        }
      }
      return false;
    });

  const result = !invalidBoilerPlate;
  const message = result
    ? 'Boilerplate check passed'
    : 'Boilerplate check failed: Found components in the locations folder with unused boilerplate code. Please removes these components and their respective tests and try again.';

  return {
    result,
    message,
  };
};
