module.exports = {
  validate: async ({ github, context, core }, newAppDir) => {
    // validate the new app
    console.log(`License check for ${newAppDir}...`);
    const hasLicense = false;

    //check for license
    return {
      result: hasLicense,
      message: hasLicense ? 'License check passed' : 'License check failed',
    };
  },
};
