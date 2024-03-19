# Overrides, explained

## `react-scripts/**/nth-check`

npm overrides are broken and `nth-check` can not be overridden properly, because it breaks `npm ci` =/

See more: https://github.com/npm/cli/issues/4942

## `react-scripts/typescript`

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR!
npm ERR! While resolving: react-scripts@5.0.1
npm ERR! Found: typescript@5.3.3
npm ERR! node_modules/typescript
npm ERR!   dev typescript@"5.3.3" from the root project
npm ERR!   peer typescript@">=2.9" from prettier-plugin-organize-imports@3.2.4
npm ERR!   node_modules/prettier-plugin-organize-imports
npm ERR!     dev prettier-plugin-organize-imports@"3.2.4" from the root project
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peerOptional typescript@"^3.2.1 || ^4" from react-scripts@5.0.1
npm ERR! node_modules/react-scripts
npm ERR!   dev react-scripts@"5.0.1" from the root project
npm ERR!
npm ERR! Conflicting peer dependency: typescript@4.9.5
npm ERR! node_modules/typescript
npm ERR!   peerOptional typescript@"^3.2.1 || ^4" from react-scripts@5.0.1
npm ERR!   node_modules/react-scripts
npm ERR!     dev react-scripts@"5.0.1" from the root project
```

`react-scripts` probably won't be ever updated: https://github.com/facebook/create-react-app/issues/11174.

But all the other Contentful integrations are using TypeScript 5.x.
So we're fixing its version to be up-to-date with others.

Hopefully it won't break `react-scripts` in any way :crossed-fingers:

## `react-scripts/resolve-url-loader`

```
postcss  <8.4.31  
Severity: moderate
PostCSS line return parsing error - https://github.com/advisories/GHSA-7fh5-64p2-3v2j
fix available via `npm audit fix --force`
Will install react-scripts@3.0.1, which is a breaking change
node_modules/resolve-url-loader/node_modules/postcss
  resolve-url-loader  0.0.1-experiment-postcss || 3.0.0-alpha.1 - 4.0.0
  Depends on vulnerable versions of postcss
  node_modules/resolve-url-loader
    react-scripts  >=3.1.0
    Depends on vulnerable versions of resolve-url-loader
    node_modules/react-scripts
```

`react-scripts` probably won't be ever updated: https://github.com/facebook/create-react-app/issues/11174.

So we're fixing `resolve-url-loader` version to 5.0.0 to force PostCSS update.

`resolve-url-loader@5` requires [`postcss@^8.2.14`](https://github.com/bholloway/resolve-url-loader/blob/e2695cde68f325f617825e168173df92236efb93/packages/resolve-url-loader/package.json#L41), which is fine here.
The breaking changes of this version [does not affect](https://github.com/bholloway/resolve-url-loader/blob/e2695cde68f325f617825e168173df92236efb93/packages/resolve-url-loader/CHANGELOG.md) us or `react-scripts`.
