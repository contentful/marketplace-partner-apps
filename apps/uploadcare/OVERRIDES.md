# Overrides, explained

## `react-scripts/**/nth-check`

https://github.com/advisories/GHSA-rp65-9cf3-cjxr

```
nth-check  <2.0.1
Severity: high
Inefficient Regular Expression Complexity in nth-check - https://github.com/advisories/GHSA-rp65-9cf3-cjxr
fix available via `npm audit fix --force`
Will install react-scripts@2.1.3, which is a breaking change
node_modules/svgo/node_modules/nth-check
  css-select  <=3.1.0
  Depends on vulnerable versions of nth-check
  node_modules/svgo/node_modules/css-select
    svgo  1.0.0 - 1.3.2
    Depends on vulnerable versions of css-select
    node_modules/svgo
      @svgr/plugin-svgo  <=5.5.0
      Depends on vulnerable versions of svgo
      node_modules/@svgr/plugin-svgo
        @svgr/webpack  4.0.0 - 5.5.0
        Depends on vulnerable versions of @svgr/plugin-svgo
        node_modules/@svgr/webpack
          react-scripts  >=2.1.4
          Depends on vulnerable versions of @svgr/webpack
          node_modules/react-scripts
```

`react-scripts` probably won't be ever updated: https://github.com/facebook/create-react-app/issues/11174.

So we're fixing `nth-check` version.

The major breaking change between 1.x and 2.x is the updated way to export: https://github.com/fb55/nth-check/releases/tag/v2.0.0.
But it should work for us due to webpack magic.

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
