"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.inspectObject = inspectObject;
exports.parseCapsForInnerDriver = parseCapsForInnerDriver;
exports.insertAppiumPrefixes = insertAppiumPrefixes;
exports.getPackageVersion = getPackageVersion;
exports.pullSettings = pullSettings;
exports.rootDir = void 0;

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _logger = _interopRequireDefault(require("./logger"));

var _appiumBaseDriver = require("appium-base-driver");

var _findRoot = _interopRequireDefault(require("find-root"));

const W3C_APPIUM_PREFIX = 'appium';

function inspectObject(args) {
  function getValueArray(obj, indent = '  ') {
    if (!_lodash.default.isObject(obj)) {
      return [obj];
    }

    let strArr = ['{'];

    for (let [arg, value] of _lodash.default.toPairs(obj)) {
      if (!_lodash.default.isObject(value)) {
        strArr.push(`${indent}  ${arg}: ${value}`);
      } else {
        value = getValueArray(value, `${indent}  `);
        strArr.push(`${indent}  ${arg}: ${value.shift()}`);
        strArr.push(...value);
      }
    }

    strArr.push(`${indent}}`);
    return strArr;
  }

  for (let [arg, value] of _lodash.default.toPairs(args)) {
    value = getValueArray(value);

    _logger.default.info(`  ${arg}: ${value.shift()}`);

    for (let val of value) {
      _logger.default.info(val);
    }
  }
}

function parseCapsForInnerDriver(jsonwpCapabilities, w3cCapabilities, constraints = {}, defaultCapabilities = {}) {
  const hasW3CCaps = _lodash.default.isPlainObject(w3cCapabilities) && (_lodash.default.has(w3cCapabilities, 'alwaysMatch') || _lodash.default.has(w3cCapabilities, 'firstMatch'));

  const hasJSONWPCaps = _lodash.default.isPlainObject(jsonwpCapabilities);

  let protocol = null;
  let desiredCaps = {};
  let processedW3CCapabilities = null;
  let processedJsonwpCapabilities = null;

  if (!hasJSONWPCaps && !hasW3CCaps) {
    return {
      protocol: _appiumBaseDriver.PROTOCOLS.W3C,
      error: new Error('Either JSONWP or W3C capabilities should be provided')
    };
  }

  const {
    W3C,
    MJSONWP
  } = _appiumBaseDriver.PROTOCOLS;
  jsonwpCapabilities = _lodash.default.cloneDeep(jsonwpCapabilities);
  w3cCapabilities = _lodash.default.cloneDeep(w3cCapabilities);
  defaultCapabilities = _lodash.default.cloneDeep(defaultCapabilities);

  if (!_lodash.default.isEmpty(defaultCapabilities)) {
    if (hasW3CCaps) {
      const {
        firstMatch = [],
        alwaysMatch = {}
      } = w3cCapabilities;

      for (const [defaultCapKey, defaultCapValue] of _lodash.default.toPairs(defaultCapabilities)) {
        let isCapAlreadySet = false;

        for (const firstMatchEntry of firstMatch) {
          if (_lodash.default.has(removeW3CPrefixes(firstMatchEntry), removeW3CPrefix(defaultCapKey))) {
            isCapAlreadySet = true;
            break;
          }
        }

        isCapAlreadySet = isCapAlreadySet || _lodash.default.has(removeW3CPrefixes(alwaysMatch), removeW3CPrefix(defaultCapKey));

        if (isCapAlreadySet) {
          continue;
        }

        if (_lodash.default.isEmpty(firstMatch)) {
          w3cCapabilities.firstMatch = [{
            [defaultCapKey]: defaultCapValue
          }];
        } else {
          firstMatch[0][defaultCapKey] = defaultCapValue;
        }
      }
    }

    if (hasJSONWPCaps) {
      jsonwpCapabilities = Object.assign({}, removeW3CPrefixes(defaultCapabilities), jsonwpCapabilities);
    }
  }

  if (hasJSONWPCaps) {
    protocol = MJSONWP;
    desiredCaps = jsonwpCapabilities;
    processedJsonwpCapabilities = removeW3CPrefixes({ ...desiredCaps
    });
  }

  if (hasW3CCaps) {
    protocol = W3C;
    let isFixingNeededForW3cCaps = false;

    try {
      desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
    } catch (error) {
      if (!hasJSONWPCaps) {
        return {
          desiredCaps,
          processedJsonwpCapabilities,
          processedW3CCapabilities,
          protocol,
          error
        };
      }

      _logger.default.info(`Could not parse W3C capabilities: ${error.message}`);

      isFixingNeededForW3cCaps = true;
    }

    if (hasJSONWPCaps && !isFixingNeededForW3cCaps) {
      const differingKeys = _lodash.default.difference(_lodash.default.keys(processedJsonwpCapabilities), _lodash.default.keys(removeW3CPrefixes(desiredCaps)));

      if (!_lodash.default.isEmpty(differingKeys)) {
        _logger.default.info(`The following capabilities were provided in the JSONWP desired capabilities that are missing ` + `in W3C capabilities: ${JSON.stringify(differingKeys)}`);

        isFixingNeededForW3cCaps = true;
      }
    }

    if (isFixingNeededForW3cCaps && hasJSONWPCaps) {
      _logger.default.info('Trying to fix W3C capabilities by merging them with JSONWP caps');

      w3cCapabilities = fixW3cCapabilities(w3cCapabilities, jsonwpCapabilities);

      try {
        desiredCaps = (0, _appiumBaseDriver.processCapabilities)(w3cCapabilities, constraints, true);
      } catch (error) {
        _logger.default.warn(`Could not parse fixed W3C capabilities: ${error.message}. Falling back to JSONWP protocol`);

        return {
          desiredCaps: processedJsonwpCapabilities,
          processedJsonwpCapabilities,
          processedW3CCapabilities: null,
          protocol: MJSONWP
        };
      }
    }

    processedW3CCapabilities = {
      alwaysMatch: { ...insertAppiumPrefixes(desiredCaps)
      },
      firstMatch: [{}]
    };
  }

  return {
    desiredCaps,
    processedJsonwpCapabilities,
    processedW3CCapabilities,
    protocol
  };
}

function fixW3cCapabilities(w3cCaps, jsonwpCaps) {
  const result = {
    firstMatch: w3cCaps.firstMatch || [],
    alwaysMatch: w3cCaps.alwaysMatch || {}
  };

  const keysToInsert = _lodash.default.keys(jsonwpCaps);

  const removeMatchingKeys = match => {
    _lodash.default.pull(keysToInsert, match);

    const colonIndex = match.indexOf(':');

    if (colonIndex >= 0 && match.length > colonIndex) {
      _lodash.default.pull(keysToInsert, match.substring(colonIndex + 1));
    }

    if (keysToInsert.includes(`${W3C_APPIUM_PREFIX}:${match}`)) {
      _lodash.default.pull(keysToInsert, `${W3C_APPIUM_PREFIX}:${match}`);
    }
  };

  for (const firstMatchEntry of result.firstMatch) {
    for (const pair of _lodash.default.toPairs(firstMatchEntry)) {
      removeMatchingKeys(pair[0]);
    }
  }

  for (const pair of _lodash.default.toPairs(result.alwaysMatch)) {
    removeMatchingKeys(pair[0]);
  }

  for (const key of keysToInsert) {
    result.alwaysMatch[key] = jsonwpCaps[key];
  }

  return result;
}

function insertAppiumPrefixes(caps) {
  const STANDARD_CAPS = ['browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts', 'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'unhandledPromptBehavior'];
  let prefixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    if (STANDARD_CAPS.includes(name) || name.includes(':')) {
      prefixedCaps[name] = value;
    } else {
      prefixedCaps[`${W3C_APPIUM_PREFIX}:${name}`] = value;
    }
  }

  return prefixedCaps;
}

function removeW3CPrefixes(caps) {
  if (!_lodash.default.isPlainObject(caps)) {
    return caps;
  }

  const fixedCaps = {};

  for (let [name, value] of _lodash.default.toPairs(caps)) {
    fixedCaps[removeW3CPrefix(name)] = value;
  }

  return fixedCaps;
}

function removeW3CPrefix(key) {
  const colonPos = key.indexOf(':');
  return colonPos > 0 && key.length > colonPos ? key.substring(colonPos + 1) : key;
}

function getPackageVersion(pkgName) {
  const pkgInfo = require(`${pkgName}/package.json`) || {};
  return pkgInfo.version;
}

function pullSettings(caps) {
  if (!_lodash.default.isPlainObject(caps) || _lodash.default.isEmpty(caps)) {
    return {};
  }

  const result = {};

  for (const [key, value] of _lodash.default.toPairs(caps)) {
    const match = /\bsettings\[(\S+)\]$/.exec(key);

    if (!match) {
      continue;
    }

    result[match[1]] = value;
    delete caps[key];
  }

  return result;
}

const rootDir = (0, _findRoot.default)(__dirname);
exports.rootDir = rootDir;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi91dGlscy5qcyJdLCJuYW1lcyI6WyJXM0NfQVBQSVVNX1BSRUZJWCIsImluc3BlY3RPYmplY3QiLCJhcmdzIiwiZ2V0VmFsdWVBcnJheSIsIm9iaiIsImluZGVudCIsIl8iLCJpc09iamVjdCIsInN0ckFyciIsImFyZyIsInZhbHVlIiwidG9QYWlycyIsInB1c2giLCJzaGlmdCIsImxvZ2dlciIsImluZm8iLCJ2YWwiLCJwYXJzZUNhcHNGb3JJbm5lckRyaXZlciIsImpzb253cENhcGFiaWxpdGllcyIsInczY0NhcGFiaWxpdGllcyIsImNvbnN0cmFpbnRzIiwiZGVmYXVsdENhcGFiaWxpdGllcyIsImhhc1czQ0NhcHMiLCJpc1BsYWluT2JqZWN0IiwiaGFzIiwiaGFzSlNPTldQQ2FwcyIsInByb3RvY29sIiwiZGVzaXJlZENhcHMiLCJwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMiLCJwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMiLCJQUk9UT0NPTFMiLCJXM0MiLCJlcnJvciIsIkVycm9yIiwiTUpTT05XUCIsImNsb25lRGVlcCIsImlzRW1wdHkiLCJmaXJzdE1hdGNoIiwiYWx3YXlzTWF0Y2giLCJkZWZhdWx0Q2FwS2V5IiwiZGVmYXVsdENhcFZhbHVlIiwiaXNDYXBBbHJlYWR5U2V0IiwiZmlyc3RNYXRjaEVudHJ5IiwicmVtb3ZlVzNDUHJlZml4ZXMiLCJyZW1vdmVXM0NQcmVmaXgiLCJPYmplY3QiLCJhc3NpZ24iLCJpc0ZpeGluZ05lZWRlZEZvclczY0NhcHMiLCJtZXNzYWdlIiwiZGlmZmVyaW5nS2V5cyIsImRpZmZlcmVuY2UiLCJrZXlzIiwiSlNPTiIsInN0cmluZ2lmeSIsImZpeFczY0NhcGFiaWxpdGllcyIsIndhcm4iLCJpbnNlcnRBcHBpdW1QcmVmaXhlcyIsInczY0NhcHMiLCJqc29ud3BDYXBzIiwicmVzdWx0Iiwia2V5c1RvSW5zZXJ0IiwicmVtb3ZlTWF0Y2hpbmdLZXlzIiwibWF0Y2giLCJwdWxsIiwiY29sb25JbmRleCIsImluZGV4T2YiLCJsZW5ndGgiLCJzdWJzdHJpbmciLCJpbmNsdWRlcyIsInBhaXIiLCJrZXkiLCJjYXBzIiwiU1RBTkRBUkRfQ0FQUyIsInByZWZpeGVkQ2FwcyIsIm5hbWUiLCJmaXhlZENhcHMiLCJjb2xvblBvcyIsImdldFBhY2thZ2VWZXJzaW9uIiwicGtnTmFtZSIsInBrZ0luZm8iLCJyZXF1aXJlIiwidmVyc2lvbiIsInB1bGxTZXR0aW5ncyIsImV4ZWMiLCJyb290RGlyIiwiX19kaXJuYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsaUJBQWlCLEdBQUcsUUFBMUI7O0FBRUEsU0FBU0MsYUFBVCxDQUF3QkMsSUFBeEIsRUFBOEI7QUFDNUIsV0FBU0MsYUFBVCxDQUF3QkMsR0FBeEIsRUFBNkJDLE1BQU0sR0FBRyxJQUF0QyxFQUE0QztBQUMxQyxRQUFJLENBQUNDLGdCQUFFQyxRQUFGLENBQVdILEdBQVgsQ0FBTCxFQUFzQjtBQUNwQixhQUFPLENBQUNBLEdBQUQsQ0FBUDtBQUNEOztBQUVELFFBQUlJLE1BQU0sR0FBRyxDQUFDLEdBQUQsQ0FBYjs7QUFDQSxTQUFLLElBQUksQ0FBQ0MsR0FBRCxFQUFNQyxLQUFOLENBQVQsSUFBeUJKLGdCQUFFSyxPQUFGLENBQVVQLEdBQVYsQ0FBekIsRUFBeUM7QUFDdkMsVUFBSSxDQUFDRSxnQkFBRUMsUUFBRixDQUFXRyxLQUFYLENBQUwsRUFBd0I7QUFDdEJGLFFBQUFBLE1BQU0sQ0FBQ0ksSUFBUCxDQUFhLEdBQUVQLE1BQU8sS0FBSUksR0FBSSxLQUFJQyxLQUFNLEVBQXhDO0FBQ0QsT0FGRCxNQUVPO0FBQ0xBLFFBQUFBLEtBQUssR0FBR1AsYUFBYSxDQUFDTyxLQUFELEVBQVMsR0FBRUwsTUFBTyxJQUFsQixDQUFyQjtBQUNBRyxRQUFBQSxNQUFNLENBQUNJLElBQVAsQ0FBYSxHQUFFUCxNQUFPLEtBQUlJLEdBQUksS0FBSUMsS0FBSyxDQUFDRyxLQUFOLEVBQWMsRUFB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QUNEOztBQUVELFFBQU1aLE1BQU0sR0FBRyxFQUFmOztBQUNBLE9BQUssTUFBTSxDQUFDVyxHQUFELEVBQU01RCxLQUFOLENBQVgsSUFBMkJKLGdCQUFFSyxPQUFGLENBQVU0RCxJQUFWLENBQTNCLEVBQTRDO0FBQzFDLFVBQU1ULEtBQUssR0FBRyx1QkFBdUJxQixJQUF2QixDQUE0QmIsR0FBNUIsQ0FBZDs7QUFDQSxRQUFJLENBQUNSLEtBQUwsRUFBWTtBQUNWO0FBQ0Q7O0FBRURILElBQUFBLE1BQU0sQ0FBQ0csS0FBSyxDQUFDLENBQUQsQ0FBTixDQUFOLEdBQW1CcEQsS0FBbkI7QUFDQSxXQUFPNkQsSUFBSSxDQUFDRCxHQUFELENBQVg7QUFDRDs7QUFDRCxTQUFPWCxNQUFQO0FBQ0Q7O0FBRUQsTUFBTXlCLE9BQU8sR0FBRyx1QkFBU0MsU0FBVCxDQUFoQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IHByb2Nlc3NDYXBhYmlsaXRpZXMsIFBST1RPQ09MUyB9IGZyb20gJ2FwcGl1bS1iYXNlLWRyaXZlcic7XG5pbXBvcnQgZmluZFJvb3QgZnJvbSAnZmluZC1yb290JztcblxuY29uc3QgVzNDX0FQUElVTV9QUkVGSVggPSAnYXBwaXVtJztcblxuZnVuY3Rpb24gaW5zcGVjdE9iamVjdCAoYXJncykge1xuICBmdW5jdGlvbiBnZXRWYWx1ZUFycmF5IChvYmosIGluZGVudCA9ICcgICcpIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkge1xuICAgICAgcmV0dXJuIFtvYmpdO1xuICAgIH1cblxuICAgIGxldCBzdHJBcnIgPSBbJ3snXTtcbiAgICBmb3IgKGxldCBbYXJnLCB2YWx1ZV0gb2YgXy50b1BhaXJzKG9iaikpIHtcbiAgICAgIGlmICghXy5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fSAgJHthcmd9OiAke3ZhbHVlfWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBnZXRWYWx1ZUFycmF5KHZhbHVlLCBgJHtpbmRlbnR9ICBgKTtcbiAgICAgICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fSAgJHthcmd9OiAke3ZhbHVlLnNoaWZ0KCl9YCk7XG4gICAgICAgIHN0ckFyci5wdXNoKC4uLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RyQXJyLnB1c2goYCR7aW5kZW50fX1gKTtcbiAgICByZXR1cm4gc3RyQXJyO1xuICB9XG4gIGZvciAobGV0IFthcmcsIHZhbHVlXSBvZiBfLnRvUGFpcnMoYXJncykpIHtcbiAgICB2YWx1ZSA9IGdldFZhbHVlQXJyYXkodmFsdWUpO1xuICAgIGxvZ2dlci5pbmZvKGAgICR7YXJnfTogJHt2YWx1ZS5zaGlmdCgpfWApO1xuICAgIGZvciAobGV0IHZhbCBvZiB2YWx1ZSkge1xuICAgICAgbG9nZ2VyLmluZm8odmFsKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyB0aGUgY2FwcyB0aGF0IHdlcmUgcHJvdmlkZWQgaW4gdGhlIHJlcXVlc3QgYW5kIHRyYW5zbGF0ZXMgdGhlbVxuICogaW50byBjYXBzIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIGlubmVyIGRyaXZlcnMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGpzb253cENhcGFiaWxpdGllc1xuICogQHBhcmFtIHtPYmplY3R9IHczY0NhcGFiaWxpdGllc1xuICogQHBhcmFtIHtPYmplY3R9IGNvbnN0cmFpbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmYXVsdENhcGFiaWxpdGllc1xuICovXG5mdW5jdGlvbiBwYXJzZUNhcHNGb3JJbm5lckRyaXZlciAoanNvbndwQ2FwYWJpbGl0aWVzLCB3M2NDYXBhYmlsaXRpZXMsIGNvbnN0cmFpbnRzID0ge30sIGRlZmF1bHRDYXBhYmlsaXRpZXMgPSB7fSkge1xuICAvLyBDaGVjayBpZiB0aGUgY2FsbGVyIHNlbnQgSlNPTldQIGNhcHMsIFczQyBjYXBzLCBvciBib3RoXG4gIGNvbnN0IGhhc1czQ0NhcHMgPSBfLmlzUGxhaW5PYmplY3QodzNjQ2FwYWJpbGl0aWVzKSAmJlxuICAgIChfLmhhcyh3M2NDYXBhYmlsaXRpZXMsICdhbHdheXNNYXRjaCcpIHx8IF8uaGFzKHczY0NhcGFiaWxpdGllcywgJ2ZpcnN0TWF0Y2gnKSk7XG4gIGNvbnN0IGhhc0pTT05XUENhcHMgPSBfLmlzUGxhaW5PYmplY3QoanNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgbGV0IHByb3RvY29sID0gbnVsbDtcbiAgbGV0IGRlc2lyZWRDYXBzID0ge307XG4gIGxldCBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMgPSBudWxsO1xuICBsZXQgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzID0gbnVsbDtcblxuICBpZiAoIWhhc0pTT05XUENhcHMgJiYgIWhhc1czQ0NhcHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdG9jb2w6IFBST1RPQ09MUy5XM0MsXG4gICAgICBlcnJvcjogbmV3IEVycm9yKCdFaXRoZXIgSlNPTldQIG9yIFczQyBjYXBhYmlsaXRpZXMgc2hvdWxkIGJlIHByb3ZpZGVkJyksXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHtXM0MsIE1KU09OV1B9ID0gUFJPVE9DT0xTO1xuXG4gIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBtdXRhdGUgdGhlIG9yaWdpbmFsIGFyZ3VtZW50c1xuICBqc29ud3BDYXBhYmlsaXRpZXMgPSBfLmNsb25lRGVlcChqc29ud3BDYXBhYmlsaXRpZXMpO1xuICB3M2NDYXBhYmlsaXRpZXMgPSBfLmNsb25lRGVlcCh3M2NDYXBhYmlsaXRpZXMpO1xuICBkZWZhdWx0Q2FwYWJpbGl0aWVzID0gXy5jbG9uZURlZXAoZGVmYXVsdENhcGFiaWxpdGllcyk7XG5cbiAgaWYgKCFfLmlzRW1wdHkoZGVmYXVsdENhcGFiaWxpdGllcykpIHtcbiAgICBpZiAoaGFzVzNDQ2Fwcykge1xuICAgICAgY29uc3Qge2ZpcnN0TWF0Y2ggPSBbXSwgYWx3YXlzTWF0Y2ggPSB7fX0gPSB3M2NDYXBhYmlsaXRpZXM7XG4gICAgICBmb3IgKGNvbnN0IFtkZWZhdWx0Q2FwS2V5LCBkZWZhdWx0Q2FwVmFsdWVdIG9mIF8udG9QYWlycyhkZWZhdWx0Q2FwYWJpbGl0aWVzKSkge1xuICAgICAgICBsZXQgaXNDYXBBbHJlYWR5U2V0ID0gZmFsc2U7XG4gICAgICAgIGZvciAoY29uc3QgZmlyc3RNYXRjaEVudHJ5IG9mIGZpcnN0TWF0Y2gpIHtcbiAgICAgICAgICBpZiAoXy5oYXMocmVtb3ZlVzNDUHJlZml4ZXMoZmlyc3RNYXRjaEVudHJ5KSwgcmVtb3ZlVzNDUHJlZml4KGRlZmF1bHRDYXBLZXkpKSkge1xuICAgICAgICAgICAgaXNDYXBBbHJlYWR5U2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpc0NhcEFscmVhZHlTZXQgPSBpc0NhcEFscmVhZHlTZXQgfHwgXy5oYXMocmVtb3ZlVzNDUHJlZml4ZXMoYWx3YXlzTWF0Y2gpLCByZW1vdmVXM0NQcmVmaXgoZGVmYXVsdENhcEtleSkpO1xuICAgICAgICBpZiAoaXNDYXBBbHJlYWR5U2V0KSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPbmx5IGFkZCB0aGUgZGVmYXVsdCBjYXBhYmlsaXR5IGlmIGl0IGlzIG5vdCBvdmVycmlkZGVuXG4gICAgICAgIGlmIChfLmlzRW1wdHkoZmlyc3RNYXRjaCkpIHtcbiAgICAgICAgICB3M2NDYXBhYmlsaXRpZXMuZmlyc3RNYXRjaCA9IFt7W2RlZmF1bHRDYXBLZXldOiBkZWZhdWx0Q2FwVmFsdWV9XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmaXJzdE1hdGNoWzBdW2RlZmF1bHRDYXBLZXldID0gZGVmYXVsdENhcFZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChoYXNKU09OV1BDYXBzKSB7XG4gICAgICBqc29ud3BDYXBhYmlsaXRpZXMgPSBPYmplY3QuYXNzaWduKHt9LCByZW1vdmVXM0NQcmVmaXhlcyhkZWZhdWx0Q2FwYWJpbGl0aWVzKSwganNvbndwQ2FwYWJpbGl0aWVzKTtcbiAgICB9XG4gIH1cblxuICAvLyBHZXQgTUpTT05XUCBjYXBzXG4gIGlmIChoYXNKU09OV1BDYXBzKSB7XG4gICAgcHJvdG9jb2wgPSBNSlNPTldQO1xuICAgIGRlc2lyZWRDYXBzID0ganNvbndwQ2FwYWJpbGl0aWVzO1xuICAgIHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyA9IHJlbW92ZVczQ1ByZWZpeGVzKHsuLi5kZXNpcmVkQ2Fwc30pO1xuICB9XG5cbiAgLy8gR2V0IFczQyBjYXBzXG4gIGlmIChoYXNXM0NDYXBzKSB7XG4gICAgcHJvdG9jb2wgPSBXM0M7XG4gICAgLy8gQ2FsbCB0aGUgcHJvY2VzcyBjYXBhYmlsaXRpZXMgYWxnb3JpdGhtIHRvIGZpbmQgbWF0Y2hpbmcgY2FwcyBvbiB0aGUgVzNDXG4gICAgLy8gKHNlZTogaHR0cHM6Ly9naXRodWIuY29tL2psaXBwcy9zaW1wbGUtd2Qtc3BlYyNwcm9jZXNzaW5nLWNhcGFiaWxpdGllcylcbiAgICBsZXQgaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgIGRlc2lyZWRDYXBzID0gcHJvY2Vzc0NhcGFiaWxpdGllcyh3M2NDYXBhYmlsaXRpZXMsIGNvbnN0cmFpbnRzLCB0cnVlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKCFoYXNKU09OV1BDYXBzKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGVzaXJlZENhcHMsXG4gICAgICAgICAgcHJvY2Vzc2VkSnNvbndwQ2FwYWJpbGl0aWVzLFxuICAgICAgICAgIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllcyxcbiAgICAgICAgICBwcm90b2NvbCxcbiAgICAgICAgICBlcnJvcixcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGxvZ2dlci5pbmZvKGBDb3VsZCBub3QgcGFyc2UgVzNDIGNhcGFiaWxpdGllczogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoaGFzSlNPTldQQ2FwcyAmJiAhaXNGaXhpbmdOZWVkZWRGb3JXM2NDYXBzKSB7XG4gICAgICBjb25zdCBkaWZmZXJpbmdLZXlzID0gXy5kaWZmZXJlbmNlKF8ua2V5cyhwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMpLCBfLmtleXMocmVtb3ZlVzNDUHJlZml4ZXMoZGVzaXJlZENhcHMpKSk7XG4gICAgICBpZiAoIV8uaXNFbXB0eShkaWZmZXJpbmdLZXlzKSkge1xuICAgICAgICBsb2dnZXIuaW5mbyhgVGhlIGZvbGxvd2luZyBjYXBhYmlsaXRpZXMgd2VyZSBwcm92aWRlZCBpbiB0aGUgSlNPTldQIGRlc2lyZWQgY2FwYWJpbGl0aWVzIHRoYXQgYXJlIG1pc3NpbmcgYCArXG4gICAgICAgICAgYGluIFczQyBjYXBhYmlsaXRpZXM6ICR7SlNPTi5zdHJpbmdpZnkoZGlmZmVyaW5nS2V5cyl9YCk7XG4gICAgICAgIGlzRml4aW5nTmVlZGVkRm9yVzNjQ2FwcyA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzRml4aW5nTmVlZGVkRm9yVzNjQ2FwcyAmJiBoYXNKU09OV1BDYXBzKSB7XG4gICAgICBsb2dnZXIuaW5mbygnVHJ5aW5nIHRvIGZpeCBXM0MgY2FwYWJpbGl0aWVzIGJ5IG1lcmdpbmcgdGhlbSB3aXRoIEpTT05XUCBjYXBzJyk7XG4gICAgICB3M2NDYXBhYmlsaXRpZXMgPSBmaXhXM2NDYXBhYmlsaXRpZXModzNjQ2FwYWJpbGl0aWVzLCBqc29ud3BDYXBhYmlsaXRpZXMpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGVzaXJlZENhcHMgPSBwcm9jZXNzQ2FwYWJpbGl0aWVzKHczY0NhcGFiaWxpdGllcywgY29uc3RyYWludHMsIHRydWUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oYENvdWxkIG5vdCBwYXJzZSBmaXhlZCBXM0MgY2FwYWJpbGl0aWVzOiAke2Vycm9yLm1lc3NhZ2V9LiBGYWxsaW5nIGJhY2sgdG8gSlNPTldQIHByb3RvY29sYCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGVzaXJlZENhcHM6IHByb2Nlc3NlZEpzb253cENhcGFiaWxpdGllcyxcbiAgICAgICAgICBwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMsXG4gICAgICAgICAgcHJvY2Vzc2VkVzNDQ2FwYWJpbGl0aWVzOiBudWxsLFxuICAgICAgICAgIHByb3RvY29sOiBNSlNPTldQLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIG5ldyB3M2MgY2FwYWJpbGl0aWVzIHBheWxvYWQgdGhhdCBjb250YWlucyBvbmx5IHRoZSBtYXRjaGluZyBjYXBzIGluIGBhbHdheXNNYXRjaGBcbiAgICBwcm9jZXNzZWRXM0NDYXBhYmlsaXRpZXMgPSB7XG4gICAgICBhbHdheXNNYXRjaDogey4uLmluc2VydEFwcGl1bVByZWZpeGVzKGRlc2lyZWRDYXBzKX0sXG4gICAgICBmaXJzdE1hdGNoOiBbe31dLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge2Rlc2lyZWRDYXBzLCBwcm9jZXNzZWRKc29ud3BDYXBhYmlsaXRpZXMsIHByb2Nlc3NlZFczQ0NhcGFiaWxpdGllcywgcHJvdG9jb2x9O1xufVxuXG4vKipcbiAqIFRoaXMgaGVscGVyIG1ldGhvZCB0cmllcyB0byBmaXggY29ycnVwdGVkIFczQyBjYXBhYmlsaXRpZXMgYnlcbiAqIG1lcmdpbmcgdGhlbSB0byBleGlzdGluZyBKU09OV1AgY2FwYWJpbGl0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB3M2NDYXBzIFczQyBjYXBhYmlsaXRpZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBqc29ud3BDYXBzIEpTT05XUCBjYXBhYmlsaXRpZXNcbiAqIEByZXR1cm5zIHtPYmplY3R9IEZpeGVkIFczQyBjYXBhYmlsaXRpZXNcbiAqL1xuZnVuY3Rpb24gZml4VzNjQ2FwYWJpbGl0aWVzICh3M2NDYXBzLCBqc29ud3BDYXBzKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHtcbiAgICBmaXJzdE1hdGNoOiB3M2NDYXBzLmZpcnN0TWF0Y2ggfHwgW10sXG4gICAgYWx3YXlzTWF0Y2g6IHczY0NhcHMuYWx3YXlzTWF0Y2ggfHwge30sXG4gIH07XG4gIGNvbnN0IGtleXNUb0luc2VydCA9IF8ua2V5cyhqc29ud3BDYXBzKTtcbiAgY29uc3QgcmVtb3ZlTWF0Y2hpbmdLZXlzID0gKG1hdGNoKSA9PiB7XG4gICAgXy5wdWxsKGtleXNUb0luc2VydCwgbWF0Y2gpO1xuICAgIGNvbnN0IGNvbG9uSW5kZXggPSBtYXRjaC5pbmRleE9mKCc6Jyk7XG4gICAgaWYgKGNvbG9uSW5kZXggPj0gMCAmJiBtYXRjaC5sZW5ndGggPiBjb2xvbkluZGV4KSB7XG4gICAgICBfLnB1bGwoa2V5c1RvSW5zZXJ0LCBtYXRjaC5zdWJzdHJpbmcoY29sb25JbmRleCArIDEpKTtcbiAgICB9XG4gICAgaWYgKGtleXNUb0luc2VydC5pbmNsdWRlcyhgJHtXM0NfQVBQSVVNX1BSRUZJWH06JHttYXRjaH1gKSkge1xuICAgICAgXy5wdWxsKGtleXNUb0luc2VydCwgYCR7VzNDX0FQUElVTV9QUkVGSVh9OiR7bWF0Y2h9YCk7XG4gICAgfVxuICB9O1xuXG4gIGZvciAoY29uc3QgZmlyc3RNYXRjaEVudHJ5IG9mIHJlc3VsdC5maXJzdE1hdGNoKSB7XG4gICAgZm9yIChjb25zdCBwYWlyIG9mIF8udG9QYWlycyhmaXJzdE1hdGNoRW50cnkpKSB7XG4gICAgICByZW1vdmVNYXRjaGluZ0tleXMocGFpclswXSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBwYWlyIG9mIF8udG9QYWlycyhyZXN1bHQuYWx3YXlzTWF0Y2gpKSB7XG4gICAgcmVtb3ZlTWF0Y2hpbmdLZXlzKHBhaXJbMF0pO1xuICB9XG5cbiAgZm9yIChjb25zdCBrZXkgb2Yga2V5c1RvSW5zZXJ0KSB7XG4gICAgcmVzdWx0LmFsd2F5c01hdGNoW2tleV0gPSBqc29ud3BDYXBzW2tleV07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIGNhcGFiaWxpdGllcyBvYmplY3RzIGFuZCBwcmVmaXhlcyBjYXBhYmlsaXRpZXMgd2l0aCBgYXBwaXVtOmBcbiAqIEBwYXJhbSB7T2JqZWN0fSBjYXBzIERlc2lyZWQgY2FwYWJpbGl0aWVzIG9iamVjdFxuICovXG5mdW5jdGlvbiBpbnNlcnRBcHBpdW1QcmVmaXhlcyAoY2Fwcykge1xuICAvLyBTdGFuZGFyZCwgbm9uLXByZWZpeGVkIGNhcGFiaWxpdGllcyAoc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi93ZWJkcml2ZXIvI2Rmbi10YWJsZS1vZi1zdGFuZGFyZC1jYXBhYmlsaXRpZXMpXG4gIGNvbnN0IFNUQU5EQVJEX0NBUFMgPSBbXG4gICAgJ2Jyb3dzZXJOYW1lJyxcbiAgICAnYnJvd3NlclZlcnNpb24nLFxuICAgICdwbGF0Zm9ybU5hbWUnLFxuICAgICdhY2NlcHRJbnNlY3VyZUNlcnRzJyxcbiAgICAncGFnZUxvYWRTdHJhdGVneScsXG4gICAgJ3Byb3h5JyxcbiAgICAnc2V0V2luZG93UmVjdCcsXG4gICAgJ3RpbWVvdXRzJyxcbiAgICAndW5oYW5kbGVkUHJvbXB0QmVoYXZpb3InXG4gIF07XG5cbiAgbGV0IHByZWZpeGVkQ2FwcyA9IHt9O1xuICBmb3IgKGxldCBbbmFtZSwgdmFsdWVdIG9mIF8udG9QYWlycyhjYXBzKSkge1xuICAgIGlmIChTVEFOREFSRF9DQVBTLmluY2x1ZGVzKG5hbWUpIHx8IG5hbWUuaW5jbHVkZXMoJzonKSkge1xuICAgICAgcHJlZml4ZWRDYXBzW25hbWVdID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZWZpeGVkQ2Fwc1tgJHtXM0NfQVBQSVVNX1BSRUZJWH06JHtuYW1lfWBdID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBwcmVmaXhlZENhcHM7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVczQ1ByZWZpeGVzIChjYXBzKSB7XG4gIGlmICghXy5pc1BsYWluT2JqZWN0KGNhcHMpKSB7XG4gICAgcmV0dXJuIGNhcHM7XG4gIH1cblxuICBjb25zdCBmaXhlZENhcHMgPSB7fTtcbiAgZm9yIChsZXQgW25hbWUsIHZhbHVlXSBvZiBfLnRvUGFpcnMoY2FwcykpIHtcbiAgICBmaXhlZENhcHNbcmVtb3ZlVzNDUHJlZml4KG5hbWUpXSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBmaXhlZENhcHM7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVczQ1ByZWZpeCAoa2V5KSB7XG4gIGNvbnN0IGNvbG9uUG9zID0ga2V5LmluZGV4T2YoJzonKTtcbiAgcmV0dXJuIGNvbG9uUG9zID4gMCAmJiBrZXkubGVuZ3RoID4gY29sb25Qb3MgPyBrZXkuc3Vic3RyaW5nKGNvbG9uUG9zICsgMSkgOiBrZXk7XG59XG5cbmZ1bmN0aW9uIGdldFBhY2thZ2VWZXJzaW9uIChwa2dOYW1lKSB7XG4gIGNvbnN0IHBrZ0luZm8gPSByZXF1aXJlKGAke3BrZ05hbWV9L3BhY2thZ2UuanNvbmApIHx8IHt9O1xuICByZXR1cm4gcGtnSW5mby52ZXJzaW9uO1xufVxuXG4vKipcbiAqIFB1bGxzIHRoZSBpbml0aWFsIHZhbHVlcyBvZiBBcHBpdW0gc2V0dGluZ3MgZnJvbSB0aGUgZ2l2ZW4gY2FwYWJpbGl0aWVzIGFyZ3VtZW50LlxuICogRWFjaCBzZXR0aW5nIGl0ZW0gbXVzdCBzYXRpc2Z5IHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICogYHNldHRpbmdbc2V0dGluZ19uYW1lXTogc2V0dGluZ192YWx1ZWBcbiAqIFRoZSBjYXBhYmlsaXRpZXMgYXJndW1lbnQgaXRzZWxmIGdldHMgbXV0YXRlZCwgc28gaXQgZG9lcyBub3QgY29udGFpbiBwYXJzZWRcbiAqIHNldHRpbmdzIGFueW1vcmUgdG8gYXZvaWQgZnVydGhlciBwYXJzaW5nIGlzc3Vlcy5cbiAqIENoZWNrXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYXBwaXVtL2FwcGl1bS9ibG9iL21hc3Rlci9kb2NzL2VuL2FkdmFuY2VkLWNvbmNlcHRzL3NldHRpbmdzLm1kXG4gKiBmb3IgbW9yZSBkZXRhaWxzIG9uIHRoZSBhdmFpbGFibGUgc2V0dGluZ3MuXG4gKlxuICogQHBhcmFtIHs/T2JqZWN0fSBjYXBzIC0gQ2FwYWJpbGl0aWVzIGRpY3Rpb25hcnkuIEl0IGlzIG11dGF0ZWQgaWZcbiAqIG9uZSBvciBtb3JlIHNldHRpbmdzIGhhdmUgYmVlbiBwdWxsZWQgZnJvbSBpdFxuICogQHJldHVybnMge09iamVjdH0gLSBBbiBlbXB0eSBkaWN0aW9uYXJ5IGlmIHRoZSBnaXZlbiBjYXBzIGNvbnRhaW5zIG5vXG4gKiBzZXR0aW5nIGl0ZW1zIG9yIGEgZGljdGlvbmFyeSBjb250YWluaW5nIHBhcnNlZCBBcHBpdW0gc2V0dGluZyBuYW1lcyBhbG9uZyB3aXRoXG4gKiB0aGVpciB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIHB1bGxTZXR0aW5ncyAoY2Fwcykge1xuICBpZiAoIV8uaXNQbGFpbk9iamVjdChjYXBzKSB8fCBfLmlzRW1wdHkoY2FwcykpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSB7fTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgXy50b1BhaXJzKGNhcHMpKSB7XG4gICAgY29uc3QgbWF0Y2ggPSAvXFxic2V0dGluZ3NcXFsoXFxTKylcXF0kLy5leGVjKGtleSk7XG4gICAgaWYgKCFtYXRjaCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzdWx0W21hdGNoWzFdXSA9IHZhbHVlO1xuICAgIGRlbGV0ZSBjYXBzW2tleV07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY29uc3Qgcm9vdERpciA9IGZpbmRSb290KF9fZGlybmFtZSk7XG5cbmV4cG9ydCB7XG4gIGluc3BlY3RPYmplY3QsIHBhcnNlQ2Fwc0ZvcklubmVyRHJpdmVyLCBpbnNlcnRBcHBpdW1QcmVmaXhlcywgcm9vdERpcixcbiAgZ2V0UGFja2FnZVZlcnNpb24sIHB1bGxTZXR0aW5ncyxcbn07XG4iXSwiZmlsZSI6ImxpYi91dGlscy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
