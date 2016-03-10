'use strict';

var _ = require('lodash');
var path = require('path');
var fs = require('fs-extra');
var sh = require('shelljs');
var Yaml = require('yamljs');

packtree.describe = ['packtree <file> [options]', 'Convert a YAML-formatted package dependency tree into .deb metapackages using FPM'];

packtree.options = {
  dryrun: {
    describe: "Don't actually generate the packages, just output some details about what would be run."
  },
  arch: {
    alias: 'a',
    describe: "The architecture name. Usually matches 'uname -m'. For automatic values, you can use '-a all' or '-a native'. These two strings will be translated into the correct value for your platform and target package type."
  },
  iteration: {
    alias: 't',
    describe: "Specify a default iteration, otherwise none specified."
  },
  output: {
    alias: "o",
    describe: "Destination directory for created packages. If not specified, defaults to '.'"
  }
};

function packtree(argv, options) {
  var file = options.file;
  var tree = Yaml.load(path.resolve(file));

  if (!options.dryrun) {
    if (!sh.which('fpm')) {
      throw new Error('FPM could not be found, is it installed? If not, try \'gem install fpm\'\n');
    }
    if (options.output) {
      fs.ensureDirSync(options.output);
      sh.cd(options.output);
    }
  }

  _.forEach(tree, function (spec, name) {
    createPackage(name, spec, options);
  });
}

function createPackage(name, spec, options) {
  console.log(name);
  console.log('  version:', spec.version);

  var cmd = [
    'fpm',
    '-s', 'empty',
    '-t', 'deb',
    '-n', name,
    '-v', spec.version
  ];

  if (options.arch) {
    cmd.push('--architecture');
    cmd.push(options.arch);
  }

  if (options.iteration) {
    cmd.push('--iteration');
    cmd.push(options.iteration);
  }

  console.log('  dependencies:');
  _.forEach(spec.dependencies, function (dep) {
    console.log('    ' + dep);
    cmd.push('-d');
    cmd.push(dep);
  });

  if (options.dryrun) {
    console.log('  command:', cmd.join(' '));
  } else {
    sh.exec(cmd.join(' '), {async: false});
  }
  console.log();
}

module.exports = packtree;
