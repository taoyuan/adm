'use strict';

var _ = require('lodash');
var path = require('path');
var fs = require('fs-extra');
var util = require('util');
var ndir = require('node-dir');
var P = require('bluebird');
var chalk = require('chalk');
var Yaml = require('yamljs');

dist.describe = ['collect [options]', 'Convert a YAML-formatted package dependency tree into .deb metapackages using FPM'];

dist.options = {
  file: {
    alias: 'f',
    default: 'modules.yaml',
    describe: "The module file to dist"
  },
  output: {
    alias: "o",
    default: 'dist',
    describe: "Destination directory for distribution packages. If not specified, defaults to '.dist'"
  },
  flat: {
    alias: 'F',
    describe: 'Collect to flat directory'
  },
  'gen-script': {
    alias: 'g',
    describe: 'Generate install script'
  }
};

function dist(argv, options) {
  var file = options.file || 'modules.yaml';
  var output = options.output || 'dist';
  if (fs.existsSync(output)) {
    fs.removeSync(output);
  }

  var mods = Yaml.load(path.resolve(file));

  var promise = P.all(_.map(mods, function (spec) {
    return move(spec, '..', output, options.flat);
  }));

  if (options['gen-script']) {
    return promise
      .each(function (result) {
        _.forEach(result, function (pkgs, name) {
          if (name === '-' || name === '_') name = '';
          generateScript(name, pkgs, output);
        });
      })
      .then(function () {
        console.log(chalk.green('Generated install script'));
      });
  }

  return promise;
}

function move(mod, source, dest, flat) {
  var result = {};

  return _move(mod).then(function () {
    return result;
  });

  function _move(mod, subdir) {
    subdir = subdir || '';

    if (Array.isArray(mod)) {
      return P.each(mod, function (m) {
        return _move(m, subdir)
      });
    } else if (typeof mod === 'object') {
      var keys = Object.keys(mod);
      return P.each(keys, function (key) {
        return _move(mod[key], path.join(subdir, key));
      });
    }

    var dir = path.join(source, subdir, mod, '.dist');
    if (!fs.existsSync(dir)) {
      console.log(chalk.yellow('WARN'), 'No dist folder found in', path.join(source, subdir, mod));
      return P.resolve();
    }

    return new P(function (resolve) {
      ndir.paths(dir, function (err, paths) {
        paths.files
          .filter(function (f) {
            return _.endsWith(f, '.deb');
          })
          .map(function (f) {
            var target, arch = '';
            var p1 = f.lastIndexOf('_');
            var p2 = f.lastIndexOf('.');
            if (p2 > p1 && p1 > -1) {
              arch = f.substring(p1 + 1, p2);
            }
            target = path.join(dest, arch, flat ? '' : subdir);
            fs.ensureDirSync(target);
            target = path.join(target, path.basename(f));
            console.log(chalk.green('Copying'), f, '->', target);
            fs.copySync(f, target);

            if (!arch) {
              arch = '-';
            }
            result[arch] = result[arch] || [];
            result[arch].push(flat ? path.basename(f) : path.join(subdir, path.basename(f)));
          });
        resolve();
      });
    });
  }
}

function generateScript(name, pkgs, dest) {
  var script = '#!/bin/bash\n';
  var template = 'sudo dpkg -i %s\n';
  var file = path.join(dest, name, 'install');
  _.forEach(pkgs, function (pkg) {
    script += util.format(template, pkg);
  });
  fs.writeFileSync(file, script, 'utf-8');
  fs.chmodSync(file, '0755');
}


module.exports = dist;
