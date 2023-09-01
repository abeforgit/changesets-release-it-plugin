# changesets-release-it-plugin

> **Warning**
> This plugin is highly experimental, use at your own risk
> 
> In particular, this plugin does not yet properly support monorepos


The idea of this plugin is to combine the excellent changelog management from [changesets](https://github.com/changesets/changesets) with the 
nice and simple release management of [release-it](https://github.com/release-it/release-it).

My main gripe with changesets is their over-reliance on the provided github action to perform vital steps such as github releases.
I like the semi-manual approach that release-it takes, this makes the CI setup simpler as it can just focus on building the git tags.

This plugin essentially lets changesets generate the changelog and bump the package version, using `changeset version`, and then hands off to release-it for 
the remaining steps, using the parsed changelog and version that changesets decided on.

The changelog parsing is lifted verbatim from the [changesets github action](https://github.com/changesets/action/blob/main/src/utils.ts).

## Installation

```
npm install --save-dev changesets-release-it-plugin
```

## Setup
At the moment, the extra npm config is required, as changesets sets the version too early in the cycle, and the npm plugin doesn't realise the version has been updated.
I'm reasonably confident this can be improved with better use of the plugin lifecycles, but for now this will have to do.

```
"plugins": {
  "changesets-release-it-plugin": {}
}
"npm": {
  "ignoreVersion": true,
  "allowSameVersion": true
}
```
