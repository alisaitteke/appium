"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CLIENT_URL_TYPES = exports.validator = void 0;

require("source-map-support/register");

var _validate = _interopRequireDefault(require("validate.js"));

var _lodash = _interopRequireDefault(require("lodash"));

_validate.default.validators.array = function array(value, options, key, attributes) {
  if (attributes[key] && !_validate.default.isArray(attributes[key])) {
    return `must be an array`;
  }
};

_validate.default.validators.hasAttributes = function hasAttributes(value, options) {
  if (!value) {
    return;
  }

  if (!_lodash.default.isArray(value)) {
    value = [value];
  }

  for (const item of value) {
    for (const option of options) {
      if (_lodash.default.isUndefined(item[option])) {
        return `must have attributes: ${options}`;
      }
    }
  }
};

_validate.default.validators.hasPossibleAttributes = function hasPossibleAttributes(value, options) {
  if (!value) {
    return;
  }

  if (!_lodash.default.isArray(value)) {
    return;
  }

  for (const item of value) {
    for (const key of _lodash.default.keys(item)) {
      if (!options.includes(key)) {
        return `must not include '${key}'. Available options: ${options}`;
      }
    }
  }
};

const CLIENT_URL_TYPES = {
  url: 'hostname',
  android: 'Android',
  ios: 'iOS'
};
exports.CLIENT_URL_TYPES = CLIENT_URL_TYPES;
const validator = {
  'name': {
    presence: true
  },
  'short_description': {
    presence: true
  },
  'example_usage': {},
  'example_usage.java': {},
  'example_usage.javascript_wdio': {},
  'example_usage.javascript_wd': {},
  'example_usage.ruby': {},
  'example_usage.ruby_core': {},
  'example_usage.csharp': {},
  'example_usage.php': {},
  'description': {},
  'client_docs.java': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.javascript_wdio': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.javascript_wd': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.ruby': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.ruby_core': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.csharp': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'client_docs.php': {
    hasPossibleAttributes: _lodash.default.keys(CLIENT_URL_TYPES)
  },
  'endpoint': {
    presence: true
  },
  'driver_support': {
    presence: true
  },
  'endpoint.url': {
    presence: true
  },
  'endpoint.url_parameters': {
    array: true,
    hasAttributes: ['name', 'description']
  },
  'endpoint.json_parameters': {
    array: true,
    hasAttributes: ['name', 'description']
  },
  'endpoint.response': {
    hasAttributes: ['type', 'description']
  },
  'specifications': {
    presence: true
  },
  'links': {
    array: true,
    hasAttributes: ['name', 'url']
  }
};
exports.validator = validator;
var _default = validator;
exports.default = _default;require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1hbmRzLXltbC92YWxpZGF0b3IuanMiXSwibmFtZXMiOlsidmFsaWRhdGUiLCJ2YWxpZGF0b3JzIiwiYXJyYXkiLCJ2YWx1ZSIsIm9wdGlvbnMiLCJrZXkiLCJhdHRyaWJ1dGVzIiwiaXNBcnJheSIsImhhc0F0dHJpYnV0ZXMiLCJfIiwiaXRlbSIsIm9wdGlvbiIsImlzVW5kZWZpbmVkIiwiaGFzUG9zc2libGVBdHRyaWJ1dGVzIiwia2V5cyIsImluY2x1ZGVzIiwiQ0xJRU5UX1VSTF9UWVBFUyIsInVybCIsImFuZHJvaWQiLCJpb3MiLCJ2YWxpZGF0b3IiLCJwcmVzZW5jZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFHQUEsa0JBQVNDLFVBQVQsQ0FBb0JDLEtBQXBCLEdBQTRCLFNBQVNBLEtBQVQsQ0FBZ0JDLEtBQWhCLEVBQXVCQyxPQUF2QixFQUFnQ0MsR0FBaEMsRUFBcUNDLFVBQXJDLEVBQWlEO0FBQzNFLE1BQUlBLFVBQVUsQ0FBQ0QsR0FBRCxDQUFWLElBQW1CLENBQUNMLGtCQUFTTyxPQUFULENBQWlCRCxVQUFVLENBQUNELEdBQUQsQ0FBM0IsQ0FBeEIsRUFBMkQ7QUFDekQsV0FBUSxrQkFBUjtBQUNEO0FBQ0YsQ0FKRDs7QUFNQUwsa0JBQVNDLFVBQVQsQ0FBb0JPLGFBQXBCLEdBQW9DLFNBQVNBLGFBQVQsQ0FBd0JMLEtBQXhCLEVBQStCQyxPQUEvQixFQUF3QztBQUMxRSxNQUFJLENBQUNELEtBQUwsRUFBWTtBQUNWO0FBQ0Q7O0FBRUQsTUFBSSxDQUFDTSxnQkFBRUYsT0FBRixDQUFVSixLQUFWLENBQUwsRUFBdUI7QUFDckJBLElBQUFBLEtBQUssR0FBRyxDQUFDQSxLQUFELENBQVI7QUFDRDs7QUFFRCxPQUFLLE1BQU1PLElBQVgsSUFBbUJQLEtBQW5CLEVBQTBCO0FBQ3hCLFNBQUssTUFBTVEsTUFBWCxJQUFxQlAsT0FBckIsRUFBOEI7QUFDNUIsVUFBSUssZ0JBQUVHLFdBQUYsQ0FBY0YsSUFBSSxD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O0FBeUJoQixvQkFBa0I7QUFBQ2EsSUFBQUEsUUFBUSxFQUFFO0FBQVgsR0F6QkY7QUEwQmhCLFdBQVM7QUFBQ25CLElBQUFBLEtBQUssRUFBRSxJQUFSO0FBQWNNLElBQUFBLGFBQWEsRUFBRSxDQUFDLE1BQUQsRUFBUyxLQUFUO0FBQTdCO0FBMUJPLENBQWxCOztlQStCZVksUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB2YWxpZGF0ZSBmcm9tICd2YWxpZGF0ZS5qcyc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuXG5cbnZhbGlkYXRlLnZhbGlkYXRvcnMuYXJyYXkgPSBmdW5jdGlvbiBhcnJheSAodmFsdWUsIG9wdGlvbnMsIGtleSwgYXR0cmlidXRlcykge1xuICBpZiAoYXR0cmlidXRlc1trZXldICYmICF2YWxpZGF0ZS5pc0FycmF5KGF0dHJpYnV0ZXNba2V5XSkpIHtcbiAgICByZXR1cm4gYG11c3QgYmUgYW4gYXJyYXlgO1xuICB9XG59O1xuXG52YWxpZGF0ZS52YWxpZGF0b3JzLmhhc0F0dHJpYnV0ZXMgPSBmdW5jdGlvbiBoYXNBdHRyaWJ1dGVzICh2YWx1ZSwgb3B0aW9ucykge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFfLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgdmFsdWUgPSBbdmFsdWVdO1xuICB9XG5cbiAgZm9yIChjb25zdCBpdGVtIG9mIHZhbHVlKSB7XG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgaWYgKF8uaXNVbmRlZmluZWQoaXRlbVtvcHRpb25dKSkge1xuICAgICAgICByZXR1cm4gYG11c3QgaGF2ZSBhdHRyaWJ1dGVzOiAke29wdGlvbnN9YDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbnZhbGlkYXRlLnZhbGlkYXRvcnMuaGFzUG9zc2libGVBdHRyaWJ1dGVzID0gZnVuY3Rpb24gaGFzUG9zc2libGVBdHRyaWJ1dGVzICh2YWx1ZSwgb3B0aW9ucykge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaWYganVzdCBhIGJhcmUgdmFsdWUsIGFsbG93IGl0IHRocm91Z2hcbiAgaWYgKCFfLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZm9yIChjb25zdCBpdGVtIG9mIHZhbHVlKSB7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgXy5rZXlzKGl0ZW0pKSB7XG4gICAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICByZXR1cm4gYG11c3Qgbm90IGluY2x1ZGUgJyR7a2V5fScuIEF2YWlsYWJsZSBvcHRpb25zOiAke29wdGlvbnN9YDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbmNvbnN0IENMSUVOVF9VUkxfVFlQRVMgPSB7XG4gIHVybDogJ2hvc3RuYW1lJyxcbiAgYW5kcm9pZDogJ0FuZHJvaWQnLFxuICBpb3M6ICdpT1MnLFxufTtcblxuY29uc3QgdmFsaWRhdG9yID0ge1xuICAnbmFtZSc6IHtwcmVzZW5jZTogdHJ1ZX0sXG4gICdzaG9ydF9kZXNjcmlwdGlvbic6IHtwcmVzZW5jZTogdHJ1ZX0sXG4gICdleGFtcGxlX3VzYWdlJzoge30sXG4gICdleGFtcGxlX3VzYWdlLmphdmEnOiB7fSxcbiAgJ2V4YW1wbGVfdXNhZ2UuamF2YXNjcmlwdF93ZGlvJzoge30sXG4gICdleGFtcGxlX3VzYWdlLmphdmFzY3JpcHRfd2QnOiB7fSxcbiAgJ2V4YW1wbGVfdXNhZ2UucnVieSc6IHt9LFxuICAnZXhhbXBsZV91c2FnZS5ydWJ5X2NvcmUnOiB7fSxcbiAgJ2V4YW1wbGVfdXNhZ2UuY3NoYXJwJzoge30sXG4gICdleGFtcGxlX3VzYWdlLnBocCc6IHt9LFxuICAnZGVzY3JpcHRpb24nOiB7fSxcbiAgJ2NsaWVudF9kb2NzLmphdmEnOiB7aGFzUG9zc2libGVBdHRyaWJ1dGVzOiBfLmtleXMoQ0xJRU5UX1VSTF9UWVBFUyl9LFxuICAnY2xpZW50X2RvY3MuamF2YXNjcmlwdF93ZGlvJzoge2hhc1Bvc3NpYmxlQXR0cmlidXRlczogXy5rZXlzKENMSUVOVF9VUkxfVFlQRVMpfSxcbiAgJ2NsaWVudF9kb2NzLmphdmFzY3JpcHRfd2QnOiB7aGFzUG9zc2libGVBdHRyaWJ1dGVzOiBfLmtleXMoQ0xJRU5UX1VSTF9UWVBFUyl9LFxuICAnY2xpZW50X2RvY3MucnVieSc6IHtoYXNQb3NzaWJsZUF0dHJpYnV0ZXM6IF8ua2V5cyhDTElFTlRfVVJMX1RZUEVTKX0sXG4gICdjbGllbnRfZG9jcy5ydWJ5X2NvcmUnOiB7aGFzUG9zc2libGVBdHRyaWJ1dGVzOiBfLmtleXMoQ0xJRU5UX1VSTF9UWVBFUyl9LFxuICAnY2xpZW50X2RvY3MuY3NoYXJwJzoge2hhc1Bvc3NpYmxlQXR0cmlidXRlczogXy5rZXlzKENMSUVOVF9VUkxfVFlQRVMpfSxcbiAgJ2NsaWVudF9kb2NzLnBocCc6IHtoYXNQb3NzaWJsZUF0dHJpYnV0ZXM6IF8ua2V5cyhDTElFTlRfVVJMX1RZUEVTKX0sXG4gICdlbmRwb2ludCc6IHtwcmVzZW5jZTogdHJ1ZX0sXG4gICdkcml2ZXJfc3VwcG9ydCc6IHtwcmVzZW5jZTogdHJ1ZX0sXG4gICdlbmRwb2ludC51cmwnOiB7cHJlc2VuY2U6IHRydWV9LFxuICAnZW5kcG9pbnQudXJsX3BhcmFtZXRlcnMnOiB7YXJyYXk6IHRydWUsIGhhc0F0dHJpYnV0ZXM6IFsnbmFtZScsICdkZXNjcmlwdGlvbiddfSxcbiAgJ2VuZHBvaW50Lmpzb25fcGFyYW1ldGVycyc6IHthcnJheTogdHJ1ZSwgaGFzQXR0cmlidXRlczogWyduYW1lJywgJ2Rlc2NyaXB0aW9uJ119LFxuICAnZW5kcG9pbnQucmVzcG9uc2UnOiB7aGFzQXR0cmlidXRlczogWyd0eXBlJywgJ2Rlc2NyaXB0aW9uJ10gfSxcbiAgJ3NwZWNpZmljYXRpb25zJzoge3ByZXNlbmNlOiB0cnVlfSxcbiAgJ2xpbmtzJzoge2FycmF5OiB0cnVlLCBoYXNBdHRyaWJ1dGVzOiBbJ25hbWUnLCAndXJsJ119LFxufTtcblxuXG5leHBvcnQgeyB2YWxpZGF0b3IsIENMSUVOVF9VUkxfVFlQRVMgfTtcbmV4cG9ydCBkZWZhdWx0IHZhbGlkYXRvcjtcbiJdLCJmaWxlIjoiY29tbWFuZHMteW1sL3ZhbGlkYXRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
