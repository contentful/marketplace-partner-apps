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
