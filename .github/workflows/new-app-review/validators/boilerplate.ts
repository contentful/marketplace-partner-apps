import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';

export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  const isValidBoilerPlate = files
    .filter((file) => file.status === 'added' && (file.filename.endsWith('.ts') || file.filename.endsWith('.tsx')))
    .some((file) => {
      if (file.patch) {
        // Finds all <Paragraph> components in the file
        const paragraphComponentRegex = /<Paragraph[^>]*>([\s\S]*?)<\/Paragraph>/gi;
        let match;
        // Loops through all matches of the regex in the file to check for invalid boilerplate
        while ((match = paragraphComponentRegex.exec(file.patch)) !== null) {
          const innerContent = match[1].trim();

          const helloBoilerplateRegex = /^Hello.*\bComponent\b/i;
          const welcomeBoilerplateRegex = /^Welcome.*\bcontentful\b/i;

          if (helloBoilerplateRegex.test(innerContent) || welcomeBoilerplateRegex.test(innerContent)) {
            return false;
          }
        }
      }
      return true;
    });

  const message = isValidBoilerPlate
    ? 'All location components are valid.'
    : 'Unused locations found: Found components in the locations folder that are unchanged from the code generated by create-contentful-app. Please remove any location component and test files for any locations that are not rendered by your app';

  return {
    result: isValidBoilerPlate,
    message,
  };
};
