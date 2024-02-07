import path from "path";
import fs from "fs-extra";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { toString as mdastToString } from "mdast-util-to-string";
import { getPackages } from "@manypkg/get-packages";
import { Plugin } from "release-it";

export const BumpLevels = {
  dep: 0,
  patch: 1,
  minor: 2,
  major: 3,
};
export const BumpLevelLookup = ["dep", "patch", "minor", "major"];

export function getChangelogEntry(changelog, version) {
  let ast = unified().use(remarkParse).parse(changelog);

  let highestLevel = BumpLevels.dep;

  let nodes = ast.children;
  let headingStartInfo;
  let endIndex;

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (node.type === "heading") {
      let stringified = mdastToString(node);
      let match = stringified.toLowerCase().match(/(major|minor|patch)/);
      if (match !== null) {
        let level = BumpLevels[match[0]];
        highestLevel = Math.max(level, highestLevel);
      }
      if (headingStartInfo === undefined && stringified === version) {
        headingStartInfo = {
          index: i,
          depth: node.depth,
        };
        continue;
      }
      if (
        endIndex === undefined &&
        headingStartInfo !== undefined &&
        headingStartInfo.depth === node.depth
      ) {
        endIndex = i;
        break;
      }
    }
  }
  if (headingStartInfo) {
    ast.children = ast.children.slice(headingStartInfo.index + 1, endIndex);
  }
  return {
    content: unified().use(remarkStringify).stringify(ast),
    highestLevel: highestLevel,
  };
}

export default class ChangesetPlugin extends Plugin {
  async init() {
    this.log.info("Validating changeset status");
    await this.exec("npx changeset status");
    try {
      this.log.info("Checking difference between head and upstream");
      await this.exec("test -z $(git diff @ @{upstream})");
    } catch (e) {
      this.log.error(
        "HEAD must be up to date with upstream, please push or pull your changes"
      );
      throw e;
    }
  }
  beforeBump() {}
  async getChangelog() {
    this.log.info("Collecting changesets and bumping version(s) with: $ npx changeset version");
    await this.exec("npx changeset version");

    this.log.info("Collecting workspace information");
    const { packages } = await getPackages(process.cwd());
    let onlyContent = false;
    let newVersion;
    for (const pkg of packages) {
      this.log.info(`Parsing ${pkg.relativeDir}/package.json to get new version`);
      const packageVersion = pkg.packageJson.version;
      if (packageVersion) {
        if (!newVersion || newVersion === packageVersion) {
          newVersion = packageVersion;
          this.log.info(`Found new version in '${pkg.relativeDir}/': ${newVersion}`);
          this.setContext({ newVersion });
        } else {
          this.log.error(
            "This plugin doesn't support monorepos with different package versions",
            "due to how release-it works. You'll either need to set all packages",
            "to the same version and set them to \"fixed\" in your changeset config,",
            "or have only one workspace package with a version in the package.json",
            "and ignore all other packages in your changeset config",
          );
          throw new Error("Unsupported monorepo versions");
        }
      }
      this.log.info("Parsing changelog file for new entry");
      const changelogFileName = path.join(pkg.relativeDir, "CHANGELOG.md");
      const changelog = await fs.readFile(changelogFileName, "utf8");
      const { content } = getChangelogEntry(changelog, newVersion);
      if (packages.length === 1) {
        this.log.info("This is a single package, returning changelog contents to be handled by release-it");
        onlyContent = content;
      }
    }
    return onlyContent;
  }
  async getIncrementedVersion() {
    const { newVersion } = this.getContext();
    if (some(newVersion)) {
      return newVersion;
    } else {
      return false;
    }
  }
}
function some(thing) {
  return thing !== undefined && thing !== null;
}
