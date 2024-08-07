module.exports = {
  validate: async ({ github, context, core }, newAppDir) => {
    const usesTypescript = false;

    return {
      result: usesTypescript,
    };
  },
};
