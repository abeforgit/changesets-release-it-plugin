# changesets-release-it-plugin

> [!WARNING]
> This plugin is highly experimental, use at your own risk
> 
> In particular, only certain monorepo configurations are supported


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
NOTE: If you don't use the publish feature of the npm plugin, you can simply disable it since this plugin replaces the `npm version` call.

```
"plugins": {
  "changesets-release-it-plugin": {}
}
"npm": {
  "ignoreVersion": true,
  "allowSameVersion": true
}
```

## Monorepos

Due to the way that release-it handles tagging and releasing it is [only possible to support very constrained monorepo version configurations](https://github.com/release-it/release-it/blob/main/docs/recipes/monorepo.md).
There are two options that should work (it's also possible that a combination will work):

### All packages released under the same version number

For this set-up you will need to set the same version number in the `package.json` of each package in the workspace.
You then need to change your changesets configuration to have all of your packages in the `fixed` array.

Whenever you run release-it, all of the packages will be released with the new, same version number, each with their own changelog.
There will be one tag created with the new version number.

### Only one versioned package

If you have only one package in your workspace that you want to release, you can instead just version that and ignore the others.
You need to remove the version number from the `package.json` of all but the versioned package and add the non-versioned package names to the `ignore` array in the changeset configuration.

When you run release-it, you'll get a tag of the new version and any linked dependencies will be updated but there will be no changelog for the non-versioned packages.
