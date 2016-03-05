module.exports = function Command(command, npmModule) {
  return function(_options, loader) {

    var options = {
      env: process.env,
      stdio: 'inherit'
    };

    var resolvedCommand;
    try {
      resolvedCommand = require.resolve(npmModule + '/' + command);
    } catch (er) {
      var msg = 'Error running %s (%s), it may need installation,' +
        ' try `npm update -g adm`.';
      loader.error(msg, command, er.message);
    }

    // slice argv without `command`
    var argv = _options._.slice(1);

    // Transmit full original command name to children
    options.env.CMD = 'adm ' + process.env.ADM_COMMAND;

    // Build a new `argv` with full path for command
    // The first argv value should be the path to the node executable
    process.argv = [process.argv[0], resolvedCommand].concat(argv);
    require('module')._load(resolvedCommand, null, true);
  };
};
