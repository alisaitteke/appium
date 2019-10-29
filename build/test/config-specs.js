"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _chai = _interopRequireDefault(require("chai"));

var _sinon = _interopRequireDefault(require("sinon"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _config = require("../lib/config");

var _parser = _interopRequireDefault(require("../lib/parser"));

var _logger = _interopRequireDefault(require("../lib/logger"));

var _appiumSupport = require("appium-support");

var _requestPromise = _interopRequireDefault(require("request-promise"));

let should = _chai.default.should();

_chai.default.use(_chaiAsPromised.default);

describe('Config', function () {
  describe('getGitRev', function () {
    it('should get a reasonable git revision', async function () {
      let rev = await (0, _config.getGitRev)();
      rev.should.be.a('string');
      rev.length.should.be.equal(40);
      rev.match(/[0-9a-f]+/i)[0].should.eql(rev);
    });
  });
  describe('Appium config', function () {
    describe('getBuildInfo', function () {
      async function verifyBuildInfoUpdate(useLocalGit) {
        const buildInfo = (0, _config.getBuildInfo)();
        mockFs.expects('exists').atLeast(1).returns(useLocalGit);
        buildInfo['git-sha'] = undefined;
        buildInfo.built = undefined;
        await (0, _config.updateBuildInfo)(true);
        buildInfo.should.be.an('object');
        should.exist(buildInfo['git-sha']);
        should.exist(buildInfo.built);
        should.exist(buildInfo.version);
      }

      let mockFs;
      let getStub;
      beforeEach(function () {
        mockFs = _sinon.default.mock(_appiumSupport.fs);
        getStub = _sinon.default.stub(_requestPromise.default, 'get');
      });
      afterEach(function () {
        getStub.restore();
        mockFs.restore();
      });
      it('should get a configuration object if the local git metadata is present', async function () {
        await verifyBuildInfoUpdate(true);
      });
      it('should get a configuration object if the local git metadata is not present', async function () {
        getStub.onCall(0).returns([{
          'name': `v${_config.APPIUM_VER}`,
          'zipball_url': 'https://api.github.com/repos/appium/appium/zipball/v1.9.0-beta.1',
          'tarball_url': 'https://api.github.com/repos/appium/appium/tarball/v1.9.0-beta.1',
          'commit': {
            'sha': '3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
            'url': 'https://api.github.com/repos/appium/appium/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c'
          },
          'node_id': 'MDM6UmVmNzUzMDU3MDp2MS45LjAtYmV0YS4x'
        }, {
          'name': 'v1.8.2-beta',
          'zipball_url': 'https://api.github.com/repos/appium/appium/zipball/v1.8.2-beta',
          'tarball_url': 'https://api.github.com/repos/appium/appium/tarball/v1.8.2-beta',
          'commit': {
            'sha': '5b98b9197e75aa85e7507d21d3126c1a63d1ce8f',
            'url': 'https://api.github.com/repos/appium/appium/commits/5b98b9197e75aa85e7507d21d3126c1a63d1ce8f'
          },
          'node_id': 'MDM6UmVmNzUzMDU3MDp2MS44LjItYmV0YQ=='
        }]);
        getStub.onCall(1).returns({
          'sha': '3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
          'node_id': 'MDY6Q29tbWl0NzUzMDU3MDozYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRj',
          'commit': {
            'author': {
              'name': 'Isaac Murchie',
              'email': 'isaac@saucelabs.com',
              'date': '2018-08-17T19:48:00Z'
            },
            'committer': {
              'name': 'Isaac Murchie',
              'email': 'isaac@saucelabs.com',
              'date': '2018-08-17T19:48:00Z'
            },
            'message': 'v1.9.0-beta.1',
            'tree': {
              'sha': '2c0974727470eba419ea0b9951c52f72f8036b18',
              'url': 'https://api.github.com/repos/appium/appium/git/trees/2c0974727470eba419ea0b9951c52f72f8036b18'
            },
            'url': 'https://api.github.com/repos/appium/appium/git/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
            'comment_count': 0,
            'verification': {
              'verified': false,
              'reason': 'unsigned',
              'signature': null,
              'payload': null
            }
          },
          'url': 'https://api.github.com/repos/appium/appium/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
          'html_url': 'https://github.com/appium/appium/commit/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c',
          'comments_url': 'https://api.github.com/repos/appium/appium/commits/3c2752f9f9c56000705a4ae15b3ba68a5d2e644c/comments'
        });
        await verifyBuildInfoUpdate(false);
      });
    });
    describe('showConfig', function () {
      before(function () {
        _sinon.default.spy(console, 'log');
      });
      it('should log the config to console', async function () {
        const config = (0, _config.getBuildInfo)();
        await (0, _config.showConfig)();
        console.log.calledOnce.should.be.true;
        console.log.getCall(0).args[0].should.contain(JSON.stringify(config));
      });
    });
  });
  describe('node.js config', function () {
    let _process = process;
    before(function () {
      let tempProcess = {};

      for (let [prop, value] of _lodash.default.toPairs(process)) {
        tempProcess[prop] = value;
      }

      process = tempProcess;
    });
    after(function () {
      process = _process;
    });
    describe('checkNodeOk', function () {
      describe('unsupported nodes', function () {
        const unsupportedVersions = ['v0.1', 'v0.9.12', 'v0.10.36', 'v0.12.14', 'v4.4.7', 'v5.7.0', 'v6.3.1', 'v7.1.1'];

        for (const version of unsupportedVersions) {
          it(`should fail if node is ${version}`, function () {
            process.version = version;

            _config.checkNodeOk.should.throw();
          });
        }
      });
      describe('supported nodes', function () {
        it('should succeed if node is 8+', function () {
          process.version = 'v8.1.2';

          _config.checkNodeOk.should.not.throw();
        });
        it('should succeed if node is 9+', function () {
          process.version = 'v9.1.2';

          _config.checkNodeOk.should.not.throw();
        });
        it('should succeed if node is 10+', function () {
          process.version = 'v10.0.1';

          _config.checkNodeOk.should.not.throw();
        });
        it('should succeed if node is 11+', function () {
          process.version = 'v11.6.0';

          _config.checkNodeOk.should.not.throw();
        });
      });
    });
    describe('warnNodeDeprecations', function () {
      let spy;
      before(function () {
        spy = _sinon.default.spy(_logger.default, 'warn');
      });
      beforeEach(function () {
        spy.resetHistory();
      });
      it('should not log a warning if node is 8+', function () {
        process.version = 'v8.0.0';
        (0, _config.warnNodeDeprecations)();

        _logger.default.warn.callCount.should.equal(0);
      });
      it('should not log a warning if node is 9+', function () {
        process.version = 'v9.0.0';
        (0, _config.warnNodeDeprecations)();

        _logger.default.warn.callCount.should.equal(0);
      });
    });
  });
  describe('server arguments', function () {
    let parser = (0, _parser.default)();
    parser.debug = true;
    let args = {};
    beforeEach(function () {
      for (let rawArg of parser.rawArgs) {
        args[rawArg[1].dest] = rawArg[1].defaultValue;
      }
    });
    describe('getNonDefaultArgs', function () {
      it('should show none if we have all the defaults', function () {
        let nonDefaultArgs = (0, _config.getNonDefaultArgs)(parser, args);

        _lodash.default.keys(nonDefaultArgs).length.should.equal(0);
      });
      it('should catch a non-default argument', function () {
        args.isolateSimDevice = true;
        let nonDefaultArgs = (0, _config.getNonDefaultArgs)(parser, args);

        _lodash.default.keys(nonDefaultArgs).length.should.equal(1);

        should.exist(nonDefaultArgs.isolateSimDevice);
      });
    });
    describe('getDeprecatedArgs', function () {
      it('should show none if we have no deprecated arguments', function () {
        let deprecatedArgs = (0, _config.getDeprecatedArgs)(parser, args);

        _lodash.default.keys(deprecatedArgs).length.should.equal(0);
      });
      it('should catch a deprecated argument', function () {
        args.showIOSLog = true;
        let deprecatedArgs = (0, _config.getDeprecatedArgs)(parser, args);

        _lodash.default.keys(deprecatedArgs).length.should.equal(1);

        should.exist(deprecatedArgs['--show-ios-log']);
      });
      it('should catch a non-boolean deprecated argument', function () {
        args.calendarFormat = 'orwellian';
        let deprecatedArgs = (0, _config.getDeprecatedArgs)(parser, args);

        _lodash.default.keys(deprecatedArgs).length.should.equal(1);

        should.exist(deprecatedArgs['--calendar-format']);
      });
    });
  });
  describe('checkValidPort', function () {
    it('should be false for port too high', function () {
      (0, _config.checkValidPort)(65536).should.be.false;
    });
    it('should be false for port too low', function () {
      (0, _config.checkValidPort)(0).should.be.false;
    });
    it('should be true for port 1', function () {
      (0, _config.checkValidPort)(1).should.be.true;
    });
    it('should be true for port 65535', function () {
      (0, _config.checkValidPort)(65535).should.be.true;
    });
  });
  describe('validateTmpDir', function () {
    it('should fail to use a tmp dir with incorrect permissions', function () {
      (0, _config.validateTmpDir)('/private/if_you_run_with_sudo_this_wont_fail').should.be.rejectedWith(/could not ensure/);
    });
    it('should fail to use an undefined tmp dir', function () {
      (0, _config.validateTmpDir)().should.be.rejectedWith(/could not ensure/);
    });
    it('should be able to use a tmp dir with correct permissions', function () {
      (0, _config.validateTmpDir)('/tmp/test_tmp_dir/with/any/number/of/levels').should.not.be.rejected;
    });
  });
  describe('parsing args with empty argv[1]', function () {
    let argv1;
    before(function () {
      argv1 = process.argv[1];
    });
    after(function () {
      process.argv[1] = argv1;
    });
    it('should not fail if process.argv[1] is undefined', function () {
      process.argv[1] = undefined;
      let args = (0, _parser.default)();
      args.prog.should.be.equal('Appium');
    });
    it('should set "prog" to process.argv[1]', function () {
      process.argv[1] = 'Hello World';
      let args = (0, _parser.default)();
      args.prog.should.be.equal('Hello World');
    });
  });
  describe('validateServerArgs', function () {
    let parser = (0, _parser.default)();
    parser.debug = true;
    const defaultArgs = {};

    for (let rawArg of parser.rawArgs) {
      defaultArgs[rawArg[1].dest] = rawArg[1].defaultValue;
    }

    let args = {};
    beforeEach(function () {
      args = _lodash.default.clone(defaultArgs);
    });
    describe('mutually exclusive server arguments', function () {
      describe('noReset and fullReset', function () {
        it('should not allow both', function () {
          (() => {
            args.noReset = args.fullReset = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow noReset', function () {
          (() => {
            args.noReset = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow fullReset', function () {
          (() => {
            args.fullReset = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('ipa and safari', function () {
        it('should not allow both', function () {
          (() => {
            args.ipa = args.safari = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow ipa', function () {
          (() => {
            args.ipa = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow safari', function () {
          (() => {
            args.safari = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('app and safari', function () {
        it('should not allow both', function () {
          (() => {
            args.app = args.safari = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow app', function () {
          (() => {
            args.app = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('forceIphone and forceIpad', function () {
        it('should not allow both', function () {
          (() => {
            args.forceIphone = args.forceIpad = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow forceIphone', function () {
          (() => {
            args.forceIphone = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow forceIpad', function () {
          (() => {
            args.forceIpad = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
      describe('deviceName and defaultDevice', function () {
        it('should not allow both', function () {
          (() => {
            args.deviceName = args.defaultDevice = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should allow deviceName', function () {
          (() => {
            args.deviceName = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should allow defaultDevice', function () {
          (() => {
            args.defaultDevice = true;
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
    });
    describe('validated arguments', function () {
      describe('backendRetries', function () {
        it('should fail with value less than 0', function () {
          args.backendRetries = -1;
          (() => {
            (0, _config.validateServerArgs)(parser, args);
          }).should.throw();
        });
        it('should succeed with value of 0', function () {
          args.backendRetries = 0;
          (() => {
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
        it('should succeed with value above 0', function () {
          args.backendRetries = 100;
          (() => {
            (0, _config.validateServerArgs)(parser, args);
          }).should.not.throw();
        });
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvY29uZmlnLXNwZWNzLmpzIl0sIm5hbWVzIjpbInNob3VsZCIsImNoYWkiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsImRlc2NyaWJlIiwiaXQiLCJyZXYiLCJiZSIsImEiLCJsZW5ndGgiLCJlcXVhbCIsIm1hdGNoIiwiZXFsIiwidmVyaWZ5QnVpbGRJbmZvVXBkYXRlIiwidXNlTG9jYWxHaXQiLCJidWlsZEluZm8iLCJtb2NrRnMiLCJleHBlY3RzIiwiYXRMZWFzdCIsInJldHVybnMiLCJ1bmRlZmluZWQiLCJidWlsdCIsImFuIiwiZXhpc3QiLCJ2ZXJzaW9uIiwiZ2V0U3R1YiIsImJlZm9yZUVhY2giLCJzaW5vbiIsIm1vY2siLCJmcyIsInN0dWIiLCJyZXF1ZXN0IiwiYWZ0ZXJFYWNoIiwicmVzdG9yZSIsIm9uQ2FsbCIsIkFQUElVTV9WRVIiLCJiZWZvcmUiLCJzcHkiLCJjb25zb2xlIiwiY29uZmlnIiwibG9nIiwiY2FsbGVkT25jZSIsInRydWUiLCJnZXRDYWxsIiwiYXJncyIsImNvbnRhaW4iLCJKU09OIiwic3RyaW5naWZ5IiwiX3Byb2Nlc3MiLCJwcm9jZXNzIiwidGVtcFByb2Nlc3MiLCJwcm9wIiwidmFsdWUiLCJfIiwidG9QYWlycyIsImFmdGVyIiwidW5zdXBwb3J0ZWRWZXJzaW9ucyIsImNoZWNrTm9kZU9rIiwidGhyb3ciLCJub3QiLCJsb2dnZXIiLCJyZXNldEhpc3RvcnkiLCJ3YXJuIiwiY2FsbENvdW50IiwicGFyc2VyIiwiZGVidWciLCJyYXdBcmciLCJyYXdBcmdzIiwiZGVzdCIsImRlZmF1bHRWYWx1ZSIsIm5vbkRlZmF1bHRBcmdzIiwia2V5cyIsImlzb2xhdGVTaW1EZXZpY2UiLCJkZXByZWNhdGVkQXJncyIsInNob3dJT1NMb2ciLCJjYWxlbmRhckZvcm1hdCIsImZhbHNlIiwicmVqZWN0ZWRXaXRoIiwicmVqZWN0ZWQiLCJhcmd2MSIsImFyZ3YiLCJwcm9nIiwiZGVmYXVsdEFyZ3MiLCJjbG9uZSIsIm5vUmVzZXQiLCJmdWxsUmVzZXQiLCJpcGEiLCJzYWZhcmkiLCJhcHAiLCJmb3JjZUlwaG9uZSIsImZvcmNlSXBhZCIsImRldmljZU5hbWUiLCJkZWZhdWx0RGV2aWNlIiwiYmFja2VuZFJldHJpZXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUlBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLElBQUlBLE1BQU0sR0FBR0MsY0FBS0QsTUFBTCxFQUFiOztBQUNBQyxjQUFLQyxHQUFMLENBQVNDLHVCQUFUOztBQUdBQyxRQUFRLENBQUMsUUFBRCxFQUFXLFlBQVk7QUFDN0JBLEVBQUFBLFFBQVEsQ0FBQyxXQUFELEVBQWMsWUFBWTtBQUNoQ0MsSUFBQUEsRUFBRSxDQUFDLHNDQUFELEVBQXlDLGtCQUFrQjtBQUMzRCxVQUFJQyxHQUFHLEdBQUcsTUFBTSx3QkFBaEI7QUFDQUEsTUFBQUEsR0FBRyxDQUFDTixNQUFKLENBQVdPLEVBQVgsQ0FBY0MsQ0FBZCxDQUFnQixRQUFoQjtBQUNBRixNQUFBQSxHQUFHLENBQUNHLE1BQUosQ0FBV1QsTUFBWCxDQUFrQk8sRUFBbEIsQ0FBcUJHLEtBQXJCLENBQTJCLEVBQTNCO0FBQ0FKLE1BQUFBLEdBQUcsQ0FBQ0ssS0FBSixDQUFVLFlBQVYsRUFBd0IsQ0FBeEIsRUFBMkJYLE1BQTNCLENBQWtDWSxHQUFsQyxDQUFzQ04sR0FBdEM7QUFDRCxLQUxDLENBQUY7QUFNRCxHQVBPLENBQVI7QUFTQUYsRUFBQUEsUUFBUSxDQUFDLGVBQUQsRUFBa0IsWUFBWTtBQUNwQ0EsSUFBQUEsUUFBUSxDQUFDLGNBQUQsRUFBaUIsWUFBWTtBQUNuQyxxQkFBZVMscUJBQWYsQ0FBc0NDLFdBQXRDLEVBQW1EO0FBQ2pELGNBQU1DLFNBQVMsR0FBRywyQkFBbEI7QUFDQUMsUUFBQUEsTUFBTSxDQUFDQyxPQUFQLENBQWUsUUFBZixFQUF5QkMsT0FBekIsQ0FBaUMsQ0FBakMsRUFBb0NDLE9BQXBDLENBQTRDTCxXQUE1QztBQUNBQyxRQUFBQSxTQUFT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RCxHQUFuRCxDQUF1REQsS0FBdkQ7QUFDRCxTQUhDLENBQUY7QUFJRCxPQWJPLENBQVI7QUFjRCxLQWpCTyxDQUFSO0FBa0JELEdBOUhPLENBQVI7QUErSEQsQ0FoWk8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5pbXBvcnQgc2lub24gZnJvbSAnc2lub24nO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHsgZ2V0R2l0UmV2LCBnZXRCdWlsZEluZm8sIGNoZWNrTm9kZU9rLCB3YXJuTm9kZURlcHJlY2F0aW9ucyxcbiAgICAgICAgIGdldE5vbkRlZmF1bHRBcmdzLCBnZXREZXByZWNhdGVkQXJncywgdmFsaWRhdGVTZXJ2ZXJBcmdzLFxuICAgICAgICAgdmFsaWRhdGVUbXBEaXIsIHNob3dDb25maWcsIGNoZWNrVmFsaWRQb3J0LCB1cGRhdGVCdWlsZEluZm8sXG4gICAgICAgICBBUFBJVU1fVkVSIH0gZnJvbSAnLi4vbGliL2NvbmZpZyc7XG5pbXBvcnQgZ2V0UGFyc2VyIGZyb20gJy4uL2xpYi9wYXJzZXInO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi9saWIvbG9nZ2VyJztcbmltcG9ydCB7IGZzIH0gZnJvbSAnYXBwaXVtLXN1cHBvcnQnO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdC1wcm9taXNlJztcblxubGV0IHNob3VsZCA9IGNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cblxuZGVzY3JpYmUoJ0NvbmZpZycsIGZ1bmN0aW9uICgpIHtcbiAgZGVzY3JpYmUoJ2dldEdpdFJldicsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGdldCBhIHJlYXNvbmFibGUgZ2l0IHJldmlzaW9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHJldiA9IGF3YWl0IGdldEdpdFJldigpO1xuICAgICAgcmV2LnNob3VsZC5iZS5hKCdzdHJpbmcnKTtcbiAgICAgIHJldi5sZW5ndGguc2hvdWxkLmJlLmVxdWFsKDQwKTtcbiAgICAgIHJldi5tYXRjaCgvWzAtOWEtZl0rL2kpWzBdLnNob3VsZC5lcWwocmV2KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0FwcGl1bSBjb25maWcnLCBmdW5jdGlvbiAoKSB7XG4gICAgZGVzY3JpYmUoJ2dldEJ1aWxkSW5mbycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzeW5jIGZ1bmN0aW9uIHZlcmlmeUJ1aWxkSW5mb1VwZGF0ZSAodXNlTG9jYWxHaXQpIHtcbiAgICAgICAgY29uc3QgYnVpbGRJbmZvID0gZ2V0QnVpbGRJbmZvKCk7XG4gICAgICAgIG1vY2tGcy5leHBlY3RzKCdleGlzdHMnKS5hdExlYXN0KDEpLnJldHVybnModXNlTG9jYWxHaXQpO1xuICAgICAgICBidWlsZEluZm9bJ2dpdC1zaGEnXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgYnVpbGRJbmZvLmJ1aWx0ID0gdW5kZWZpbmVkO1xuICAgICAgICBhd2FpdCB1cGRhdGVCdWlsZEluZm8odHJ1ZSk7XG4gICAgICAgIGJ1aWxkSW5mby5zaG91bGQuYmUuYW4oJ29iamVjdCcpO1xuICAgICAgICBzaG91bGQuZXhpc3QoYnVpbGRJbmZvWydnaXQtc2hhJ10pO1xuICAgICAgICBzaG91bGQuZXhpc3QoYnVpbGRJbmZvLmJ1aWx0KTtcbiAgICAgICAgc2hvdWxkLmV4aXN0KGJ1aWxkSW5mby52ZXJzaW9uKTtcbiAgICAgIH1cblxuICAgICAgbGV0IG1vY2tGcztcbiAgICAgIGxldCBnZXRTdHViO1xuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tGcyA9IHNpbm9uLm1vY2soZnMpO1xuICAgICAgICBnZXRTdHViID0gc2lub24uc3R1YihyZXF1ZXN0LCAnZ2V0Jyk7XG4gICAgICB9KTtcbiAgICAgIGFmdGVyRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGdldFN0dWIucmVzdG9yZSgpO1xuICAgICAgICBtb2NrRnMucmVzdG9yZSgpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZ2V0IGEgY29uZmlndXJhdGlvbiBvYmplY3QgaWYgdGhlIGxvY2FsIGdpdCBtZXRhZGF0YSBpcyBwcmVzZW50JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhd2FpdCB2ZXJpZnlCdWlsZEluZm9VcGRhdGUodHJ1ZSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgZ2V0IGEgY29uZmlndXJhdGlvbiBvYmplY3QgaWYgdGhlIGxvY2FsIGdpdCBtZXRhZGF0YSBpcyBub3QgcHJlc2VudCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZ2V0U3R1Yi5vbkNhbGwoMCkucmV0dXJucyhbXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ25hbWUnOiBgdiR7QVBQSVVNX1ZFUn1gLFxuICAgICAgICAgICAgJ3ppcGJhbGxfdXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS96aXBiYWxsL3YxLjkuMC1iZXRhLjEnLFxuICAgICAgICAgICAgJ3RhcmJhbGxfdXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS90YXJiYWxsL3YxLjkuMC1iZXRhLjEnLFxuICAgICAgICAgICAgJ2NvbW1pdCc6IHtcbiAgICAgICAgICAgICAgJ3NoYSc6ICczYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRjJyxcbiAgICAgICAgICAgICAgJ3VybCc6ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2FwcGl1bS9hcHBpdW0vY29tbWl0cy8zYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRjJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdub2RlX2lkJzogJ01ETTZVbVZtTnpVek1EVTNNRHAyTVM0NUxqQXRZbVYwWVM0eCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICduYW1lJzogJ3YxLjguMi1iZXRhJyxcbiAgICAgICAgICAgICd6aXBiYWxsX3VybCc6ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2FwcGl1bS9hcHBpdW0vemlwYmFsbC92MS44LjItYmV0YScsXG4gICAgICAgICAgICAndGFyYmFsbF91cmwnOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9hcHBpdW0vYXBwaXVtL3RhcmJhbGwvdjEuOC4yLWJldGEnLFxuICAgICAgICAgICAgJ2NvbW1pdCc6IHtcbiAgICAgICAgICAgICAgJ3NoYSc6ICc1Yjk4YjkxOTdlNzVhYTg1ZTc1MDdkMjFkMzEyNmMxYTYzZDFjZThmJyxcbiAgICAgICAgICAgICAgJ3VybCc6ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2FwcGl1bS9hcHBpdW0vY29tbWl0cy81Yjk4YjkxOTdlNzVhYTg1ZTc1MDdkMjFkMzEyNmMxYTYzZDFjZThmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdub2RlX2lkJzogJ01ETTZVbVZtTnpVek1EVTNNRHAyTVM0NExqSXRZbVYwWVE9PSdcbiAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgICAgICBnZXRTdHViLm9uQ2FsbCgxKS5yZXR1cm5zKHtcbiAgICAgICAgICAnc2hhJzogJzNjMjc1MmY5ZjljNTYwMDA3MDVhNGFlMTViM2JhNjhhNWQyZTY0NGMnLFxuICAgICAgICAgICdub2RlX2lkJzogJ01EWTZRMjl0YldsME56VXpNRFUzTURvell6STNOVEptT1dZNVl6VTJNREF3TnpBMVlUUmhaVEUxWWpOaVlUWTRZVFZrTW1VMk5EUmonLFxuICAgICAgICAgICdjb21taXQnOiB7XG4gICAgICAgICAgICAnYXV0aG9yJzoge1xuICAgICAgICAgICAgICAnbmFtZSc6ICdJc2FhYyBNdXJjaGllJyxcbiAgICAgICAgICAgICAgJ2VtYWlsJzogJ2lzYWFjQHNhdWNlbGFicy5jb20nLFxuICAgICAgICAgICAgICAnZGF0ZSc6ICcyMDE4LTA4LTE3VDE5OjQ4OjAwWidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnY29tbWl0dGVyJzoge1xuICAgICAgICAgICAgICAnbmFtZSc6ICdJc2FhYyBNdXJjaGllJyxcbiAgICAgICAgICAgICAgJ2VtYWlsJzogJ2lzYWFjQHNhdWNlbGFicy5jb20nLFxuICAgICAgICAgICAgICAnZGF0ZSc6ICcyMDE4LTA4LTE3VDE5OjQ4OjAwWidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnbWVzc2FnZSc6ICd2MS45LjAtYmV0YS4xJyxcbiAgICAgICAgICAgICd0cmVlJzoge1xuICAgICAgICAgICAgICAnc2hhJzogJzJjMDk3NDcyNzQ3MGViYTQxOWVhMGI5OTUxYzUyZjcyZjgwMzZiMTgnLFxuICAgICAgICAgICAgICAndXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS9naXQvdHJlZXMvMmMwOTc0NzI3NDcwZWJhNDE5ZWEwYjk5NTFjNTJmNzJmODAzNmIxOCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndXJsJzogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvYXBwaXVtL2FwcGl1bS9naXQvY29tbWl0cy8zYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRjJyxcbiAgICAgICAgICAgICdjb21tZW50X2NvdW50JzogMCxcbiAgICAgICAgICAgICd2ZXJpZmljYXRpb24nOiB7XG4gICAgICAgICAgICAgICd2ZXJpZmllZCc6IGZhbHNlLFxuICAgICAgICAgICAgICAncmVhc29uJzogJ3Vuc2lnbmVkJyxcbiAgICAgICAgICAgICAgJ3NpZ25hdHVyZSc6IG51bGwsXG4gICAgICAgICAgICAgICdwYXlsb2FkJzogbnVsbFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgJ3VybCc6ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL2FwcGl1bS9hcHBpdW0vY29tbWl0cy8zYzI3NTJmOWY5YzU2MDAwNzA1YTRhZTE1YjNiYTY4YTVkMmU2NDRjJyxcbiAgICAgICAgICAnaHRtbF91cmwnOiAnaHR0cHM6Ly9naXRodWIuY29tL2FwcGl1bS9hcHBpdW0vY29tbWl0LzNjMjc1MmY5ZjljNTYwMDA3MDVhNGFlMTViM2JhNjhhNWQyZTY0NGMnLFxuICAgICAgICAgICdjb21tZW50c191cmwnOiAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9hcHBpdW0vYXBwaXVtL2NvbW1pdHMvM2MyNzUyZjlmOWM1NjAwMDcwNWE0YWUxNWIzYmE2OGE1ZDJlNjQ0Yy9jb21tZW50cycsXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCB2ZXJpZnlCdWlsZEluZm9VcGRhdGUoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ3Nob3dDb25maWcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBiZWZvcmUoZnVuY3Rpb24gKCkge1xuICAgICAgICBzaW5vbi5zcHkoY29uc29sZSwgJ2xvZycpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGxvZyB0aGUgY29uZmlnIHRvIGNvbnNvbGUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IGdldEJ1aWxkSW5mbygpO1xuICAgICAgICBhd2FpdCBzaG93Q29uZmlnKCk7XG4gICAgICAgIGNvbnNvbGUubG9nLmNhbGxlZE9uY2Uuc2hvdWxkLmJlLnRydWU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmxvZy5nZXRDYWxsKDApLmFyZ3NbMF0uc2hvdWxkLmNvbnRhaW4oSlNPTi5zdHJpbmdpZnkoY29uZmlnKSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdub2RlLmpzIGNvbmZpZycsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgX3Byb2Nlc3MgPSBwcm9jZXNzO1xuICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gd3JpdGUgdG8gcHJvY2Vzcy52ZXJzaW9uXG4gICAgICAvLyBidXQgYWxzbyB0byBoYXZlIGFjY2VzcyB0byBwcm9jZXNzIG1ldGhvZHNcbiAgICAgIC8vIHNvIGNvcHkgdGhlbSBvdmVyIHRvIGEgd3JpdGFibGUgb2JqZWN0XG4gICAgICBsZXQgdGVtcFByb2Nlc3MgPSB7fTtcbiAgICAgIGZvciAobGV0IFtwcm9wLCB2YWx1ZV0gb2YgXy50b1BhaXJzKHByb2Nlc3MpKSB7XG4gICAgICAgIHRlbXBQcm9jZXNzW3Byb3BdID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBwcm9jZXNzID0gdGVtcFByb2Nlc3M7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZ2xvYmFsLWFzc2lnblxuICAgIH0pO1xuICAgIGFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIHByb2Nlc3MgPSBfcHJvY2VzczsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1nbG9iYWwtYXNzaWduXG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2NoZWNrTm9kZU9rJywgZnVuY3Rpb24gKCkge1xuICAgICAgZGVzY3JpYmUoJ3Vuc3VwcG9ydGVkIG5vZGVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB1bnN1cHBvcnRlZFZlcnNpb25zID0gW1xuICAgICAgICAgICd2MC4xJywgJ3YwLjkuMTInLCAndjAuMTAuMzYnLCAndjAuMTIuMTQnLFxuICAgICAgICAgICd2NC40LjcnLCAndjUuNy4wJywgJ3Y2LjMuMScsICd2Ny4xLjEnLFxuICAgICAgICBdO1xuICAgICAgICBmb3IgKGNvbnN0IHZlcnNpb24gb2YgdW5zdXBwb3J0ZWRWZXJzaW9ucykge1xuICAgICAgICAgIGl0KGBzaG91bGQgZmFpbCBpZiBub2RlIGlzICR7dmVyc2lvbn1gLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgY2hlY2tOb2RlT2suc2hvdWxkLnRocm93KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnc3VwcG9ydGVkIG5vZGVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgaWYgbm9kZSBpcyA4KycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBwcm9jZXNzLnZlcnNpb24gPSAndjguMS4yJztcbiAgICAgICAgICBjaGVja05vZGVPay5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgaWYgbm9kZSBpcyA5KycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBwcm9jZXNzLnZlcnNpb24gPSAndjkuMS4yJztcbiAgICAgICAgICBjaGVja05vZGVPay5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgaWYgbm9kZSBpcyAxMCsnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcHJvY2Vzcy52ZXJzaW9uID0gJ3YxMC4wLjEnO1xuICAgICAgICAgIGNoZWNrTm9kZU9rLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCBpZiBub2RlIGlzIDExKycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBwcm9jZXNzLnZlcnNpb24gPSAndjExLjYuMCc7XG4gICAgICAgICAgY2hlY2tOb2RlT2suc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3dhcm5Ob2RlRGVwcmVjYXRpb25zJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IHNweTtcbiAgICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNweSA9IHNpbm9uLnNweShsb2dnZXIsICd3YXJuJyk7XG4gICAgICB9KTtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBzcHkucmVzZXRIaXN0b3J5KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgbm90IGxvZyBhIHdhcm5pbmcgaWYgbm9kZSBpcyA4KycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy52ZXJzaW9uID0gJ3Y4LjAuMCc7XG4gICAgICAgIHdhcm5Ob2RlRGVwcmVjYXRpb25zKCk7XG4gICAgICAgIGxvZ2dlci53YXJuLmNhbGxDb3VudC5zaG91bGQuZXF1YWwoMCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgbm90IGxvZyBhIHdhcm5pbmcgaWYgbm9kZSBpcyA5KycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJvY2Vzcy52ZXJzaW9uID0gJ3Y5LjAuMCc7XG4gICAgICAgIHdhcm5Ob2RlRGVwcmVjYXRpb25zKCk7XG4gICAgICAgIGxvZ2dlci53YXJuLmNhbGxDb3VudC5zaG91bGQuZXF1YWwoMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NlcnZlciBhcmd1bWVudHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHBhcnNlciA9IGdldFBhcnNlcigpO1xuICAgIHBhcnNlci5kZWJ1ZyA9IHRydWU7IC8vIHRocm93IGluc3RlYWQgb2YgZXhpdCBvbiBlcnJvcjsgcGFzcyBhcyBvcHRpb24gaW5zdGVhZD9cbiAgICBsZXQgYXJncyA9IHt9O1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgLy8gZ2l2ZSBhbGwgdGhlIGRlZmF1bHRzXG4gICAgICBmb3IgKGxldCByYXdBcmcgb2YgcGFyc2VyLnJhd0FyZ3MpIHtcbiAgICAgICAgYXJnc1tyYXdBcmdbMV0uZGVzdF0gPSByYXdBcmdbMV0uZGVmYXVsdFZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdnZXROb25EZWZhdWx0QXJncycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgc2hvdyBub25lIGlmIHdlIGhhdmUgYWxsIHRoZSBkZWZhdWx0cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IG5vbkRlZmF1bHRBcmdzID0gZ2V0Tm9uRGVmYXVsdEFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgXy5rZXlzKG5vbkRlZmF1bHRBcmdzKS5sZW5ndGguc2hvdWxkLmVxdWFsKDApO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGNhdGNoIGEgbm9uLWRlZmF1bHQgYXJndW1lbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFyZ3MuaXNvbGF0ZVNpbURldmljZSA9IHRydWU7XG4gICAgICAgIGxldCBub25EZWZhdWx0QXJncyA9IGdldE5vbkRlZmF1bHRBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgIF8ua2V5cyhub25EZWZhdWx0QXJncykubGVuZ3RoLnNob3VsZC5lcXVhbCgxKTtcbiAgICAgICAgc2hvdWxkLmV4aXN0KG5vbkRlZmF1bHRBcmdzLmlzb2xhdGVTaW1EZXZpY2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnZ2V0RGVwcmVjYXRlZEFyZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIHNob3cgbm9uZSBpZiB3ZSBoYXZlIG5vIGRlcHJlY2F0ZWQgYXJndW1lbnRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgZGVwcmVjYXRlZEFyZ3MgPSBnZXREZXByZWNhdGVkQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICBfLmtleXMoZGVwcmVjYXRlZEFyZ3MpLmxlbmd0aC5zaG91bGQuZXF1YWwoMCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2F0Y2ggYSBkZXByZWNhdGVkIGFyZ3VtZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBhcmdzLnNob3dJT1NMb2cgPSB0cnVlO1xuICAgICAgICBsZXQgZGVwcmVjYXRlZEFyZ3MgPSBnZXREZXByZWNhdGVkQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICBfLmtleXMoZGVwcmVjYXRlZEFyZ3MpLmxlbmd0aC5zaG91bGQuZXF1YWwoMSk7XG4gICAgICAgIHNob3VsZC5leGlzdChkZXByZWNhdGVkQXJnc1snLS1zaG93LWlvcy1sb2cnXSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2F0Y2ggYSBub24tYm9vbGVhbiBkZXByZWNhdGVkIGFyZ3VtZW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBhcmdzLmNhbGVuZGFyRm9ybWF0ID0gJ29yd2VsbGlhbic7XG4gICAgICAgIGxldCBkZXByZWNhdGVkQXJncyA9IGdldERlcHJlY2F0ZWRBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgIF8ua2V5cyhkZXByZWNhdGVkQXJncykubGVuZ3RoLnNob3VsZC5lcXVhbCgxKTtcbiAgICAgICAgc2hvdWxkLmV4aXN0KGRlcHJlY2F0ZWRBcmdzWyctLWNhbGVuZGFyLWZvcm1hdCddKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY2hlY2tWYWxpZFBvcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBiZSBmYWxzZSBmb3IgcG9ydCB0b28gaGlnaCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNoZWNrVmFsaWRQb3J0KDY1NTM2KS5zaG91bGQuYmUuZmFsc2U7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSBmYWxzZSBmb3IgcG9ydCB0b28gbG93JywgZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2tWYWxpZFBvcnQoMCkuc2hvdWxkLmJlLmZhbHNlO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgYmUgdHJ1ZSBmb3IgcG9ydCAxJywgZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2tWYWxpZFBvcnQoMSkuc2hvdWxkLmJlLnRydWU7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBiZSB0cnVlIGZvciBwb3J0IDY1NTM1JywgZnVuY3Rpb24gKCkge1xuICAgICAgY2hlY2tWYWxpZFBvcnQoNjU1MzUpLnNob3VsZC5iZS50cnVlO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndmFsaWRhdGVUbXBEaXInLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCBmYWlsIHRvIHVzZSBhIHRtcCBkaXIgd2l0aCBpbmNvcnJlY3QgcGVybWlzc2lvbnMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YWxpZGF0ZVRtcERpcignL3ByaXZhdGUvaWZfeW91X3J1bl93aXRoX3N1ZG9fdGhpc193b250X2ZhaWwnKS5zaG91bGQuYmUucmVqZWN0ZWRXaXRoKC9jb3VsZCBub3QgZW5zdXJlLyk7XG4gICAgfSk7XG4gICAgaXQoJ3Nob3VsZCBmYWlsIHRvIHVzZSBhbiB1bmRlZmluZWQgdG1wIGRpcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhbGlkYXRlVG1wRGlyKCkuc2hvdWxkLmJlLnJlamVjdGVkV2l0aCgvY291bGQgbm90IGVuc3VyZS8pO1xuICAgIH0pO1xuICAgIGl0KCdzaG91bGQgYmUgYWJsZSB0byB1c2UgYSB0bXAgZGlyIHdpdGggY29ycmVjdCBwZXJtaXNzaW9ucycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhbGlkYXRlVG1wRGlyKCcvdG1wL3Rlc3RfdG1wX2Rpci93aXRoL2FueS9udW1iZXIvb2YvbGV2ZWxzJykuc2hvdWxkLm5vdC5iZS5yZWplY3RlZDtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3BhcnNpbmcgYXJncyB3aXRoIGVtcHR5IGFyZ3ZbMV0nLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGFyZ3YxO1xuXG4gICAgYmVmb3JlKGZ1bmN0aW9uICgpIHtcbiAgICAgIGFyZ3YxID0gcHJvY2Vzcy5hcmd2WzFdO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgcHJvY2Vzcy5hcmd2WzFdID0gYXJndjE7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIG5vdCBmYWlsIGlmIHByb2Nlc3MuYXJndlsxXSBpcyB1bmRlZmluZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBwcm9jZXNzLmFyZ3ZbMV0gPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgYXJncyA9IGdldFBhcnNlcigpO1xuICAgICAgYXJncy5wcm9nLnNob3VsZC5iZS5lcXVhbCgnQXBwaXVtJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHNldCBcInByb2dcIiB0byBwcm9jZXNzLmFyZ3ZbMV0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBwcm9jZXNzLmFyZ3ZbMV0gPSAnSGVsbG8gV29ybGQnO1xuICAgICAgbGV0IGFyZ3MgPSBnZXRQYXJzZXIoKTtcbiAgICAgIGFyZ3MucHJvZy5zaG91bGQuYmUuZXF1YWwoJ0hlbGxvIFdvcmxkJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCd2YWxpZGF0ZVNlcnZlckFyZ3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHBhcnNlciA9IGdldFBhcnNlcigpO1xuICAgIHBhcnNlci5kZWJ1ZyA9IHRydWU7IC8vIHRocm93IGluc3RlYWQgb2YgZXhpdCBvbiBlcnJvcjsgcGFzcyBhcyBvcHRpb24gaW5zdGVhZD9cbiAgICBjb25zdCBkZWZhdWx0QXJncyA9IHt9O1xuICAgIC8vIGdpdmUgYWxsIHRoZSBkZWZhdWx0c1xuICAgIGZvciAobGV0IHJhd0FyZyBvZiBwYXJzZXIucmF3QXJncykge1xuICAgICAgZGVmYXVsdEFyZ3NbcmF3QXJnWzFdLmRlc3RdID0gcmF3QXJnWzFdLmRlZmF1bHRWYWx1ZTtcbiAgICB9XG4gICAgbGV0IGFyZ3MgPSB7fTtcbiAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIGFyZ3MgPSBfLmNsb25lKGRlZmF1bHRBcmdzKTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnbXV0dWFsbHkgZXhjbHVzaXZlIHNlcnZlciBhcmd1bWVudHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkZXNjcmliZSgnbm9SZXNldCBhbmQgZnVsbFJlc2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIG5vdCBhbGxvdyBib3RoJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLm5vUmVzZXQgPSBhcmdzLmZ1bGxSZXNldCA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgbm9SZXNldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5ub1Jlc2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgZnVsbFJlc2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmZ1bGxSZXNldCA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBkZXNjcmliZSgnaXBhIGFuZCBzYWZhcmknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgbm90IGFsbG93IGJvdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGFyZ3MuaXBhID0gYXJncy5zYWZhcmkgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGFsbG93IGlwYScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5pcGEgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBzYWZhcmknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGFyZ3Muc2FmYXJpID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGRlc2NyaWJlKCdhcHAgYW5kIHNhZmFyaScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgYm90aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5hcHAgPSBhcmdzLnNhZmFyaSA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgYXBwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICBhcmdzLmFwcCA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBkZXNjcmliZSgnZm9yY2VJcGhvbmUgYW5kIGZvcmNlSXBhZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXQoJ3Nob3VsZCBub3QgYWxsb3cgYm90aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5mb3JjZUlwaG9uZSA9IGFyZ3MuZm9yY2VJcGFkID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgICAgaXQoJ3Nob3VsZCBhbGxvdyBmb3JjZUlwaG9uZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5mb3JjZUlwaG9uZSA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIGFsbG93IGZvcmNlSXBhZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5mb3JjZUlwYWQgPSB0cnVlO1xuICAgICAgICAgICAgdmFsaWRhdGVTZXJ2ZXJBcmdzKHBhcnNlciwgYXJncyk7XG4gICAgICAgICAgfSkuc2hvdWxkLm5vdC50aHJvdygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZGVzY3JpYmUoJ2RldmljZU5hbWUgYW5kIGRlZmF1bHREZXZpY2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGl0KCdzaG91bGQgbm90IGFsbG93IGJvdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgIGFyZ3MuZGV2aWNlTmFtZSA9IGFyZ3MuZGVmYXVsdERldmljZSA9IHRydWU7XG4gICAgICAgICAgICB2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTtcbiAgICAgICAgICB9KS5zaG91bGQudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgZGV2aWNlTmFtZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5kZXZpY2VOYW1lID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgYWxsb3cgZGVmYXVsdERldmljZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgYXJncy5kZWZhdWx0RGV2aWNlID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhbGlkYXRlU2VydmVyQXJncyhwYXJzZXIsIGFyZ3MpO1xuICAgICAgICAgIH0pLnNob3VsZC5ub3QudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgndmFsaWRhdGVkIGFyZ3VtZW50cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGNoZWNraW5nIHBvcnRzIGlzIGFscmVhZHkgZG9uZS5cbiAgICAgIC8vIHRoZSBvbmx5IGFyZ3VtZW50IGxlZnQgaXMgYGJhY2tlbmRSZXRyaWVzYFxuICAgICAgZGVzY3JpYmUoJ2JhY2tlbmRSZXRyaWVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpdCgnc2hvdWxkIGZhaWwgd2l0aCB2YWx1ZSBsZXNzIHRoYW4gMCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBhcmdzLmJhY2tlbmRSZXRyaWVzID0gLTE7XG4gICAgICAgICAgKCgpID0+IHt2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTt9KS5zaG91bGQudGhyb3coKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGl0KCdzaG91bGQgc3VjY2VlZCB3aXRoIHZhbHVlIG9mIDAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYXJncy5iYWNrZW5kUmV0cmllcyA9IDA7XG4gICAgICAgICAgKCgpID0+IHt2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpdCgnc2hvdWxkIHN1Y2NlZWQgd2l0aCB2YWx1ZSBhYm92ZSAwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGFyZ3MuYmFja2VuZFJldHJpZXMgPSAxMDA7XG4gICAgICAgICAgKCgpID0+IHt2YWxpZGF0ZVNlcnZlckFyZ3MocGFyc2VyLCBhcmdzKTt9KS5zaG91bGQubm90LnRocm93KCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwiZmlsZSI6InRlc3QvY29uZmlnLXNwZWNzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
