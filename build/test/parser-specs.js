"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _parser = _interopRequireDefault(require("../lib/parser"));

var _chai = _interopRequireDefault(require("chai"));

const should = _chai.default.should();

const ALLOW_FIXTURE = 'test/fixtures/allow-feat.txt';
const DENY_FIXTURE = 'test/fixtures/deny-feat.txt';
describe('Parser', function () {
  let p = (0, _parser.default)();
  p.debug = true;
  it('should return an arg parser', function () {
    should.exist(p.parseArgs);
    p.parseArgs([]).should.have.property('port');
  });
  it('should keep the raw server flags array', function () {
    should.exist(p.rawArgs);
  });
  it('should have help for every arg', function () {
    for (let arg of p.rawArgs) {
      arg[1].should.have.property('help');
    }
  });
  it('should throw an error with unknown argument', function () {
    (() => {
      p.parseArgs(['--apple']);
    }).should.throw();
  });
  it('should parse default capabilities correctly from a string', function () {
    let defaultCapabilities = {
      a: 'b'
    };
    let args = p.parseArgs(['--default-capabilities', JSON.stringify(defaultCapabilities)]);
    args.defaultCapabilities.should.eql(defaultCapabilities);
  });
  it('should parse default capabilities correctly from a file', function () {
    let defaultCapabilities = {
      a: 'b'
    };
    let args = p.parseArgs(['--default-capabilities', 'test/fixtures/caps.json']);
    args.defaultCapabilities.should.eql(defaultCapabilities);
  });
  it('should throw an error with invalid arg to default capabilities', function () {
    (() => {
      p.parseArgs(['-dc', '42']);
    }).should.throw();
    (() => {
      p.parseArgs(['-dc', 'false']);
    }).should.throw();
    (() => {
      p.parseArgs(['-dc', 'null']);
    }).should.throw();
    (() => {
      p.parseArgs(['-dc', 'does/not/exist.json']);
    }).should.throw();
  });
  it('should parse args that are caps into default capabilities', function () {
    let defaultCapabilities = {
      localizableStringsDir: '/my/dir'
    };
    let args = p.parseArgs(['--localizable-strings-dir', '/my/dir']);
    args.defaultCapabilities.should.eql(defaultCapabilities);
  });
  it('should parse --allow-insecure correctly', function () {
    p.parseArgs([]).allowInsecure.should.eql([]);
    p.parseArgs(['--allow-insecure', '']).allowInsecure.should.eql([]);
    p.parseArgs(['--allow-insecure', 'foo']).allowInsecure.should.eql(['foo']);
    p.parseArgs(['--allow-insecure', 'foo,bar']).allowInsecure.should.eql(['foo', 'bar']);
    p.parseArgs(['--allow-insecure', 'foo ,bar']).allowInsecure.should.eql(['foo', 'bar']);
  });
  it('should parse --deny-insecure correctly', function () {
    p.parseArgs([]).denyInsecure.should.eql([]);
    p.parseArgs(['--deny-insecure', '']).denyInsecure.should.eql([]);
    p.parseArgs(['--deny-insecure', 'foo']).denyInsecure.should.eql(['foo']);
    p.parseArgs(['--deny-insecure', 'foo,bar']).denyInsecure.should.eql(['foo', 'bar']);
    p.parseArgs(['--deny-insecure', 'foo ,bar']).denyInsecure.should.eql(['foo', 'bar']);
  });
  it('should parse --allow and --deny insecure from files', function () {
    const parsed = p.parseArgs(['--allow-insecure', ALLOW_FIXTURE, '--deny-insecure', DENY_FIXTURE]);
    parsed.allowInsecure.should.eql(['feature1', 'feature2', 'feature3']);
    parsed.denyInsecure.should.eql(['nofeature1', 'nofeature2', 'nofeature3']);
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvcGFyc2VyLXNwZWNzLmpzIl0sIm5hbWVzIjpbInNob3VsZCIsImNoYWkiLCJBTExPV19GSVhUVVJFIiwiREVOWV9GSVhUVVJFIiwiZGVzY3JpYmUiLCJwIiwiZGVidWciLCJpdCIsImV4aXN0IiwicGFyc2VBcmdzIiwiaGF2ZSIsInByb3BlcnR5IiwicmF3QXJncyIsImFyZyIsInRocm93IiwiZGVmYXVsdENhcGFiaWxpdGllcyIsImEiLCJhcmdzIiwiSlNPTiIsInN0cmluZ2lmeSIsImVxbCIsImxvY2FsaXphYmxlU3RyaW5nc0RpciIsImFsbG93SW5zZWN1cmUiLCJkZW55SW5zZWN1cmUiLCJwYXJzZWQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBOztBQUNBOztBQUVBLE1BQU1BLE1BQU0sR0FBR0MsY0FBS0QsTUFBTCxFQUFmOztBQUVBLE1BQU1FLGFBQWEsR0FBRyw4QkFBdEI7QUFDQSxNQUFNQyxZQUFZLEdBQUcsNkJBQXJCO0FBRUFDLFFBQVEsQ0FBQyxRQUFELEVBQVcsWUFBWTtBQUM3QixNQUFJQyxDQUFDLEdBQUcsc0JBQVI7QUFDQUEsRUFBQUEsQ0FBQyxDQUFDQyxLQUFGLEdBQVUsSUFBVjtBQUNBQyxFQUFBQSxFQUFFLENBQUMsNkJBQUQsRUFBZ0MsWUFBWTtBQUM1Q1AsSUFBQUEsTUFBTSxDQUFDUSxLQUFQLENBQWFILENBQUMsQ0FBQ0ksU0FBZjtBQUNBSixJQUFBQSxDQUFDLENBQUNJLFNBQUYsQ0FBWSxFQUFaLEVBQWdCVCxNQUFoQixDQUF1QlUsSUFBdkIsQ0FBNEJDLFFBQTVCLENBQXFDLE1BQXJDO0FBQ0QsR0FIQyxDQUFGO0FBSUFKLEVBQUFBLEVBQUUsQ0FBQyx3Q0FBRCxFQUEyQyxZQUFZO0FBQ3ZEUCxJQUFBQSxNQUFNLENBQUNRLEtBQVAsQ0FBYUgsQ0FBQyxDQUFDTyxPQUFmO0FBQ0QsR0FGQyxDQUFGO0FBR0FMLEVBQUFBLEVBQUUsQ0FBQyxnQ0FBRCxFQUFtQyxZQUFZO0FBQy9DLFNBQUssSUFBSU0sR0FBVCxJ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QWdFb0IsR0FBaEUsQ0FBb0UsQ0FBQyxLQUFELEVBQVEsS0FBUixDQUFwRTtBQUNBZixJQUFBQSxDQUFDLENBQUNJLFNBQUYsQ0FBWSxDQUFDLGlCQUFELEVBQW9CLFVBQXBCLENBQVosRUFBNkNjLFlBQTdDLENBQTBEdkIsTUFBMUQsQ0FBaUVvQixHQUFqRSxDQUFxRSxDQUFDLEtBQUQsRUFBUSxLQUFSLENBQXJFO0FBQ0QsR0FOQyxDQUFGO0FBT0FiLEVBQUFBLEVBQUUsQ0FBQyxxREFBRCxFQUF3RCxZQUFZO0FBQ3BFLFVBQU1pQixNQUFNLEdBQUduQixDQUFDLENBQUNJLFNBQUYsQ0FBWSxDQUN6QixrQkFEeUIsRUFDTFAsYUFESyxFQUNVLGlCQURWLEVBQzZCQyxZQUQ3QixDQUFaLENBQWY7QUFHQXFCLElBQUFBLE1BQU0sQ0FBQ0YsYUFBUCxDQUFxQnRCLE1BQXJCLENBQTRCb0IsR0FBNUIsQ0FBZ0MsQ0FBQyxVQUFELEVBQWEsVUFBYixFQUF5QixVQUF6QixDQUFoQztBQUNBSSxJQUFBQSxNQUFNLENBQUNELFlBQVAsQ0FBb0J2QixNQUFwQixDQUEyQm9CLEdBQTNCLENBQStCLENBQUMsWUFBRCxFQUFlLFlBQWYsRUFBNkIsWUFBN0IsQ0FBL0I7QUFDRCxHQU5DLENBQUY7QUFPRCxDQTVETyxDQUFSIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdHJhbnNwaWxlOm1vY2hhXG5cbmltcG9ydCBnZXRQYXJzZXIgZnJvbSAnLi4vbGliL3BhcnNlcic7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcblxuY29uc3Qgc2hvdWxkID0gY2hhaS5zaG91bGQoKTtcblxuY29uc3QgQUxMT1dfRklYVFVSRSA9ICd0ZXN0L2ZpeHR1cmVzL2FsbG93LWZlYXQudHh0JztcbmNvbnN0IERFTllfRklYVFVSRSA9ICd0ZXN0L2ZpeHR1cmVzL2RlbnktZmVhdC50eHQnO1xuXG5kZXNjcmliZSgnUGFyc2VyJywgZnVuY3Rpb24gKCkge1xuICBsZXQgcCA9IGdldFBhcnNlcigpO1xuICBwLmRlYnVnID0gdHJ1ZTsgLy8gdGhyb3cgaW5zdGVhZCBvZiBleGl0IG9uIGVycm9yOyBwYXNzIGFzIG9wdGlvbiBpbnN0ZWFkP1xuICBpdCgnc2hvdWxkIHJldHVybiBhbiBhcmcgcGFyc2VyJywgZnVuY3Rpb24gKCkge1xuICAgIHNob3VsZC5leGlzdChwLnBhcnNlQXJncyk7XG4gICAgcC5wYXJzZUFyZ3MoW10pLnNob3VsZC5oYXZlLnByb3BlcnR5KCdwb3J0Jyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIGtlZXAgdGhlIHJhdyBzZXJ2ZXIgZmxhZ3MgYXJyYXknLCBmdW5jdGlvbiAoKSB7XG4gICAgc2hvdWxkLmV4aXN0KHAucmF3QXJncyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIGhhdmUgaGVscCBmb3IgZXZlcnkgYXJnJywgZnVuY3Rpb24gKCkge1xuICAgIGZvciAobGV0IGFyZyBvZiBwLnJhd0FyZ3MpIHtcbiAgICAgIGFyZ1sxXS5zaG91bGQuaGF2ZS5wcm9wZXJ0eSgnaGVscCcpO1xuICAgIH1cbiAgfSk7XG4gIGl0KCdzaG91bGQgdGhyb3cgYW4gZXJyb3Igd2l0aCB1bmtub3duIGFyZ3VtZW50JywgZnVuY3Rpb24gKCkge1xuICAgICgoKSA9PiB7cC5wYXJzZUFyZ3MoWyctLWFwcGxlJ10pO30pLnNob3VsZC50aHJvdygpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBwYXJzZSBkZWZhdWx0IGNhcGFiaWxpdGllcyBjb3JyZWN0bHkgZnJvbSBhIHN0cmluZycsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgZGVmYXVsdENhcGFiaWxpdGllcyA9IHthOiAnYid9O1xuICAgIGxldCBhcmdzID0gcC5wYXJzZUFyZ3MoWyctLWRlZmF1bHQtY2FwYWJpbGl0aWVzJywgSlNPTi5zdHJpbmdpZnkoZGVmYXVsdENhcGFiaWxpdGllcyldKTtcbiAgICBhcmdzLmRlZmF1bHRDYXBhYmlsaXRpZXMuc2hvdWxkLmVxbChkZWZhdWx0Q2FwYWJpbGl0aWVzKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgcGFyc2UgZGVmYXVsdCBjYXBhYmlsaXRpZXMgY29ycmVjdGx5IGZyb20gYSBmaWxlJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBkZWZhdWx0Q2FwYWJpbGl0aWVzID0ge2E6ICdiJ307XG4gICAgbGV0IGFyZ3MgPSBwLnBhcnNlQXJncyhbJy0tZGVmYXVsdC1jYXBhYmlsaXRpZXMnLCAndGVzdC9maXh0dXJlcy9jYXBzLmpzb24nXSk7XG4gICAgYXJncy5kZWZhdWx0Q2FwYWJpbGl0aWVzLnNob3VsZC5lcWwoZGVmYXVsdENhcGFiaWxpdGllcyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHRocm93IGFuIGVycm9yIHdpdGggaW52YWxpZCBhcmcgdG8gZGVmYXVsdCBjYXBhYmlsaXRpZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgKCgpID0+IHtwLnBhcnNlQXJncyhbJy1kYycsICc0MiddKTt9KS5zaG91bGQudGhyb3coKTtcbiAgICAoKCkgPT4ge3AucGFyc2VBcmdzKFsnLWRjJywgJ2ZhbHNlJ10pO30pLnNob3VsZC50aHJvdygpO1xuICAgICgoKSA9PiB7cC5wYXJzZUFyZ3MoWyctZGMnLCAnbnVsbCddKTt9KS5zaG91bGQudGhyb3coKTtcbiAgICAoKCkgPT4ge3AucGFyc2VBcmdzKFsnLWRjJywgJ2RvZXMvbm90L2V4aXN0Lmpzb24nXSk7fSkuc2hvdWxkLnRocm93KCk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHBhcnNlIGFyZ3MgdGhhdCBhcmUgY2FwcyBpbnRvIGRlZmF1bHQgY2FwYWJpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xuICAgIGxldCBkZWZhdWx0Q2FwYWJpbGl0aWVzID0ge2xvY2FsaXphYmxlU3RyaW5nc0RpcjogJy9teS9kaXInfTtcbiAgICBsZXQgYXJncyA9IHAucGFyc2VBcmdzKFsnLS1sb2NhbGl6YWJsZS1zdHJpbmdzLWRpcicsICcvbXkvZGlyJ10pO1xuICAgIGFyZ3MuZGVmYXVsdENhcGFiaWxpdGllcy5zaG91bGQuZXFsKGRlZmF1bHRDYXBhYmlsaXRpZXMpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBwYXJzZSAtLWFsbG93LWluc2VjdXJlIGNvcnJlY3RseScsIGZ1bmN0aW9uICgpIHtcbiAgICBwLnBhcnNlQXJncyhbXSkuYWxsb3dJbnNlY3VyZS5zaG91bGQuZXFsKFtdKTtcbiAgICBwLnBhcnNlQXJncyhbJy0tYWxsb3ctaW5zZWN1cmUnLCAnJ10pLmFsbG93SW5zZWN1cmUuc2hvdWxkLmVxbChbXSk7XG4gICAgcC5wYXJzZUFyZ3MoWyctLWFsbG93LWluc2VjdXJlJywgJ2ZvbyddKS5hbGxvd0luc2VjdXJlLnNob3VsZC5lcWwoWydmb28nXSk7XG4gICAgcC5wYXJzZUFyZ3MoWyctLWFsbG93LWluc2VjdXJlJywgJ2ZvbyxiYXInXSkuYWxsb3dJbnNlY3VyZS5zaG91bGQuZXFsKFsnZm9vJywgJ2JhciddKTtcbiAgICBwLnBhcnNlQXJncyhbJy0tYWxsb3ctaW5zZWN1cmUnLCAnZm9vICxiYXInXSkuYWxsb3dJbnNlY3VyZS5zaG91bGQuZXFsKFsnZm9vJywgJ2JhciddKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgcGFyc2UgLS1kZW55LWluc2VjdXJlIGNvcnJlY3RseScsIGZ1bmN0aW9uICgpIHtcbiAgICBwLnBhcnNlQXJncyhbXSkuZGVueUluc2VjdXJlLnNob3VsZC5lcWwoW10pO1xuICAgIHAucGFyc2VBcmdzKFsnLS1kZW55LWluc2VjdXJlJywgJyddKS5kZW55SW5zZWN1cmUuc2hvdWxkLmVxbChbXSk7XG4gICAgcC5wYXJzZUFyZ3MoWyctLWRlbnktaW5zZWN1cmUnLCAnZm9vJ10pLmRlbnlJbnNlY3VyZS5zaG91bGQuZXFsKFsnZm9vJ10pO1xuICAgIHAucGFyc2VBcmdzKFsnLS1kZW55LWluc2VjdXJlJywgJ2ZvbyxiYXInXSkuZGVueUluc2VjdXJlLnNob3VsZC5lcWwoWydmb28nLCAnYmFyJ10pO1xuICAgIHAucGFyc2VBcmdzKFsnLS1kZW55LWluc2VjdXJlJywgJ2ZvbyAsYmFyJ10pLmRlbnlJbnNlY3VyZS5zaG91bGQuZXFsKFsnZm9vJywgJ2JhciddKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgcGFyc2UgLS1hbGxvdyBhbmQgLS1kZW55IGluc2VjdXJlIGZyb20gZmlsZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgcGFyc2VkID0gcC5wYXJzZUFyZ3MoW1xuICAgICAgJy0tYWxsb3ctaW5zZWN1cmUnLCBBTExPV19GSVhUVVJFLCAnLS1kZW55LWluc2VjdXJlJywgREVOWV9GSVhUVVJFXG4gICAgXSk7XG4gICAgcGFyc2VkLmFsbG93SW5zZWN1cmUuc2hvdWxkLmVxbChbJ2ZlYXR1cmUxJywgJ2ZlYXR1cmUyJywgJ2ZlYXR1cmUzJ10pO1xuICAgIHBhcnNlZC5kZW55SW5zZWN1cmUuc2hvdWxkLmVxbChbJ25vZmVhdHVyZTEnLCAnbm9mZWF0dXJlMicsICdub2ZlYXR1cmUzJ10pO1xuICB9KTtcbn0pO1xuIl0sImZpbGUiOiJ0ZXN0L3BhcnNlci1zcGVjcy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLiJ9
