# New App Review

PRs containing new app submissions undergo some extra validation to ensure they are ready for review.

This workflow script will run these checks, comment on the PR with any failures,
and label the PR according to the review result as either `Ready For Review` or `Needs Work`.

## Adding a New Check

To add a new check to the validation process, simply add a [validator](./validators/)
that exports a validate method like the following example:

```js
module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    // perform your check on the new app
    const isValid = Math.floor(Math.random() * 2) === 1;

    return {
      result: isValid,
      // optional message
      message: isValid ? 'My new check passed ✨' : 'My new check failed 😢',
    };
  },
};
```
