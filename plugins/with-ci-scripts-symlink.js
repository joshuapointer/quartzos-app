// Expo config plugin: ensures ios/ci_scripts is a symlink pointing at the
// repo-root ci_scripts/ directory.
//
// Why: Xcode Cloud invokes ci_*.sh from ios/ci_scripts/ by convention, but
// `expo prebuild --clean` deletes ios/ before regenerating it. Keeping the
// real scripts at the repo root and symlinking from ios/ci_scripts means:
//   - the scripts survive prebuild
//   - they're easy to edit and review
//   - Xcode Cloud finds them at the path it expects
//
// This plugin runs during prebuild's "dangerous" phase so it executes
// AFTER ios/ has been (re)created.

const fs = require('fs');
const path = require('path');

const { withDangerousMod } = require('expo/config-plugins');

const withCiScriptsSymlink = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const iosRoot = cfg.modRequest.platformProjectRoot;
      const linkPath = path.join(iosRoot, 'ci_scripts');
      const target = path.relative(iosRoot, path.join(projectRoot, 'ci_scripts'));

      if (!fs.existsSync(path.join(projectRoot, 'ci_scripts'))) {
        throw new Error(
          '[with-ci-scripts-symlink] Repo-root ci_scripts/ is missing. ' +
            'Refusing to create a dangling symlink.'
        );
      }

      // Remove any pre-existing entry so we always end up with a fresh symlink.
      if (fs.existsSync(linkPath) || fs.lstatSync(linkPath, { throwIfNoEntry: false })) {
        fs.rmSync(linkPath, { recursive: true, force: true });
      }

      fs.symlinkSync(target, linkPath, 'dir');
      return cfg;
    },
  ]);
};

module.exports = withCiScriptsSymlink;
