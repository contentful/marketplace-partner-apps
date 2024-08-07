module.exports = {
  validate: async ({ github, context, core }, newAppDir) => {
    // validate the new app
    console.log(`Tester check for ${newAppDir}...`);
    const hasLicense = false;

    //check for license
    return {
      result: hasLicense,
      message: hasLicense ? 'Tester check passed' : 'Tester check failed ✨',
    };
  },
};
