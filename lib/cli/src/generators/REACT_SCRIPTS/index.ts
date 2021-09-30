import path from 'path';
import fs from 'fs';
import semver from '@storybook/semver';

import { baseGenerator, Generator } from '../baseGenerator';
import { CoreBuilder } from '../../project_types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  const extraMain = options.linkable
    ? {
        webpackFinal: `%%(config) => {
      const path = require('path');
      // add monorepo root as a valid directory to import modules from
      config.resolve.plugins.forEach((p) => {
        if (Array.isArray(p.appSrcs)) {
          p.appSrcs.push(path.join(__dirname, '..', '..', '..', 'storybook'));
        }
      });
      return config;
    }
    %%`,
      }
    : {};

  const craVersion = semver.coerce(
    packageManager.retrievePackageJson().dependencies['react-scripts']
  )?.version;
  const isCra5 = semver.gte(craVersion, '5.0.0');
  const updatedOptions = isCra5 ? { ...options, builder: CoreBuilder.Webpack5 } : options;
  const extraPackages = ['@storybook/node-logger'];
  if (isCra5) extraPackages.push('webpack');

  await baseGenerator(packageManager, npmOptions, updatedOptions, 'react', {
    extraAddons: ['@storybook/preset-create-react-app'],
    // `@storybook/preset-create-react-app` has `@storybook/node-logger` as peerDep
    extraPackages,
    staticDir: fs.existsSync(path.resolve('./public')) ? 'public' : undefined,
    addBabel: false,
    addESLint: true,
    extraMain,
  });
};

export default generator;
