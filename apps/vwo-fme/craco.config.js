// Create React App's catch-all `asset/resource` (file-loader) rule excludes
// js/mjs/jsx/ts/tsx but not `.cjs`. `@contentful/app-sdk` resolves
// `contentful-management`, whose entry is a `.cjs` file, so CRA emits it as a
// static asset instead of bundling it as a module — leaving `createClient`
// unavailable at runtime ("createClient is not a function"). Add `.cjs` to the
// exclude so contentful-management is bundled as JavaScript.
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const addCjsToExclude = (rule) => {
        if (rule.oneOf) {
          rule.oneOf.forEach(addCjsToExclude);
        }
        if (rule.type === 'asset/resource' && Array.isArray(rule.exclude)) {
          const hasJsExclude = rule.exclude.some(
            (re) => re instanceof RegExp && re.source.includes('mjs'),
          );
          if (hasJsExclude) {
            rule.exclude.push(/\.cjs$/);
          }
        }
      };

      webpackConfig.module.rules.forEach(addCjsToExclude);
      return webpackConfig;
    },
  },
};
