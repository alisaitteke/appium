#!/usr/bin/env node
"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.main = main;

require("source-map-support/register");

var _logsink = require("./logsink");

var _logger = _interopRequireDefault(require("./logger"));

var _lodash = _interopRequireDefault(require("lodash"));

var _appiumBaseDriver = require("appium-base-driver");

var _asyncbox = require("asyncbox");

var _parser = _interopRequireWildcard(require("./parser"));

var _config = require("./config");

var _appium = require("./appium");

var _gridRegister = _interopRequireDefault(require("./grid-register"));

var _utils = require("./utils");

async function preflightChecks(parser, args, throwInsteadOfExit = false) {
  try {
    (0, _config.checkNodeOk)();

    if (args.longStacktrace) {
      require('longjohn').async_trace_limit = -1;
    }

    if (args.showConfig) {
      await (0, _config.showConfig)();
      process.exit(0);
    }

    (0, _config.warnNodeDeprecations)();
    (0, _config.validateServerArgs)(parser, args);

    if (args.tmpDir) {
      await (0, _config.validateTmpDir)(args.tmpDir);
    }
  } catch (err) {
    _logger.default.error(err.message.red);

    if (throwInsteadOfExit) {
      throw err;
    }

    process.exit(1);
  }
}

function logDeprecationWarning(deprecatedArgs) {
  _logger.default.warn('Deprecated server args:');

  for (let [arg, realArg] of _lodash.default.toPairs(deprecatedArgs)) {
    _logger.default.warn(`  ${arg.red} => ${realArg}`);
  }
}

function logNonDefaultArgsWarning(args) {
  _logger.default.info('Non-default server args:');

  (0, _utils.inspectObject)(args);
}

function logDefaultCapabilitiesWarning(caps) {
  _logger.default.info('Default capabilities, which will be added to each request ' + 'unless overridden by desired capabilities:');

  (0, _utils.inspectObject)(caps);
}

async function logStartupInfo(parser, args) {
  let welcome = `Welcome to Appium v${_config.APPIUM_VER}`;
  let appiumRev = await (0, _config.getGitRev)();

  if (appiumRev) {
    welcome += ` (REV ${appiumRev})`;
  }

  _logger.default.info(welcome);

  let showArgs = (0, _config.getNonDefaultArgs)(parser, args);

  if (_lodash.default.size(showArgs)) {
    logNonDefaultArgsWarning(showArgs);
  }

  let deprecatedArgs = (0, _config.getDeprecatedArgs)(parser, args);

  if (_lodash.default.size(deprecatedArgs)) {
    logDeprecationWarning(deprecatedArgs);
  }

  if (!_lodash.default.isEmpty(args.defaultCapabilities)) {
    logDefaultCapabilitiesWarning(args.defaultCapabilities);
  }
}

function logServerPort(address, port) {
  let logMessage = `Appium REST http interface listener started on ` + `${address}:${port}`;

  _logger.default.info(logMessage);
}

async function main(args = null) {
  let parser = (0, _parser.default)();
  let throwInsteadOfExit = false;

  if (args) {
    args = Object.assign({}, (0, _parser.getDefaultArgs)(), args);

    if (args.throwInsteadOfExit) {
      throwInsteadOfExit = true;
      delete args.throwInsteadOfExit;
    }
  } else {
    args = parser.parseArgs();
  }

  await (0, _logsink.init)(args);
  await preflightChecks(parser, args, throwInsteadOfExit);
  await logStartupInfo(parser, args);
  let appiumDriver = new _appium.AppiumDriver(args);
  let routeConfiguringFunction = (0, _appiumBaseDriver.routeConfiguringFunction)(appiumDriver);
  let server = await (0, _appiumBaseDriver.server)({
    routeConfiguringFunction,
    port: args.port,
    hostname: args.address,
    allowCors: args.allowCors,
    basePath: args.basePath
  });

  if (args.allowCors) {
    _logger.default.warn('You have enabled CORS requests from any host. Be careful not ' + 'to visit sites which could maliciously try to start Appium ' + 'sessions on your machine');
  }

  appiumDriver.server = server;

  try {
    if (args.nodeconfig !== null) {
      await (0, _gridRegister.default)(args.nodeconfig, args.address, args.port);
    }
  } catch (err) {
    await server.close();
    throw err;
  }

  process.once('SIGINT', async function onSigint() {
    _logger.default.info(`Received SIGINT - shutting down`);

    await server.close();
  });
  process.once('SIGTERM', async function onSigterm() {
    _logger.default.info(`Received SIGTERM - shutting down`);

    await server.close();
  });
  logServerPort(args.address, args.port);
  return server;
}

if (require.main === module) {
  (0, _asyncbox.asyncify)(main);
}require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tYWluLmpzIl0sIm5hbWVzIjpbInByZWZsaWdodENoZWNrcyIsInBhcnNlciIsImFyZ3MiLCJ0aHJvd0luc3RlYWRPZkV4aXQiLCJsb25nU3RhY2t0cmFjZSIsInJlcXVpcmUiLCJhc3luY190cmFjZV9saW1pdCIsInNob3dDb25maWciLCJwcm9jZXNzIiwiZXhpdCIsInRtcERpciIsImVyciIsImxvZ2dlciIsImVycm9yIiwibWVzc2FnZSIsInJlZCIsImxvZ0RlcHJlY2F0aW9uV2FybmluZyIsImRlcHJlY2F0ZWRBcmdzIiwid2FybiIsImFyZyIsInJlYWxBcmciLCJfIiwidG9QYWlycyIsImxvZ05vbkRlZmF1bHRBcmdzV2FybmluZyIsImluZm8iLCJsb2dEZWZhdWx0Q2FwYWJpbGl0aWVzV2FybmluZyIsImNhcHMiLCJsb2dTdGFydHVwSW5mbyIsIndlbGNvbWUiLCJBUFBJVU1fVkVSIiwiYXBwaXVtUmV2Iiwic2hvd0FyZ3MiLCJzaXplIiwiaXNFbXB0eSIsImRlZmF1bHRDYXBhYmlsaXRpZXMiLCJsb2dTZXJ2ZXJQb3J0IiwiYWRkcmVzcyIsInBvcnQiLCJsb2dNZXNzYWdlIiwibWFpbiIsIk9iamVjdCIsImFzc2lnbiIsInBhcnNlQXJncyIsImFwcGl1bURyaXZlciIsIkFwcGl1bURyaXZlciIsInJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbiIsInNlcnZlciIsImhvc3RuYW1lIiwiYWxsb3dDb3JzIiwiYmFzZVBhdGgiLCJub2RlY29uZmlnIiwiY2xvc2UiLCJvbmNlIiwib25TaWdpbnQiLCJvblNpZ3Rlcm0iLCJtb2R1bGUiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7OztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUdBLGVBQWVBLGVBQWYsQ0FBZ0NDLE1BQWhDLEVBQXdDQyxJQUF4QyxFQUE4Q0Msa0JBQWtCLEdBQUcsS0FBbkUsRUFBMEU7QUFDeEUsTUFBSTtB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QixJQUF4QixFQUE4QjtBQUM1QixZQUFNLDJCQUFhaEQsSUFBSSxDQUFDZ0QsVUFBbEIsRUFBOEJoRCxJQUFJLENBQUNrQyxPQUFuQyxFQUE0Q2xDLElBQUksQ0FBQ21DLElBQWpELENBQU47QUFDRDtBQUNGLEdBUkQsQ0FRRSxPQUFPMUIsR0FBUCxFQUFZO0FBQ1osVUFBTW1DLE1BQU0sQ0FBQ0ssS0FBUCxFQUFOO0FBQ0EsVUFBTXhDLEdBQU47QUFDRDs7QUFFREgsRUFBQUEsT0FBTyxDQUFDNEMsSUFBUixDQUFhLFFBQWIsRUFBdUIsZUFBZUMsUUFBZixHQUEyQjtBQUNoRHpDLG9CQUFPWSxJQUFQLENBQWEsaUNBQWI7O0FBQ0EsVUFBTXNCLE1BQU0sQ0FBQ0ssS0FBUCxFQUFOO0FBQ0QsR0FIRDtBQUtBM0MsRUFBQUEsT0FBTyxDQUFDNEMsSUFBUixDQUFhLFNBQWIsRUFBd0IsZUFBZUUsU0FBZixHQUE0QjtBQUNsRDFDLG9CQUFPWSxJQUFQLENBQWEsa0NBQWI7O0FBQ0EsVUFBTXNCLE1BQU0sQ0FBQ0ssS0FBUCxFQUFOO0FBQ0QsR0FIRDtBQUtBaEIsRUFBQUEsYUFBYSxDQUFDakMsSUFBSSxDQUFDa0MsT0FBTixFQUFlbEMsSUFBSSxDQUFDbUMsSUFBcEIsQ0FBYjtBQUVBLFNBQU9TLE1BQVA7QUFDRDs7QUFFRCxJQUFJekMsT0FBTyxDQUFDa0MsSUFBUixLQUFpQmdCLE1BQXJCLEVBQTZCO0FBQzNCLDBCQUFTaEIsSUFBVDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuLy8gdHJhbnNwaWxlOm1haW5cblxuaW1wb3J0IHsgaW5pdCBhcyBsb2dzaW5rSW5pdCB9IGZyb20gJy4vbG9nc2luayc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4vbG9nZ2VyJzsgLy8gbG9nZ2VyIG5lZWRzIHRvIHJlbWFpbiBmaXJzdCBvZiBpbXBvcnRzXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgc2VydmVyIGFzIGJhc2VTZXJ2ZXIsIHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbiBhcyBtYWtlUm91dGVyIH0gZnJvbSAnYXBwaXVtLWJhc2UtZHJpdmVyJztcbmltcG9ydCB7IGFzeW5jaWZ5IH0gZnJvbSAnYXN5bmNib3gnO1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBnZXRQYXJzZXIsIGdldERlZmF1bHRBcmdzIH0gZnJvbSAnLi9wYXJzZXInO1xuaW1wb3J0IHsgc2hvd0NvbmZpZywgY2hlY2tOb2RlT2ssIHZhbGlkYXRlU2VydmVyQXJncyxcbiAgICAgICAgIHdhcm5Ob2RlRGVwcmVjYXRpb25zLCB2YWxpZGF0ZVRtcERpciwgZ2V0Tm9uRGVmYXVsdEFyZ3MsXG4gICAgICAgICBnZXREZXByZWNhdGVkQXJncywgZ2V0R2l0UmV2LCBBUFBJVU1fVkVSIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgQXBwaXVtRHJpdmVyIH0gZnJvbSAnLi9hcHBpdW0nO1xuaW1wb3J0IHJlZ2lzdGVyTm9kZSBmcm9tICcuL2dyaWQtcmVnaXN0ZXInO1xuaW1wb3J0IHsgaW5zcGVjdE9iamVjdCB9IGZyb20gJy4vdXRpbHMnO1xuXG5cbmFzeW5jIGZ1bmN0aW9uIHByZWZsaWdodENoZWNrcyAocGFyc2VyLCBhcmdzLCB0aHJvd0luc3RlYWRPZkV4aXQgPSBmYWxzZSkge1xuICB0cnkge1xuICAgIGNoZWNrTm9kZU9rKCk7XG4gICAgaWYgKGFyZ3MubG9uZ1N0YWNrdHJhY2UpIHtcbiAgICAgIHJlcXVpcmUoJ2xvbmdqb2huJykuYXN5bmNfdHJhY2VfbGltaXQgPSAtMTtcbiAgICB9XG4gICAgaWYgKGFyZ3Muc2hvd0NvbmZpZykge1xuICAgICAgYXdhaXQgc2hvd0NvbmZpZygpO1xuICAgICAgcHJvY2Vzcy5leGl0KDApO1xuICAgIH1cbiAgICB3YXJuTm9kZURlcHJlY2F0aW9ucygpO1xuICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgIGlmIChhcmdzLnRtcERpcikge1xuICAgICAgYXdhaXQgdmFsaWRhdGVUbXBEaXIoYXJncy50bXBEaXIpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nZ2VyLmVycm9yKGVyci5tZXNzYWdlLnJlZCk7XG4gICAgaWYgKHRocm93SW5zdGVhZE9mRXhpdCkge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBsb2dEZXByZWNhdGlvbldhcm5pbmcgKGRlcHJlY2F0ZWRBcmdzKSB7XG4gIGxvZ2dlci53YXJuKCdEZXByZWNhdGVkIHNlcnZlciBhcmdzOicpO1xuICBmb3IgKGxldCBbYXJnLCByZWFsQXJnXSBvZiBfLnRvUGFpcnMoZGVwcmVjYXRlZEFyZ3MpKSB7XG4gICAgbG9nZ2VyLndhcm4oYCAgJHthcmcucmVkfSA9PiAke3JlYWxBcmd9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbG9nTm9uRGVmYXVsdEFyZ3NXYXJuaW5nIChhcmdzKSB7XG4gIGxvZ2dlci5pbmZvKCdOb24tZGVmYXVsdCBzZXJ2ZXIgYXJnczonKTtcbiAgaW5zcGVjdE9iamVjdChhcmdzKTtcbn1cblxuZnVuY3Rpb24gbG9nRGVmYXVsdENhcGFiaWxpdGllc1dhcm5pbmcgKGNhcHMpIHtcbiAgbG9nZ2VyLmluZm8oJ0RlZmF1bHQgY2FwYWJpbGl0aWVzLCB3aGljaCB3aWxsIGJlIGFkZGVkIHRvIGVhY2ggcmVxdWVzdCAnICtcbiAgICAgICAgICAgICAgJ3VubGVzcyBvdmVycmlkZGVuIGJ5IGRlc2lyZWQgY2FwYWJpbGl0aWVzOicpO1xuICBpbnNwZWN0T2JqZWN0KGNhcHMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2dTdGFydHVwSW5mbyAocGFyc2VyLCBhcmdzKSB7XG4gIGxldCB3ZWxjb21lID0gYFdlbGNvbWUgdG8gQXBwaXVtIHYke0FQUElVTV9WRVJ9YDtcbiAgbGV0IGFwcGl1bVJldiA9IGF3YWl0IGdldEdpdFJldigpO1xuICBpZiAoYXBwaXVtUmV2KSB7XG4gICAgd2VsY29tZSArPSBgIChSRVYgJHthcHBpdW1SZXZ9KWA7XG4gIH1cbiAgbG9nZ2VyLmluZm8od2VsY29tZSk7XG5cbiAgbGV0IHNob3dBcmdzID0gZ2V0Tm9uRGVmYXVsdEFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgaWYgKF8uc2l6ZShzaG93QXJncykpIHtcbiAgICBsb2dOb25EZWZhdWx0QXJnc1dhcm5pbmcoc2hvd0FyZ3MpO1xuICB9XG4gIGxldCBkZXByZWNhdGVkQXJncyA9IGdldERlcHJlY2F0ZWRBcmdzKHBhcnNlciwgYXJncyk7XG4gIGlmIChfLnNpemUoZGVwcmVjYXRlZEFyZ3MpKSB7XG4gICAgbG9nRGVwcmVjYXRpb25XYXJuaW5nKGRlcHJlY2F0ZWRBcmdzKTtcbiAgfVxuICBpZiAoIV8uaXNFbXB0eShhcmdzLmRlZmF1bHRDYXBhYmlsaXRpZXMpKSB7XG4gICAgbG9nRGVmYXVsdENhcGFiaWxpdGllc1dhcm5pbmcoYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzKTtcbiAgfVxuICAvLyBUT0RPOiBicmluZyBiYWNrIGxvZ2xldmVsIHJlcG9ydGluZyBiZWxvdyBvbmNlIGxvZ2dlciBpcyBmbHVzaGVkIG91dFxuICAvLyBsb2dnZXIuaW5mbygnQ29uc29sZSBMb2dMZXZlbDogJyArIGxvZ2dlci50cmFuc3BvcnRzLmNvbnNvbGUubGV2ZWwpO1xuICAvLyBpZiAobG9nZ2VyLnRyYW5zcG9ydHMuZmlsZSkge1xuICAvLyAgIGxvZ2dlci5pbmZvKCdGaWxlIExvZ0xldmVsOiAnICsgbG9nZ2VyLnRyYW5zcG9ydHMuZmlsZS5sZXZlbCk7XG4gIC8vIH1cbn1cblxuZnVuY3Rpb24gbG9nU2VydmVyUG9ydCAoYWRkcmVzcywgcG9ydCkge1xuICBsZXQgbG9nTWVzc2FnZSA9IGBBcHBpdW0gUkVTVCBodHRwIGludGVyZmFjZSBsaXN0ZW5lciBzdGFydGVkIG9uIGAgK1xuICAgICAgICAgICAgICAgICAgIGAke2FkZHJlc3N9OiR7cG9ydH1gO1xuICBsb2dnZXIuaW5mbyhsb2dNZXNzYWdlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWFpbiAoYXJncyA9IG51bGwpIHtcbiAgbGV0IHBhcnNlciA9IGdldFBhcnNlcigpO1xuICBsZXQgdGhyb3dJbnN0ZWFkT2ZFeGl0ID0gZmFsc2U7XG4gIGlmIChhcmdzKSB7XG4gICAgLy8gYSBjb250YWluaW5nIHBhY2thZ2UgcGFzc2VkIGluIHRoZWlyIG93biBhcmdzLCBsZXQncyBmaWxsIHRoZW0gb3V0XG4gICAgLy8gd2l0aCBkZWZhdWx0c1xuICAgIGFyZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBnZXREZWZhdWx0QXJncygpLCBhcmdzKTtcblxuICAgIC8vIGlmIHdlIGhhdmUgYSBjb250YWluaW5nIHBhY2thZ2UgaW5zdGVhZCBvZiBydW5uaW5nIGFzIGEgQ0xJIHByb2Nlc3MsXG4gICAgLy8gdGhhdCBwYWNrYWdlIG1pZ2h0IG5vdCBhcHByZWNpYXRlIHVzIGNhbGxpbmcgJ3Byb2Nlc3MuZXhpdCcgd2lsbHktXG4gICAgLy8gbmlsbHksIHNvIGdpdmUgaXQgdGhlIG9wdGlvbiB0byBoYXZlIHVzIHRocm93IGluc3RlYWQgb2YgZXhpdFxuICAgIGlmIChhcmdzLnRocm93SW5zdGVhZE9mRXhpdCkge1xuICAgICAgdGhyb3dJbnN0ZWFkT2ZFeGl0ID0gdHJ1ZTtcbiAgICAgIC8vIGJ1dCByZW1vdmUgaXQgc2luY2UgaXQncyBub3QgYSByZWFsIHNlcnZlciBhcmcgcGVyIHNlXG4gICAgICBkZWxldGUgYXJncy50aHJvd0luc3RlYWRPZkV4aXQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSBwYXJzZSBmcm9tIENMSVxuICAgIGFyZ3MgPSBwYXJzZXIucGFyc2VBcmdzKCk7XG4gIH1cbiAgYXdhaXQgbG9nc2lua0luaXQoYXJncyk7XG4gIGF3YWl0IHByZWZsaWdodENoZWNrcyhwYXJzZXIsIGFyZ3MsIHRocm93SW5zdGVhZE9mRXhpdCk7XG4gIGF3YWl0IGxvZ1N0YXJ0dXBJbmZvKHBhcnNlciwgYXJncyk7XG4gIGxldCBhcHBpdW1Ecml2ZXIgPSBuZXcgQXBwaXVtRHJpdmVyKGFyZ3MpO1xuICBsZXQgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uID0gbWFrZVJvdXRlcihhcHBpdW1Ecml2ZXIpO1xuICBsZXQgc2VydmVyID0gYXdhaXQgYmFzZVNlcnZlcih7XG4gICAgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uLFxuICAgIHBvcnQ6IGFyZ3MucG9ydCxcbiAgICBob3N0bmFtZTogYXJncy5hZGRyZXNzLFxuICAgIGFsbG93Q29yczogYXJncy5hbGxvd0NvcnMsXG4gICAgYmFzZVBhdGg6IGFyZ3MuYmFzZVBhdGgsXG4gIH0pO1xuICBpZiAoYXJncy5hbGxvd0NvcnMpIHtcbiAgICBsb2dnZXIud2FybignWW91IGhhdmUgZW5hYmxlZCBDT1JTIHJlcXVlc3RzIGZyb20gYW55IGhvc3QuIEJlIGNhcmVmdWwgbm90ICcgK1xuICAgICAgICAgICAgICAgICd0byB2aXNpdCBzaXRlcyB3aGljaCBjb3VsZCBtYWxpY2lvdXNseSB0cnkgdG8gc3RhcnQgQXBwaXVtICcgK1xuICAgICAgICAgICAgICAgICdzZXNzaW9ucyBvbiB5b3VyIG1hY2hpbmUnKTtcbiAgfVxuICBhcHBpdW1Ecml2ZXIuc2VydmVyID0gc2VydmVyO1xuICB0cnkge1xuICAgIC8vIFRPRE8gcHJlbGF1bmNoIGlmIGFyZ3MubGF1bmNoIGlzIHNldFxuICAgIC8vIFRPRE86IHN0YXJ0QWxlcnRTb2NrZXQoc2VydmVyLCBhcHBpdW1TZXJ2ZXIpO1xuXG4gICAgLy8gY29uZmlndXJlIGFzIG5vZGUgb24gZ3JpZCwgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKGFyZ3Mubm9kZWNvbmZpZyAhPT0gbnVsbCkge1xuICAgICAgYXdhaXQgcmVnaXN0ZXJOb2RlKGFyZ3Mubm9kZWNvbmZpZywgYXJncy5hZGRyZXNzLCBhcmdzLnBvcnQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXdhaXQgc2VydmVyLmNsb3NlKCk7XG4gICAgdGhyb3cgZXJyO1xuICB9XG5cbiAgcHJvY2Vzcy5vbmNlKCdTSUdJTlQnLCBhc3luYyBmdW5jdGlvbiBvblNpZ2ludCAoKSB7XG4gICAgbG9nZ2VyLmluZm8oYFJlY2VpdmVkIFNJR0lOVCAtIHNodXR0aW5nIGRvd25gKTtcbiAgICBhd2FpdCBzZXJ2ZXIuY2xvc2UoKTtcbiAgfSk7XG5cbiAgcHJvY2Vzcy5vbmNlKCdTSUdURVJNJywgYXN5bmMgZnVuY3Rpb24gb25TaWd0ZXJtICgpIHtcbiAgICBsb2dnZXIuaW5mbyhgUmVjZWl2ZWQgU0lHVEVSTSAtIHNodXR0aW5nIGRvd25gKTtcbiAgICBhd2FpdCBzZXJ2ZXIuY2xvc2UoKTtcbiAgfSk7XG5cbiAgbG9nU2VydmVyUG9ydChhcmdzLmFkZHJlc3MsIGFyZ3MucG9ydCk7XG5cbiAgcmV0dXJuIHNlcnZlcjtcbn1cblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGFzeW5jaWZ5KG1haW4pO1xufVxuXG5leHBvcnQgeyBtYWluIH07XG4iXSwiZmlsZSI6ImxpYi9tYWluLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
