module.exports = {
  validate: async ({ github, context, core }, newAppDir, files) => {
    const usesTypescript = false;

    return {
      result: usesTypescript,
    };
  },
};
