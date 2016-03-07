'use strict';

var build = require('../command')('bin/adm-build', 'adm-build');
build.describe = ['build <target> [options]', 'Build and package project'];

module.exports = build;
