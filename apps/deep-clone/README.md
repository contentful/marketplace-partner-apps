This project was bootstrapped with [Create Contentful App](https://github.com/contentful/create-contentful-app) and is partially based on [this repository](https://github.com/Your-Majesty/contentful-extension-deep-copy/tree/master) with the following improvements
- using app framework instead of UI Extension
- configuration page
- bug fixes

## Deep Cloning
Contentful's web app clones an entry but none of the referenced entries. This app performs a deep clone of all entries. Assets will not be cloned, but there may be a config option for it later. 

### Reusable Entry Tags
The app supports reusable entry tags, which allows you to mark certain entries as "reusable" rather than cloning them. When an entry has one of the selected reusable tags, it will be referenced in the cloned structure instead of being duplicated. This is useful for:
- Shared content that should remain centralized (e.g., common components, templates)
- Reference data that doesn't need to be duplicated
- Reducing content duplication and maintaining consistency

## Configuration page
Allows for
- appending text before or after the title field to differentiate between old and new entry
- enables automatic redirect after x number of milliseconds
- selecting reusable entry tags - entries with these tags will be referenced instead of cloned

<img width="747" alt="image" src="https://github.com/PattoCF/deep-clone/assets/59477906/488a21a8-1b4e-43d2-8593-c5ff920a0758">

## Sidebar App
Each content type needs to be configured with the sidebar app. It then shows a button that initiates the cloning process. Depending on config, the page redirects to the newly created top level entry.
