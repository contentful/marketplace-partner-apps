# New App Review

PRs containing new app submissions undergo some extra validation to ensure they are ready for review.

This workflow script will run these checks, comment on the PR with any failures,
and label the PR according to the review result as either `Pending Contentful Review` or `Partner Action Needed`.

## Adding a New Check

To add a new check to the validation process, simply add a [validator](./validators/)
that exports a validate method like the following example:

```js
export const validate = async (options: ValidatorOptions, newAppDir: string, files: PullRequestFile[]): Promise<ValidatorResult> => {
  // perform your check on the new app
  const isValid = Math.floor(Math.random() * 2) === 1;

  return {
    result: isValid,
    // optional message
    message: 'xyz check failed 😢, here is how to fix it: ...',
    // optional warning
    warning: 'This will create a warning checkbox to be acknowledged',
  };
};
```
