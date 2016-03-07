var path = require('path');
var fs = require('fs');
var Handlebars = require('handlebars');

alias.describe = ['alias <target> [options]', 'Create an alias app with custom options'];

function alias(argv, options) {
  argv = argv.slice(1);
  var cmd = process.argv[1];
  var dir = path.dirname(cmd);
  var target = path.join(dir, options.target);

  var content = fs.readFileSync(path.resolve(__dirname, 'alias.hbs'), 'utf-8');
  content = Handlebars.compile(content, {noEscape: true})({
    cmd: cmd,
    argv: JSON.stringify(argv),
    alias: options.target
  });

  fs.writeFileSync(target, content, {encoding: 'utf-8', mode: 0755});
  console.log(cmd, '->', target, argv.join(' '));
}

module.exports = alias;
