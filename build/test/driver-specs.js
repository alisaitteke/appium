"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _appium = require("../lib/appium");

var _appiumFakeDriver = require("appium-fake-driver");

var _helpers = require("./helpers");

var _lodash = _interopRequireDefault(require("lodash"));

var _sinon = _interopRequireDefault(require("sinon"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _appiumXcuitestDriver = require("appium-xcuitest-driver");

var _appiumIosDriver = require("appium-ios-driver");

var _appiumUiautomator2Driver = require("appium-uiautomator2-driver");

var _asyncbox = require("asyncbox");

var _utils = require("../lib/utils");

_chai.default.should();

_chai.default.use(_chaiAsPromised.default);

const SESSION_ID = 1;
describe('AppiumDriver', function () {
  describe('AppiumDriver', function () {
    function getDriverAndFakeDriver() {
      const appium = new _appium.AppiumDriver({});
      const fakeDriver = new _appiumFakeDriver.FakeDriver();

      const mockFakeDriver = _sinon.default.mock(fakeDriver);

      appium.getDriverAndVersionForCaps = function () {
        return {
          driver: function Driver() {
            return fakeDriver;
          },
          version: '1.2.3'
        };
      };

      return [appium, mockFakeDriver];
    }

    describe('createSession', function () {
      let appium;
      let mockFakeDriver;
      beforeEach(function () {
        [appium, mockFakeDriver] = getDriverAndFakeDriver();
      });
      afterEach(async function () {
        mockFakeDriver.restore();
        await appium.deleteSession(SESSION_ID);
      });
      it(`should call inner driver's createSession with desired capabilities`, async function () {
        mockFakeDriver.expects('createSession').once().withExactArgs(_helpers.BASE_CAPS, undefined, null, []).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(_helpers.BASE_CAPS);
        mockFakeDriver.verify();
      });
      it(`should call inner driver's createSession with desired and default capabilities`, async function () {
        let defaultCaps = {
          deviceName: 'Emulator'
        };

        let allCaps = _lodash.default.extend(_lodash.default.clone(defaultCaps), _helpers.BASE_CAPS);

        appium.args.defaultCapabilities = defaultCaps;
        mockFakeDriver.expects('createSession').once().withArgs(allCaps).returns([SESSION_ID, allCaps]);
        await appium.createSession(_helpers.BASE_CAPS);
        mockFakeDriver.verify();
      });
      it(`should call inner driver's createSession with desired and default capabilities without overriding caps`, async function () {
        let defaultCaps = {
          platformName: 'Ersatz'
        };
        appium.args.defaultCapabilities = defaultCaps;
        mockFakeDriver.expects('createSession').once().withArgs(_helpers.BASE_CAPS).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(_helpers.BASE_CAPS);
        mockFakeDriver.verify();
      });
      it('should kill all other sessions if sessionOverride is on', async function () {
        appium.args.sessionOverride = true;
        let fakeDrivers = [new _appiumFakeDriver.FakeDriver(), new _appiumFakeDriver.FakeDriver(), new _appiumFakeDriver.FakeDriver()];

        let mockFakeDrivers = _lodash.default.map(fakeDrivers, fd => {
          return _sinon.default.mock(fd);
        });

        mockFakeDrivers[0].expects('deleteSession').once();
        mockFakeDrivers[1].expects('deleteSession').once().throws('Cannot shut down Android driver; it has already shut down');
        mockFakeDrivers[2].expects('deleteSession').once();
        appium.sessions['abc-123-xyz'] = fakeDrivers[0];
        appium.sessions['xyz-321-abc'] = fakeDrivers[1];
        appium.sessions['123-abc-xyz'] = fakeDrivers[2];
        let sessions = await appium.getSessions();
        sessions.should.have.length(3);
        mockFakeDriver.expects('createSession').once().withExactArgs(_helpers.BASE_CAPS, undefined, null, []).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(_helpers.BASE_CAPS);
        sessions = await appium.getSessions();
        sessions.should.have.length(1);

        for (let mfd of mockFakeDrivers) {
          mfd.verify();
        }

        mockFakeDriver.verify();
      });
      it('should call "createSession" with W3C capabilities argument, if provided', async function () {
        mockFakeDriver.expects('createSession').once().withArgs(null, undefined, _helpers.W3C_CAPS).returns([SESSION_ID, _helpers.BASE_CAPS]);
        await appium.createSession(undefined, undefined, _helpers.W3C_CAPS);
        mockFakeDriver.verify();
      });
      it('should call "createSession" with W3C capabilities argument with additional provided parameters', async function () {
        let w3cCaps = { ..._helpers.W3C_CAPS,
          alwaysMatch: { ..._helpers.W3C_CAPS.alwaysMatch,
            'appium:someOtherParm': 'someOtherParm'
          }
        };
        mockFakeDriver.expects('createSession').once().withArgs(null, undefined, {
          alwaysMatch: { ...w3cCaps.alwaysMatch,
            'appium:someOtherParm': 'someOtherParm'
          },
          firstMatch: [{}]
        }).returns([SESSION_ID, (0, _utils.insertAppiumPrefixes)(_helpers.BASE_CAPS)]);
        await appium.createSession(undefined, undefined, w3cCaps);
        mockFakeDriver.verify();
      });
      it('should call "createSession" with JSONWP capabilities if W3C has incomplete capabilities', async function () {
        let w3cCaps = { ..._helpers.W3C_CAPS,
          alwaysMatch: { ..._helpers.W3C_CAPS.alwaysMatch,
            'appium:someOtherParm': 'someOtherParm'
          }
        };
        let jsonwpCaps = { ..._helpers.BASE_CAPS,
          automationName: 'Fake',
          someOtherParam: 'someOtherParam'
        };
        let expectedW3cCaps = { ...w3cCaps,
          alwaysMatch: { ...w3cCaps.alwaysMatch,
            'appium:automationName': 'Fake',
            'appium:someOtherParam': 'someOtherParam'
          }
        };
        mockFakeDriver.expects('createSession').once().withArgs(jsonwpCaps, undefined, expectedW3cCaps).returns([SESSION_ID, jsonwpCaps]);
        await appium.createSession(jsonwpCaps, undefined, w3cCaps);
        mockFakeDriver.verify();
      });
    });
    describe('deleteSession', function () {
      let appium;
      let mockFakeDriver;
      beforeEach(function () {
        [appium, mockFakeDriver] = getDriverAndFakeDriver();
      });
      afterEach(function () {
        mockFakeDriver.restore();
      });
      it('should remove the session if it is found', async function () {
        let [sessionId] = (await appium.createSession(_helpers.BASE_CAPS)).value;
        let sessions = await appium.getSessions();
        sessions.should.have.length(1);
        await appium.deleteSession(sessionId);
        sessions = await appium.getSessions();
        sessions.should.have.length(0);
      });
      it('should call inner driver\'s deleteSession method', async function () {
        const [sessionId] = (await appium.createSession(_helpers.BASE_CAPS)).value;
        mockFakeDriver.expects('deleteSession').once().withExactArgs(sessionId, []).returns();
        await appium.deleteSession(sessionId);
        mockFakeDriver.verify();
        await mockFakeDriver.object.deleteSession();
      });
    });
    describe('getSessions', function () {
      let appium;
      let sessions;
      before(function () {
        appium = new _appium.AppiumDriver({});
      });
      afterEach(async function () {
        for (let session of sessions) {
          await appium.deleteSession(session.id);
        }
      });
      it('should return an empty array of sessions', async function () {
        sessions = await appium.getSessions();
        sessions.should.be.an('array');
        sessions.should.be.empty;
      });
      it('should return sessions created', async function () {
        let session1 = (await appium.createSession(_lodash.default.extend(_lodash.default.clone(_helpers.BASE_CAPS), {
          cap: 'value'
        }))).value;
        let session2 = (await appium.createSession(_lodash.default.extend(_lodash.default.clone(_helpers.BASE_CAPS), {
          cap: 'other value'
        }))).value;
        sessions = await appium.getSessions();
        sessions.should.be.an('array');
        sessions.should.have.length(2);
        sessions[0].id.should.equal(session1[0]);
        sessions[0].capabilities.should.eql(session1[1]);
        sessions[1].id.should.equal(session2[0]);
        sessions[1].capabilities.should.eql(session2[1]);
      });
    });
    describe('getStatus', function () {
      let appium;
      before(function () {
        appium = new _appium.AppiumDriver({});
      });
      it('should return a status', async function () {
        let status = await appium.getStatus();
        status.build.should.exist;
        status.build.version.should.exist;
      });
    });
    describe('sessionExists', function () {});
    describe('attachUnexpectedShutdownHandler', function () {
      let appium;
      let mockFakeDriver;
      beforeEach(function () {
        [appium, mockFakeDriver] = getDriverAndFakeDriver();
      });
      afterEach(async function () {
        await mockFakeDriver.object.deleteSession();
        mockFakeDriver.restore();
        appium.args.defaultCapabilities = {};
      });
      it('should remove session if inner driver unexpectedly exits with an error', async function () {
        let [sessionId] = (await appium.createSession(_lodash.default.clone(_helpers.BASE_CAPS))).value;

        _lodash.default.keys(appium.sessions).should.contain(sessionId);

        appium.sessions[sessionId].unexpectedShutdownDeferred.reject(new Error('Oops'));
        await (0, _asyncbox.sleep)(1);

        _lodash.default.keys(appium.sessions).should.not.contain(sessionId);
      });
      it('should remove session if inner driver unexpectedly exits with no error', async function () {
        let [sessionId] = (await appium.createSession(_lodash.default.clone(_helpers.BASE_CAPS))).value;

        _lodash.default.keys(appium.sessions).should.contain(sessionId);

        appium.sessions[sessionId].unexpectedShutdownDeferred.resolve();
        await (0, _asyncbox.sleep)(1);

        _lodash.default.keys(appium.sessions).should.not.contain(sessionId);
      });
      it('should not remove session if inner driver cancels unexpected exit', async function () {
        let [sessionId] = (await appium.createSession(_lodash.default.clone(_helpers.BASE_CAPS))).value;

        _lodash.default.keys(appium.sessions).should.contain(sessionId);

        appium.sessions[sessionId].onUnexpectedShutdown.cancel();
        await (0, _asyncbox.sleep)(1);

        _lodash.default.keys(appium.sessions).should.contain(sessionId);
      });
    });
    describe('getDriverAndVersionForCaps', function () {
      it('should not blow up if user does not provide platformName', function () {
        const appium = new _appium.AppiumDriver({});
        (() => {
          appium.getDriverAndVersionForCaps({});
        }).should.throw(/platformName/);
      });
      it('should ignore automationName Appium', function () {
        const appium = new _appium.AppiumDriver({});
        const {
          driver
        } = appium.getDriverAndVersionForCaps({
          platformName: 'Android',
          automationName: 'Appium'
        });
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumUiautomator2Driver.AndroidUiautomator2Driver);
      });
      it('should get XCUITestDriver driver for automationName of XCUITest', function () {
        const appium = new _appium.AppiumDriver({});
        const {
          driver
        } = appium.getDriverAndVersionForCaps({
          platformName: 'iOS',
          automationName: 'XCUITest'
        });
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
      it('should get iosdriver for ios < 10', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'iOS',
          platformVersion: '8.0'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = '8.1';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = '9.4';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = '';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        caps.platformVersion = 'foo';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
        delete caps.platformVersion;
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumIosDriver.IosDriver);
      });
      it('should get xcuitestdriver for ios >= 10', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'iOS',
          platformVersion: '10'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
        caps.platformVersion = '10.0';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
        caps.platformVersion = '10.1';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
        caps.platformVersion = '12.14';
        ({
          driver
        } = appium.getDriverAndVersionForCaps(caps));
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
      it('should be able to handle different cases in automationName', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'iOS',
          platformVersion: '10',
          automationName: 'XcUiTeSt'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
      it('should be able to handle different case in platformName', function () {
        const appium = new _appium.AppiumDriver({});
        const caps = {
          platformName: 'IoS',
          platformVersion: '10'
        };
        let {
          driver
        } = appium.getDriverAndVersionForCaps(caps);
        driver.should.be.an.instanceof(Function);
        driver.should.equal(_appiumXcuitestDriver.XCUITestDriver);
      });
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZHJpdmVyLXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJzaG91bGQiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsIlNFU1NJT05fSUQiLCJkZXNjcmliZSIsImdldERyaXZlckFuZEZha2VEcml2ZXIiLCJhcHBpdW0iLCJBcHBpdW1Ecml2ZXIiLCJmYWtlRHJpdmVyIiwiRmFrZURyaXZlciIsIm1vY2tGYWtlRHJpdmVyIiwic2lub24iLCJtb2NrIiwiZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMiLCJkcml2ZXIiLCJEcml2ZXIiLCJ2ZXJzaW9uIiwiYmVmb3JlRWFjaCIsImFmdGVyRWFjaCIsInJlc3RvcmUiLCJkZWxldGVTZXNzaW9uIiwiaXQiLCJleHBlY3RzIiwib25jZSIsIndpdGhFeGFjdEFyZ3MiLCJCQVNFX0NBUFMiLCJ1bmRlZmluZWQiLCJyZXR1cm5zIiwiY3JlYXRlU2Vzc2lvbiIsInZlcmlmeSIsImRlZmF1bHRDYXBzIiwiZGV2aWNlTmFtZSIsImFsbENhcHMiLCJfIiwiZXh0ZW5kIiwiY2xvbmUiLCJhcmdzIiwiZGVmYXVsdENhcGFiaWxpdGllcyIsIndpdGhBcmdzIiwicGxhdGZvcm1OYW1lIiwic2Vzc2lvbk92ZXJyaWRlIiwiZmFrZURyaXZlcnMiLCJtb2NrRmFrZURyaXZlcnMiLCJtYXAiLCJmZCIsInRocm93cyIsInNlc3Npb25zIiwiZ2V0U2Vzc2lvbnMiLCJoYXZlIiwibGVuZ3RoIiwibWZkIiwiVzNDX0NBUFMiLCJ3M2NDYXBzIiwiYWx3YXlzTWF0Y2giLCJmaXJzdE1hdGNoIiwianNvbndwQ2FwcyIsImF1dG9tYXRpb25OYW1lIiwic29tZU90aGVyUGFyYW0iLCJleHBlY3RlZFczY0NhcHMiLCJzZXNzaW9uSWQiLCJ2YWx1ZSIsIm9iamVjdCIsImJlZm9yZSIsInNlc3Npb24iLCJpZCIsImJlIiwiYW4iLCJlbXB0eSIsInNlc3Npb24xIiwiY2FwIiwic2Vzc2lvbjIiLCJlcXVhbCIsImNhcGFiaWxpdGllcyIsImVxbCIsInN0YXR1cyIsImdldFN0YXR1cyIsImJ1aWxkIiwiZXhpc3QiLCJrZXlzIiwiY29udGFpbiIsInVuZXhwZWN0ZWRTaHV0ZG93bkRlZmVycmVkIiwicmVqZWN0IiwiRXJyb3IiLCJub3QiLCJyZXNvbHZlIiwib25VbmV4cGVjdGVkU2h1dGRvd24iLCJjYW5jZWwiLCJ0aHJvdyIsImluc3RhbmNlb2YiLCJGdW5jdGlvbiIsIkFuZHJvaWRVaWF1dG9tYXRvcjJEcml2ZXIiLCJYQ1VJVGVzdERyaXZlciIsImNhcHMiLCJwbGF0Zm9ybVZlcnNpb24iLCJJb3NEcml2ZXIiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBQSxjQUFLQyxNQUFMOztBQUNBRCxjQUFLRSxHQUFMLENBQVNDLHVCQUFUOztBQUVBLE1BQU1DLFVBQVUsR0FBRyxDQUFuQjtBQUVBQyxRQUFRLENBQUMsY0FBRCxFQUFpQixZQUFZO0FBQ25DQSxFQUFBQSxRQUFRLENBQUMsY0FBRCxFQUFpQixZQUFZO0FBQ25DLGFBQVNDLHNCQUFULEdBQW1DO0FBQ2pDLFlBQU1DLE1BQU0sR0FBRyxJQUFJQyxvQkFBSixDQUFpQixFQUFqQixDQUFmO0FBQ0EsWUFBTUMsVUFBVSxHQUFHLElBQUlDLDRCQUFKLEVBQW5COztBQUNBLFlBQU1DLGNBQWMsR0FBR0MsZUFBTUMsSUFBTixDQUFXSixVQUFYLENBQXZCOztBQUNBRixNQUFBQSxNQUFNLENBQUNPLDBCQUFQLEdBQW9DLFlBQW9CO0FBQ3RELGVBQU87QUFDTEMsVUFBQUEsTUFBTSxFQUFFLFNBQVNDLE1BQVQsR0FBbUI7QUFDekIsbUJBQU9QLFVBQVA7QUFDRCxXQUhJO0FBSUxRLFVBQUFBLE9BQU8sRUFBRTtBQUpKLFNBQVA7QUFNRCxPQVBEOztBQVFBLGFBQU8sQ0FBQ1YsTUFBRCxFQUFTSSxjQUFULENBQVA7QUFDRDs7QUFDRE4sSUFBQUEsUUFBUSxDQUFDLGVBQUQs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WUFBWTtBQUN4RSxjQUFNZixNQUFNLEdBQUcsSUFBSUMsb0JBQUosQ0FBaUIsRUFBakIsQ0FBZjtBQUNBLGNBQU1xRixJQUFJLEdBQUc7QUFDWHJELFVBQUFBLFlBQVksRUFBRSxLQURIO0FBRVhzRCxVQUFBQSxlQUFlLEVBQUU7QUFGTixTQUFiO0FBSUEsWUFBSTtBQUFDL0UsVUFBQUE7QUFBRCxZQUFXUixNQUFNLENBQUNPLDBCQUFQLENBQWtDK0UsSUFBbEMsQ0FBZjtBQUNBOUUsUUFBQUEsTUFBTSxDQUFDZCxNQUFQLENBQWNpRSxFQUFkLENBQWlCQyxFQUFqQixDQUFvQnNCLFVBQXBCLENBQStCQyxRQUEvQjtBQUNBM0UsUUFBQUEsTUFBTSxDQUFDZCxNQUFQLENBQWN1RSxLQUFkLENBQW9Cb0Isb0NBQXBCO0FBQ0QsT0FUQyxDQUFGO0FBVUQsS0FoR08sQ0FBUjtBQWlHRCxHQXBXTyxDQUFSO0FBcVdELENBdFdPLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bW9jaGFcblxuaW1wb3J0IHsgQXBwaXVtRHJpdmVyIH0gZnJvbSAnLi4vbGliL2FwcGl1bSc7XG5pbXBvcnQgeyBGYWtlRHJpdmVyIH0gZnJvbSAnYXBwaXVtLWZha2UtZHJpdmVyJztcbmltcG9ydCB7IEJBU0VfQ0FQUywgVzNDX0NBUFMgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCB7IFhDVUlUZXN0RHJpdmVyIH0gZnJvbSAnYXBwaXVtLXhjdWl0ZXN0LWRyaXZlcic7XG5pbXBvcnQgeyBJb3NEcml2ZXIgfSBmcm9tICdhcHBpdW0taW9zLWRyaXZlcic7XG5pbXBvcnQgeyBBbmRyb2lkVWlhdXRvbWF0b3IyRHJpdmVyIH0gZnJvbSAnYXBwaXVtLXVpYXV0b21hdG9yMi1kcml2ZXInO1xuaW1wb3J0IHsgc2xlZXAgfSBmcm9tICdhc3luY2JveCc7XG5pbXBvcnQgeyBpbnNlcnRBcHBpdW1QcmVmaXhlcyB9IGZyb20gJy4uL2xpYi91dGlscyc7XG5cbmNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmNvbnN0IFNFU1NJT05fSUQgPSAxO1xuXG5kZXNjcmliZSgnQXBwaXVtRHJpdmVyJywgZnVuY3Rpb24gKCkge1xuICBkZXNjcmliZSgnQXBwaXVtRHJpdmVyJywgZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIGdldERyaXZlckFuZEZha2VEcml2ZXIgKCkge1xuICAgICAgY29uc3QgYXBwaXVtID0gbmV3IEFwcGl1bURyaXZlcih7fSk7XG4gICAgICBjb25zdCBmYWtlRHJpdmVyID0gbmV3IEZha2VEcml2ZXIoKTtcbiAgICAgIGNvbnN0IG1vY2tGYWtlRHJpdmVyID0gc2lub24ubW9jayhmYWtlRHJpdmVyKTtcbiAgICAgIGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyA9IGZ1bmN0aW9uICgvKmFyZ3MqLykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRyaXZlcjogZnVuY3Rpb24gRHJpdmVyICgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWtlRHJpdmVyO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdmVyc2lvbjogJzEuMi4zJyxcbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gW2FwcGl1bSwgbW9ja0Zha2VEcml2ZXJdO1xuICAgIH1cbiAgICBkZXNjcmliZSgnY3JlYXRlU2Vzc2lvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBhcHBpdW07XG4gICAgICBsZXQgbW9ja0Zha2VEcml2ZXI7XG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgW2FwcGl1bSwgbW9ja0Zha2VEcml2ZXJdID0gZ2V0RHJpdmVyQW5kRmFrZURyaXZlcigpO1xuICAgICAgfSk7XG4gICAgICBhZnRlckVhY2goYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2NrRmFrZURyaXZlci5yZXN0b3JlKCk7XG4gICAgICAgIGF3YWl0IGFwcGl1bS5kZWxldGVTZXNzaW9uKFNFU1NJT05fSUQpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KGBzaG91bGQgY2FsbCBpbm5lciBkcml2ZXIncyBjcmVhdGVTZXNzaW9uIHdpdGggZGVzaXJlZCBjYXBhYmlsaXRpZXNgLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEV4YWN0QXJncyhCQVNFX0NBUFMsIHVuZGVmaW5lZCwgbnVsbCwgW10pXG4gICAgICAgICAgLnJldHVybnMoW1NFU1NJT05fSUQsIEJBU0VfQ0FQU10pO1xuICAgICAgICBhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihCQVNFX0NBUFMpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoYHNob3VsZCBjYWxsIGlubmVyIGRyaXZlcidzIGNyZWF0ZVNlc3Npb24gd2l0aCBkZXNpcmVkIGFuZCBkZWZhdWx0IGNhcGFiaWxpdGllc2AsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGRlZmF1bHRDYXBzID0ge2RldmljZU5hbWU6ICdFbXVsYXRvcid9O1xuICAgICAgICBsZXQgYWxsQ2FwcyA9IF8uZXh0ZW5kKF8uY2xvbmUoZGVmYXVsdENhcHMpLCBCQVNFX0NBUFMpO1xuICAgICAgICBhcHBpdW0uYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzID0gZGVmYXVsdENhcHM7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoYWxsQ2FwcylcbiAgICAgICAgICAucmV0dXJucyhbU0VTU0lPTl9JRCwgYWxsQ2Fwc10pO1xuICAgICAgICBhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbihCQVNFX0NBUFMpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoYHNob3VsZCBjYWxsIGlubmVyIGRyaXZlcidzIGNyZWF0ZVNlc3Npb24gd2l0aCBkZXNpcmVkIGFuZCBkZWZhdWx0IGNhcGFiaWxpdGllcyB3aXRob3V0IG92ZXJyaWRpbmcgY2Fwc2AsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gYSBkZWZhdWx0IGNhcGFiaWxpdHkgd2l0aCB0aGUgc2FtZSBrZXkgYXMgYSBkZXNpcmVkIGNhcGFiaWxpdHlcbiAgICAgICAgLy8gc2hvdWxkIGRvIG5vdGhpbmdcbiAgICAgICAgbGV0IGRlZmF1bHRDYXBzID0ge3BsYXRmb3JtTmFtZTogJ0Vyc2F0eid9O1xuICAgICAgICBhcHBpdW0uYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzID0gZGVmYXVsdENhcHM7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MoQkFTRV9DQVBTKVxuICAgICAgICAgIC5yZXR1cm5zKFtTRVNTSU9OX0lELCBCQVNFX0NBUFNdKTtcbiAgICAgICAgYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oQkFTRV9DQVBTKTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXIudmVyaWZ5KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQga2lsbCBhbGwgb3RoZXIgc2Vzc2lvbnMgaWYgc2Vzc2lvbk92ZXJyaWRlIGlzIG9uJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBhcHBpdW0uYXJncy5zZXNzaW9uT3ZlcnJpZGUgPSB0cnVlO1xuXG4gICAgICAgIC8vIG1vY2sgdGhyZWUgc2Vzc2lvbnMgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZCB3aGVuIHRoZSBuZXcgb25lIGlzIGNyZWF0ZWRcbiAgICAgICAgbGV0IGZha2VEcml2ZXJzID0gW1xuICAgICAgICAgIG5ldyBGYWtlRHJpdmVyKCksXG4gICAgICAgICAgbmV3IEZha2VEcml2ZXIoKSxcbiAgICAgICAgICBuZXcgRmFrZURyaXZlcigpLFxuICAgICAgICBdO1xuICAgICAgICBsZXQgbW9ja0Zha2VEcml2ZXJzID0gXy5tYXAoZmFrZURyaXZlcnMsIChmZCkgPT4ge3JldHVybiBzaW5vbi5tb2NrKGZkKTt9KTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXJzWzBdLmV4cGVjdHMoJ2RlbGV0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCk7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyc1sxXS5leHBlY3RzKCdkZWxldGVTZXNzaW9uJylcbiAgICAgICAgICAub25jZSgpXG4gICAgICAgICAgLnRocm93cygnQ2Fubm90IHNodXQgZG93biBBbmRyb2lkIGRyaXZlcjsgaXQgaGFzIGFscmVhZHkgc2h1dCBkb3duJyk7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyc1syXS5leHBlY3RzKCdkZWxldGVTZXNzaW9uJylcbiAgICAgICAgICAub25jZSgpO1xuICAgICAgICBhcHBpdW0uc2Vzc2lvbnNbJ2FiYy0xMjMteHl6J10gPSBmYWtlRHJpdmVyc1swXTtcbiAgICAgICAgYXBwaXVtLnNlc3Npb25zWyd4eXotMzIxLWFiYyddID0gZmFrZURyaXZlcnNbMV07XG4gICAgICAgIGFwcGl1bS5zZXNzaW9uc1snMTIzLWFiYy14eXonXSA9IGZha2VEcml2ZXJzWzJdO1xuXG4gICAgICAgIGxldCBzZXNzaW9ucyA9IGF3YWl0IGFwcGl1bS5nZXRTZXNzaW9ucygpO1xuICAgICAgICBzZXNzaW9ucy5zaG91bGQuaGF2ZS5sZW5ndGgoMyk7XG5cbiAgICAgICAgbW9ja0Zha2VEcml2ZXIuZXhwZWN0cygnY3JlYXRlU2Vzc2lvbicpXG4gICAgICAgICAgLm9uY2UoKS53aXRoRXhhY3RBcmdzKEJBU0VfQ0FQUywgdW5kZWZpbmVkLCBudWxsLCBbXSlcbiAgICAgICAgICAucmV0dXJucyhbU0VTU0lPTl9JRCwgQkFTRV9DQVBTXSk7XG4gICAgICAgIGF3YWl0IGFwcGl1bS5jcmVhdGVTZXNzaW9uKEJBU0VfQ0FQUyk7XG5cbiAgICAgICAgc2Vzc2lvbnMgPSBhd2FpdCBhcHBpdW0uZ2V0U2Vzc2lvbnMoKTtcbiAgICAgICAgc2Vzc2lvbnMuc2hvdWxkLmhhdmUubGVuZ3RoKDEpO1xuXG4gICAgICAgIGZvciAobGV0IG1mZCBvZiBtb2NrRmFrZURyaXZlcnMpIHtcbiAgICAgICAgICBtZmQudmVyaWZ5KCk7XG4gICAgICAgIH1cbiAgICAgICAgbW9ja0Zha2VEcml2ZXIudmVyaWZ5KCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgY2FsbCBcImNyZWF0ZVNlc3Npb25cIiB3aXRoIFczQyBjYXBhYmlsaXRpZXMgYXJndW1lbnQsIGlmIHByb3ZpZGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2NrRmFrZURyaXZlci5leHBlY3RzKCdjcmVhdGVTZXNzaW9uJylcbiAgICAgICAgICAub25jZSgpLndpdGhBcmdzKG51bGwsIHVuZGVmaW5lZCwgVzNDX0NBUFMpXG4gICAgICAgICAgLnJldHVybnMoW1NFU1NJT05fSUQsIEJBU0VfQ0FQU10pO1xuICAgICAgICBhd2FpdCBhcHBpdW0uY3JlYXRlU2Vzc2lvbih1bmRlZmluZWQsIHVuZGVmaW5lZCwgVzNDX0NBUFMpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIFwiY3JlYXRlU2Vzc2lvblwiIHdpdGggVzNDIGNhcGFiaWxpdGllcyBhcmd1bWVudCB3aXRoIGFkZGl0aW9uYWwgcHJvdmlkZWQgcGFyYW1ldGVycycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IHczY0NhcHMgPSB7XG4gICAgICAgICAgLi4uVzNDX0NBUFMsXG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IHtcbiAgICAgICAgICAgIC4uLlczQ19DQVBTLmFsd2F5c01hdGNoLFxuICAgICAgICAgICAgJ2FwcGl1bTpzb21lT3RoZXJQYXJtJzogJ3NvbWVPdGhlclBhcm0nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLmV4cGVjdHMoJ2NyZWF0ZVNlc3Npb24nKVxuICAgICAgICAgIC5vbmNlKCkud2l0aEFyZ3MobnVsbCwgdW5kZWZpbmVkLCB7XG4gICAgICAgICAgICBhbHdheXNNYXRjaDoge1xuICAgICAgICAgICAgICAuLi53M2NDYXBzLmFsd2F5c01hdGNoLFxuICAgICAgICAgICAgICAnYXBwaXVtOnNvbWVPdGhlclBhcm0nOiAnc29tZU90aGVyUGFybScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmlyc3RNYXRjaDogW3t9XSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5yZXR1cm5zKFtTRVNTSU9OX0lELCBpbnNlcnRBcHBpdW1QcmVmaXhlcyhCQVNFX0NBUFMpXSk7XG5cbiAgICAgICAgYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24odW5kZWZpbmVkLCB1bmRlZmluZWQsIHczY0NhcHMpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIFwiY3JlYXRlU2Vzc2lvblwiIHdpdGggSlNPTldQIGNhcGFiaWxpdGllcyBpZiBXM0MgaGFzIGluY29tcGxldGUgY2FwYWJpbGl0aWVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgdzNjQ2FwcyA9IHtcbiAgICAgICAgICAuLi5XM0NfQ0FQUyxcbiAgICAgICAgICBhbHdheXNNYXRjaDoge1xuICAgICAgICAgICAgLi4uVzNDX0NBUFMuYWx3YXlzTWF0Y2gsXG4gICAgICAgICAgICAnYXBwaXVtOnNvbWVPdGhlclBhcm0nOiAnc29tZU90aGVyUGFybScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQganNvbndwQ2FwcyA9IHtcbiAgICAgICAgICAuLi5CQVNFX0NBUFMsXG4gICAgICAgICAgYXV0b21hdGlvbk5hbWU6ICdGYWtlJyxcbiAgICAgICAgICBzb21lT3RoZXJQYXJhbTogJ3NvbWVPdGhlclBhcmFtJyxcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgZXhwZWN0ZWRXM2NDYXBzID0ge1xuICAgICAgICAgIC4uLnczY0NhcHMsXG4gICAgICAgICAgYWx3YXlzTWF0Y2g6IHtcbiAgICAgICAgICAgIC4uLnczY0NhcHMuYWx3YXlzTWF0Y2gsXG4gICAgICAgICAgICAnYXBwaXVtOmF1dG9tYXRpb25OYW1lJzogJ0Zha2UnLFxuICAgICAgICAgICAgJ2FwcGl1bTpzb21lT3RoZXJQYXJhbSc6ICdzb21lT3RoZXJQYXJhbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICBtb2NrRmFrZURyaXZlci5leHBlY3RzKCdjcmVhdGVTZXNzaW9uJylcbiAgICAgICAgICAub25jZSgpLndpdGhBcmdzKGpzb253cENhcHMsIHVuZGVmaW5lZCwgZXhwZWN0ZWRXM2NDYXBzKVxuICAgICAgICAgIC5yZXR1cm5zKFtTRVNTSU9OX0lELCBqc29ud3BDYXBzXSk7XG5cbiAgICAgICAgYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oanNvbndwQ2FwcywgdW5kZWZpbmVkLCB3M2NDYXBzKTtcbiAgICAgICAgbW9ja0Zha2VEcml2ZXIudmVyaWZ5KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZGVsZXRlU2Vzc2lvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBhcHBpdW07XG4gICAgICBsZXQgbW9ja0Zha2VEcml2ZXI7XG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgW2FwcGl1bSwgbW9ja0Zha2VEcml2ZXJdID0gZ2V0RHJpdmVyQW5kRmFrZURyaXZlcigpO1xuICAgICAgfSk7XG4gICAgICBhZnRlckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBtb2NrRmFrZURyaXZlci5yZXN0b3JlKCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgcmVtb3ZlIHRoZSBzZXNzaW9uIGlmIGl0IGlzIGZvdW5kJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgW3Nlc3Npb25JZF0gPSAoYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oQkFTRV9DQVBTKSkudmFsdWU7XG4gICAgICAgIGxldCBzZXNzaW9ucyA9IGF3YWl0IGFwcGl1bS5nZXRTZXNzaW9ucygpO1xuICAgICAgICBzZXNzaW9ucy5zaG91bGQuaGF2ZS5sZW5ndGgoMSk7XG4gICAgICAgIGF3YWl0IGFwcGl1bS5kZWxldGVTZXNzaW9uKHNlc3Npb25JZCk7XG4gICAgICAgIHNlc3Npb25zID0gYXdhaXQgYXBwaXVtLmdldFNlc3Npb25zKCk7XG4gICAgICAgIHNlc3Npb25zLnNob3VsZC5oYXZlLmxlbmd0aCgwKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBjYWxsIGlubmVyIGRyaXZlclxcJ3MgZGVsZXRlU2Vzc2lvbiBtZXRob2QnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IFtzZXNzaW9uSWRdID0gKGF3YWl0IGFwcGl1bS5jcmVhdGVTZXNzaW9uKEJBU0VfQ0FQUykpLnZhbHVlO1xuICAgICAgICBtb2NrRmFrZURyaXZlci5leHBlY3RzKCdkZWxldGVTZXNzaW9uJylcbiAgICAgICAgICAub25jZSgpLndpdGhFeGFjdEFyZ3Moc2Vzc2lvbklkLCBbXSlcbiAgICAgICAgICAucmV0dXJucygpO1xuICAgICAgICBhd2FpdCBhcHBpdW0uZGVsZXRlU2Vzc2lvbihzZXNzaW9uSWQpO1xuICAgICAgICBtb2NrRmFrZURyaXZlci52ZXJpZnkoKTtcblxuICAgICAgICAvLyBjbGVhbnVwLCBzaW5jZSB3ZSBmYWtlZCB0aGUgZGVsZXRlIHNlc3Npb24gY2FsbFxuICAgICAgICBhd2FpdCBtb2NrRmFrZURyaXZlci5vYmplY3QuZGVsZXRlU2Vzc2lvbigpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2dldFNlc3Npb25zJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGFwcGl1bTtcbiAgICAgIGxldCBzZXNzaW9ucztcbiAgICAgIGJlZm9yZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFwcGl1bSA9IG5ldyBBcHBpdW1Ecml2ZXIoe30pO1xuICAgICAgfSk7XG4gICAgICBhZnRlckVhY2goYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKGxldCBzZXNzaW9uIG9mIHNlc3Npb25zKSB7XG4gICAgICAgICAgYXdhaXQgYXBwaXVtLmRlbGV0ZVNlc3Npb24oc2Vzc2lvbi5pZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gYW4gZW1wdHkgYXJyYXkgb2Ygc2Vzc2lvbnMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlc3Npb25zID0gYXdhaXQgYXBwaXVtLmdldFNlc3Npb25zKCk7XG4gICAgICAgIHNlc3Npb25zLnNob3VsZC5iZS5hbignYXJyYXknKTtcbiAgICAgICAgc2Vzc2lvbnMuc2hvdWxkLmJlLmVtcHR5O1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIHJldHVybiBzZXNzaW9ucyBjcmVhdGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgc2Vzc2lvbjEgPSAoYXdhaXQgYXBwaXVtLmNyZWF0ZVNlc3Npb24oXy5leHRlbmQoXy5jbG9uZShCQVNFX0NBUFMpLCB7Y2FwOiAndmFsdWUnfSkpKS52YWx1ZTtcbiAgICAgICAgbGV0IHNlc3Npb24yID0gKGF3YWl0IGFwcGl1bS5jcmVhdGVTZXNzaW9uKF8uZXh0ZW5kKF8uY2xvbmUoQkFTRV9DQVBTKSwge2NhcDogJ290aGVyIHZhbHVlJ30pKSkudmFsdWU7XG5cbiAgICAgICAgc2Vzc2lvbnMgPSBhd2FpdCBhcHBpdW0uZ2V0U2Vzc2lvbnMoKTtcbiAgICAgICAgc2Vzc2lvbnMuc2hvdWxkLmJlLmFuKCdhcnJheScpO1xuICAgICAgICBzZXNzaW9ucy5zaG91bGQuaGF2ZS5sZW5ndGgoMik7XG4gICAgICAgIHNlc3Npb25zWzBdLmlkLnNob3VsZC5lcXVhbChzZXNzaW9uMVswXSk7XG4gICAgICAgIHNlc3Npb25zWzBdLmNhcGFiaWxpdGllcy5zaG91bGQuZXFsKHNlc3Npb24xWzFdKTtcbiAgICAgICAgc2Vzc2lvbnNbMV0uaWQuc2hvdWxkLmVxdWFsKHNlc3Npb24yWzBdKTtcbiAgICAgICAgc2Vzc2lvbnNbMV0uY2FwYWJpbGl0aWVzLnNob3VsZC5lcWwoc2Vzc2lvbjJbMV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ2dldFN0YXR1cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBhcHBpdW07XG4gICAgICBiZWZvcmUoZnVuY3Rpb24gKCkge1xuICAgICAgICBhcHBpdW0gPSBuZXcgQXBwaXVtRHJpdmVyKHt9KTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gYSBzdGF0dXMnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBzdGF0dXMgPSBhd2FpdCBhcHBpdW0uZ2V0U3RhdHVzKCk7XG4gICAgICAgIHN0YXR1cy5idWlsZC5zaG91bGQuZXhpc3Q7XG4gICAgICAgIHN0YXR1cy5idWlsZC52ZXJzaW9uLnNob3VsZC5leGlzdDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdzZXNzaW9uRXhpc3RzJywgZnVuY3Rpb24gKCkge1xuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdhdHRhY2hVbmV4cGVjdGVkU2h1dGRvd25IYW5kbGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgbGV0IGFwcGl1bTtcbiAgICAgIGxldCBtb2NrRmFrZURyaXZlcjtcbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBbYXBwaXVtLCBtb2NrRmFrZURyaXZlcl0gPSBnZXREcml2ZXJBbmRGYWtlRHJpdmVyKCk7XG4gICAgICB9KTtcbiAgICAgIGFmdGVyRWFjaChhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF3YWl0IG1vY2tGYWtlRHJpdmVyLm9iamVjdC5kZWxldGVTZXNzaW9uKCk7XG4gICAgICAgIG1vY2tGYWtlRHJpdmVyLnJlc3RvcmUoKTtcbiAgICAgICAgYXBwaXVtLmFyZ3MuZGVmYXVsdENhcGFiaWxpdGllcyA9IHt9O1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcmVtb3ZlIHNlc3Npb24gaWYgaW5uZXIgZHJpdmVyIHVuZXhwZWN0ZWRseSBleGl0cyB3aXRoIGFuIGVycm9yJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgW3Nlc3Npb25JZCxdID0gKGF3YWl0IGFwcGl1bS5jcmVhdGVTZXNzaW9uKF8uY2xvbmUoQkFTRV9DQVBTKSkpLnZhbHVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbW1hLXNwYWNpbmdcbiAgICAgICAgXy5rZXlzKGFwcGl1bS5zZXNzaW9ucykuc2hvdWxkLmNvbnRhaW4oc2Vzc2lvbklkKTtcbiAgICAgICAgYXBwaXVtLnNlc3Npb25zW3Nlc3Npb25JZF0udW5leHBlY3RlZFNodXRkb3duRGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcignT29wcycpKTtcbiAgICAgICAgLy8gbGV0IGV2ZW50IGxvb3Agc3BpbiBzbyByZWplY3Rpb24gaXMgaGFuZGxlZFxuICAgICAgICBhd2FpdCBzbGVlcCgxKTtcbiAgICAgICAgXy5rZXlzKGFwcGl1bS5zZXNzaW9ucykuc2hvdWxkLm5vdC5jb250YWluKHNlc3Npb25JZCk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgcmVtb3ZlIHNlc3Npb24gaWYgaW5uZXIgZHJpdmVyIHVuZXhwZWN0ZWRseSBleGl0cyB3aXRoIG5vIGVycm9yJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgW3Nlc3Npb25JZCxdID0gKGF3YWl0IGFwcGl1bS5jcmVhdGVTZXNzaW9uKF8uY2xvbmUoQkFTRV9DQVBTKSkpLnZhbHVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbW1hLXNwYWNpbmdcbiAgICAgICAgXy5rZXlzKGFwcGl1bS5zZXNzaW9ucykuc2hvdWxkLmNvbnRhaW4oc2Vzc2lvbklkKTtcbiAgICAgICAgYXBwaXVtLnNlc3Npb25zW3Nlc3Npb25JZF0udW5leHBlY3RlZFNodXRkb3duRGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAvLyBsZXQgZXZlbnQgbG9vcCBzcGluIHNvIHJlamVjdGlvbiBpcyBoYW5kbGVkXG4gICAgICAgIGF3YWl0IHNsZWVwKDEpO1xuICAgICAgICBfLmtleXMoYXBwaXVtLnNlc3Npb25zKS5zaG91bGQubm90LmNvbnRhaW4oc2Vzc2lvbklkKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBub3QgcmVtb3ZlIHNlc3Npb24gaWYgaW5uZXIgZHJpdmVyIGNhbmNlbHMgdW5leHBlY3RlZCBleGl0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgW3Nlc3Npb25JZCxdID0gKGF3YWl0IGFwcGl1bS5jcmVhdGVTZXNzaW9uKF8uY2xvbmUoQkFTRV9DQVBTKSkpLnZhbHVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbW1hLXNwYWNpbmdcbiAgICAgICAgXy5rZXlzKGFwcGl1bS5zZXNzaW9ucykuc2hvdWxkLmNvbnRhaW4oc2Vzc2lvbklkKTtcbiAgICAgICAgYXBwaXVtLnNlc3Npb25zW3Nlc3Npb25JZF0ub25VbmV4cGVjdGVkU2h1dGRvd24uY2FuY2VsKCk7XG4gICAgICAgIC8vIGxldCBldmVudCBsb29wIHNwaW4gc28gcmVqZWN0aW9uIGlzIGhhbmRsZWRcbiAgICAgICAgYXdhaXQgc2xlZXAoMSk7XG4gICAgICAgIF8ua2V5cyhhcHBpdW0uc2Vzc2lvbnMpLnNob3VsZC5jb250YWluKHNlc3Npb25JZCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkZXNjcmliZSgnZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnc2hvdWxkIG5vdCBibG93IHVwIGlmIHVzZXIgZG9lcyBub3QgcHJvdmlkZSBwbGF0Zm9ybU5hbWUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGFwcGl1bSA9IG5ldyBBcHBpdW1Ecml2ZXIoe30pO1xuICAgICAgICAoKCkgPT4geyBhcHBpdW0uZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMoe30pOyB9KS5zaG91bGQudGhyb3coL3BsYXRmb3JtTmFtZS8pO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGlnbm9yZSBhdXRvbWF0aW9uTmFtZSBBcHBpdW0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGFwcGl1bSA9IG5ldyBBcHBpdW1Ecml2ZXIoe30pO1xuICAgICAgICBjb25zdCB7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2Fwcyh7XG4gICAgICAgICAgcGxhdGZvcm1OYW1lOiAnQW5kcm9pZCcsXG4gICAgICAgICAgYXV0b21hdGlvbk5hbWU6ICdBcHBpdW0nXG4gICAgICAgIH0pO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoRnVuY3Rpb24pO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKEFuZHJvaWRVaWF1dG9tYXRvcjJEcml2ZXIpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGdldCBYQ1VJVGVzdERyaXZlciBkcml2ZXIgZm9yIGF1dG9tYXRpb25OYW1lIG9mIFhDVUlUZXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBhcHBpdW0gPSBuZXcgQXBwaXVtRHJpdmVyKHt9KTtcbiAgICAgICAgY29uc3Qge2RyaXZlcn0gPSBhcHBpdW0uZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMoe1xuICAgICAgICAgIHBsYXRmb3JtTmFtZTogJ2lPUycsXG4gICAgICAgICAgYXV0b21hdGlvbk5hbWU6ICdYQ1VJVGVzdCdcbiAgICAgICAgfSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuYmUuYW4uaW5zdGFuY2VvZihGdW5jdGlvbik7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoWENVSVRlc3REcml2ZXIpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGdldCBpb3Nkcml2ZXIgZm9yIGlvcyA8IDEwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBhcHBpdW0gPSBuZXcgQXBwaXVtRHJpdmVyKHt9KTtcbiAgICAgICAgY29uc3QgY2FwcyA9IHtcbiAgICAgICAgICBwbGF0Zm9ybU5hbWU6ICdpT1MnLFxuICAgICAgICAgIHBsYXRmb3JtVmVyc2lvbjogJzguMCcsXG4gICAgICAgIH07XG4gICAgICAgIGxldCB7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5iZS5hbi5pbnN0YW5jZW9mKEZ1bmN0aW9uKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChJb3NEcml2ZXIpO1xuXG4gICAgICAgIGNhcHMucGxhdGZvcm1WZXJzaW9uID0gJzguMSc7XG4gICAgICAgICh7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoSW9zRHJpdmVyKTtcblxuICAgICAgICBjYXBzLnBsYXRmb3JtVmVyc2lvbiA9ICc5LjQnO1xuICAgICAgICAoe2RyaXZlcn0gPSBhcHBpdW0uZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMoY2FwcykpO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKElvc0RyaXZlcik7XG5cbiAgICAgICAgY2Fwcy5wbGF0Zm9ybVZlcnNpb24gPSAnJztcbiAgICAgICAgKHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChJb3NEcml2ZXIpO1xuXG4gICAgICAgIGNhcHMucGxhdGZvcm1WZXJzaW9uID0gJ2Zvbyc7XG4gICAgICAgICh7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoSW9zRHJpdmVyKTtcblxuICAgICAgICBkZWxldGUgY2Fwcy5wbGF0Zm9ybVZlcnNpb247XG4gICAgICAgICh7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoSW9zRHJpdmVyKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBnZXQgeGN1aXRlc3Rkcml2ZXIgZm9yIGlvcyA+PSAxMCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgYXBwaXVtID0gbmV3IEFwcGl1bURyaXZlcih7fSk7XG4gICAgICAgIGNvbnN0IGNhcHMgPSB7XG4gICAgICAgICAgcGxhdGZvcm1OYW1lOiAnaU9TJyxcbiAgICAgICAgICBwbGF0Zm9ybVZlcnNpb246ICcxMCcsXG4gICAgICAgIH07XG4gICAgICAgIGxldCB7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5iZS5hbi5pbnN0YW5jZW9mKEZ1bmN0aW9uKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChYQ1VJVGVzdERyaXZlcik7XG5cbiAgICAgICAgY2Fwcy5wbGF0Zm9ybVZlcnNpb24gPSAnMTAuMCc7XG4gICAgICAgICh7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoWENVSVRlc3REcml2ZXIpO1xuXG4gICAgICAgIGNhcHMucGxhdGZvcm1WZXJzaW9uID0gJzEwLjEnO1xuICAgICAgICAoe2RyaXZlcn0gPSBhcHBpdW0uZ2V0RHJpdmVyQW5kVmVyc2lvbkZvckNhcHMoY2FwcykpO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKFhDVUlUZXN0RHJpdmVyKTtcblxuICAgICAgICBjYXBzLnBsYXRmb3JtVmVyc2lvbiA9ICcxMi4xNCc7XG4gICAgICAgICh7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKSk7XG4gICAgICAgIGRyaXZlci5zaG91bGQuZXF1YWwoWENVSVRlc3REcml2ZXIpO1xuICAgICAgfSk7XG4gICAgICBpdCgnc2hvdWxkIGJlIGFibGUgdG8gaGFuZGxlIGRpZmZlcmVudCBjYXNlcyBpbiBhdXRvbWF0aW9uTmFtZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgYXBwaXVtID0gbmV3IEFwcGl1bURyaXZlcih7fSk7XG4gICAgICAgIGNvbnN0IGNhcHMgPSB7XG4gICAgICAgICAgcGxhdGZvcm1OYW1lOiAnaU9TJyxcbiAgICAgICAgICBwbGF0Zm9ybVZlcnNpb246ICcxMCcsXG4gICAgICAgICAgYXV0b21hdGlvbk5hbWU6ICdYY1VpVGVTdCcsXG4gICAgICAgIH07XG4gICAgICAgIGxldCB7ZHJpdmVyfSA9IGFwcGl1bS5nZXREcml2ZXJBbmRWZXJzaW9uRm9yQ2FwcyhjYXBzKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5iZS5hbi5pbnN0YW5jZW9mKEZ1bmN0aW9uKTtcbiAgICAgICAgZHJpdmVyLnNob3VsZC5lcXVhbChYQ1VJVGVzdERyaXZlcik7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgYmUgYWJsZSB0byBoYW5kbGUgZGlmZmVyZW50IGNhc2UgaW4gcGxhdGZvcm1OYW1lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBhcHBpdW0gPSBuZXcgQXBwaXVtRHJpdmVyKHt9KTtcbiAgICAgICAgY29uc3QgY2FwcyA9IHtcbiAgICAgICAgICBwbGF0Zm9ybU5hbWU6ICdJb1MnLFxuICAgICAgICAgIHBsYXRmb3JtVmVyc2lvbjogJzEwJyxcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHtkcml2ZXJ9ID0gYXBwaXVtLmdldERyaXZlckFuZFZlcnNpb25Gb3JDYXBzKGNhcHMpO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmJlLmFuLmluc3RhbmNlb2YoRnVuY3Rpb24pO1xuICAgICAgICBkcml2ZXIuc2hvdWxkLmVxdWFsKFhDVUlUZXN0RHJpdmVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sImZpbGUiOiJ0ZXN0L2RyaXZlci1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
