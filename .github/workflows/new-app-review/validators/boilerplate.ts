import type { PullRequestFile, ValidatorOptions, ValidatorResult } from '../../types';


export const validate = async (_options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  const hasInvalidBoilerPlate = files
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
          
          return (helloBoilerplateRegex.test(innerContent) || welcomeBoilerplateRegex.test(innerContent))
        }
      }
      return false;
    });

  const result = hasInvalidBoilerPlate;
  const message = result
    ? 'All location components are valid.'
    : 'Unused locations found: Please remove all unused location components and their respective tests.';

  return {
    result,
    message,
  };
};
