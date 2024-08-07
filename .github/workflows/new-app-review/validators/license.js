module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    // validate the new app
    console.log(`License check for ${newAppDir}...`);

    const hasLicense = !!files.find((file) => file.status === 'added' && file.filename.startsWith(`marketplace-partner-apps/apps/${newAppDir}/LICENSE`));

    //check for license
    return {
      result: hasLicense,
      message: hasLicense ? 'License check passed' : 'License check failed',
    };
  },
};
