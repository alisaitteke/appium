"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initSession = initSession;
exports.W3C_CAPS = exports.W3C_PREFIXED_CAPS = exports.BASE_CAPS = exports.TEST_PORT = exports.TEST_HOST = exports.TEST_FAKE_APP = void 0;

require("source-map-support/register");

var _path = _interopRequireDefault(require("path"));

var _wd = _interopRequireDefault(require("wd"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _utils = require("../lib/utils");

const TEST_HOST = 'localhost';
exports.TEST_HOST = TEST_HOST;
const TEST_PORT = 4723;
exports.TEST_PORT = TEST_PORT;

const TEST_FAKE_APP = _path.default.resolve(__dirname, '..', '..', 'node_modules', 'appium-fake-driver', 'test', 'fixtures', 'app.xml');

exports.TEST_FAKE_APP = TEST_FAKE_APP;

function initSession(caps) {
  let resolve = () => {};

  let driver;
  before(async function () {
    driver = _wd.default.promiseChainRemote({
      host: TEST_HOST,
      port: TEST_PORT
    });
    resolve(driver);
    await driver.init(caps);
  });
  after(async function () {
    await driver.quit();
  });
  return new _bluebird.default(_resolve => {
    resolve = _resolve;
  });
}

const BASE_CAPS = {
  platformName: 'Fake',
  deviceName: 'Fake',
  app: TEST_FAKE_APP
};
exports.BASE_CAPS = BASE_CAPS;
const W3C_PREFIXED_CAPS = { ...(0, _utils.insertAppiumPrefixes)(BASE_CAPS)
};
exports.W3C_PREFIXED_CAPS = W3C_PREFIXED_CAPS;
const W3C_CAPS = {
  alwaysMatch: { ...W3C_PREFIXED_CAPS
  },
  firstMatch: [{}]
};
exports.W3C_CAPS = W3C_CAPS;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvaGVscGVycy5qcyJdLCJuYW1lcyI6WyJURVNUX0hPU1QiLCJURVNUX1BPUlQiLCJURVNUX0ZBS0VfQVBQIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJpbml0U2Vzc2lvbiIsImNhcHMiLCJkcml2ZXIiLCJiZWZvcmUiLCJ3ZCIsInByb21pc2VDaGFpblJlbW90ZSIsImhvc3QiLCJwb3J0IiwiaW5pdCIsImFmdGVyIiwicXVpdCIsIkIiLCJfcmVzb2x2ZSIsIkJBU0VfQ0FQUyIsInBsYXRmb3JtTmFtZSIsImRldmljZU5hbWUiLCJhcHAiLCJXM0NfUFJFRklYRURfQ0FQUyIsIlczQ19DQVBTIiwiYWx3YXlzTWF0Y2giLCJmaXJzdE1hdGNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxTQUFTLEdBQUcsV0FBbEI7O0FBQ0EsTUFBTUMsU0FBUyxHQUFHLElBQWxCOzs7QUFDQSxNQUFNQyxhQUFhLEdBQUdDLGNBQUtDLE9BQUwsQ0FBYUMsU0FBYixFQUF3QixJQUF4QixFQUE4QixJQUE5QixFQUFvQyxjQUFwQyxFQUNhLG9CQURiLEVBQ21DLE1BRG5DLEVBQzJDLFVBRDNDLEVBRWEsU0FGYixDQUF0Qjs7OztBQUlBLFNBQVNDLFdBQVQsQ0FBc0JDLElBQXRCLEVBQTRCO0FBQzFCLE1BQUlILE9BQU8sR0FBRyxNQUFNLENBQUUsQ0FBdEI7O0FBQ0EsTUFBSUksTUFBSjtBQUNBQyxFQUFBQSxNQUFNLENBQUMsa0JBQWtCO0FBQ3ZCRCxJQUFBQSxNQUFNLEdBQUdFLFlBQUdDLGtCQUFILENBQXNCO0FBQUNDLE1BQUFBLElBQUksRUFBRVosU0FBUDtBQUFrQmEsTUFBQUEsSUFBSSxFQUFFWjtBQUF4QixLQUF0QixDQUFUO0FBQ0FHLElBQUFBLE9BQU8sQ0FBQ0ksTUFBRCxDQUFQO0FBQ0EsVUFBTUEsTUFBTSxDQUFDTSxJQUFQLENBQVlQLElBQVosQ0FBTjtBQUNELEdBSkssQ0FBTjtBQUtBUSxFQUFBQSxLQUFLLENBQUMsa0JBQWtCO0FBQ3RCLFVBQU1QLE1BQU0sQ0FBQ1EsSUFBUCxFQUFOO0FBQ0QsR0FGSSxDQUFMO0FBR0EsU0FBTyxJQUFJQyxpQkFBSixDQUFPQyxRQUFELElBQWM7QUFDekJkLElBQUFBLE9BQU8sR0FBR2MsUUFBVjtBQUNELEdBRk0sQ0FBUDtBQUdEOztBQUVELE1BQU1DLFNBQVMsR0FBRztBQUFDQyxFQUFBQSxZQUFZLEVBQUUsTUFBZjtBQUF1QkMsRUFBQUEsVUFBVSxFQUFFLE1BQW5DO0FBQTJDQyxFQUFBQSxHQUFHLEVBQUVwQjtBQUFoRCxDQUFsQjs7QUFDQSxNQUFNcUIsaUJBQWlCLEdBQUcsRUFBQyxHQUFHLGlDQUFxQkosU0FBckI7QUFBSixDQUExQjs7QUFDQSxNQUFNSyxRQUFRLEdBQUc7QUFDZkMsRUFBQUEsV0FBVyxFQUFFLEVBQUMsR0FBR0Y7QUFBSixHQURFO0FBRWZHLEVBQUFBLFVBQVUsRUFBRSxDQUFDLEVBQUQ7QUFGRyxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHdkIGZyb20gJ3dkJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7aW5zZXJ0QXBwaXVtUHJlZml4ZXN9IGZyb20gJy4uL2xpYi91dGlscyc7XG5cbmNvbnN0IFRFU1RfSE9TVCA9ICdsb2NhbGhvc3QnO1xuY29uc3QgVEVTVF9QT1JUID0gNDcyMztcbmNvbnN0IFRFU1RfRkFLRV9BUFAgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnbm9kZV9tb2R1bGVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FwcGl1bS1mYWtlLWRyaXZlcicsICd0ZXN0JywgJ2ZpeHR1cmVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FwcC54bWwnKTtcblxuZnVuY3Rpb24gaW5pdFNlc3Npb24gKGNhcHMpIHtcbiAgbGV0IHJlc29sdmUgPSAoKSA9PiB7fTtcbiAgbGV0IGRyaXZlcjtcbiAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBkcml2ZXIgPSB3ZC5wcm9taXNlQ2hhaW5SZW1vdGUoe2hvc3Q6IFRFU1RfSE9TVCwgcG9ydDogVEVTVF9QT1JUfSk7XG4gICAgcmVzb2x2ZShkcml2ZXIpO1xuICAgIGF3YWl0IGRyaXZlci5pbml0KGNhcHMpO1xuICB9KTtcbiAgYWZ0ZXIoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGF3YWl0IGRyaXZlci5xdWl0KCk7XG4gIH0pO1xuICByZXR1cm4gbmV3IEIoKF9yZXNvbHZlKSA9PiB7XG4gICAgcmVzb2x2ZSA9IF9yZXNvbHZlO1xuICB9KTtcbn1cblxuY29uc3QgQkFTRV9DQVBTID0ge3BsYXRmb3JtTmFtZTogJ0Zha2UnLCBkZXZpY2VOYW1lOiAnRmFrZScsIGFwcDogVEVTVF9GQUtFX0FQUH07XG5jb25zdCBXM0NfUFJFRklYRURfQ0FQUyA9IHsuLi5pbnNlcnRBcHBpdW1QcmVmaXhlcyhCQVNFX0NBUFMpfTtcbmNvbnN0IFczQ19DQVBTID0ge1xuICBhbHdheXNNYXRjaDogey4uLlczQ19QUkVGSVhFRF9DQVBTfSxcbiAgZmlyc3RNYXRjaDogW3t9XSxcbn07XG5cbmV4cG9ydCB7IGluaXRTZXNzaW9uLCBURVNUX0ZBS0VfQVBQLCBURVNUX0hPU1QsIFRFU1RfUE9SVCwgQkFTRV9DQVBTLCBXM0NfUFJFRklYRURfQ0FQUywgVzNDX0NBUFMgfTtcbiJdLCJmaWxlIjoidGVzdC9oZWxwZXJzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uIn0=
