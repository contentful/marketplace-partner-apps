module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    const hasLicense = !!files.find((file) => file.status === 'added' && file.filename.startsWith(`${newAppDir}/LICENSE`));

    return {
      result: hasLicense,
      message: hasLicense ? 'License check passed' : 'License check failed: please include a file named LICENSE at the root of your app directory',
    };
  },
};
