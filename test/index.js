var window  = require('global');
var assert  = require('assert');
var mock    = require('..');

describe('xhr-mock', function() {

  describe('.setup() and teardown()', function() {

    it('should setup and teardown the mock XMLHttpRequest class', function() {

      var xhr = window.XMLHttpRequest;
      mock.setup();
      assert.notEqual(window.XMLHttpRequest, xhr);
      mock.teardown();
      assert.equal(window.XMLHttpRequest, xhr);

    });

    it('should remove any handlers', function() {

      mock.get('http://www.google.com/', function() {});
      mock.setup();
      assert.equal(mock.XMLHttpRequest.handlers.length, 0);
      mock.get('http://www.google.com/', function() {});
      mock.teardown();
      assert.equal(mock.XMLHttpRequest.handlers.length, 0);

    });

  });

  describe('.mock()', function() {
    it('should allow registering the handler', function(done) {
      mock.setup();

      mock.mock(function(req, res) {
        return res
          .status(200)
          .body('OK')
        ;
      });

      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/');
      xhr.onload = function() {
        assert.equal(xhr.responseText, 'OK');
        mock.teardown();
        done();
      };
      xhr.send();
    })

    it('should allow registering a specific URL handler', function(done) {
      mock.setup();

      mock.mock('GET', '/a', function(req, res) {
        return res
          .status(200)
          .body('A')
        ;
      });

      mock.mock('GET', '/b', function(req, res) {
        return res
          .status(200)
          .body('B')
        ;
      });

      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/a');
      xhr.onload = function() {
        assert.equal(xhr.responseText, 'A');
        mock.teardown();
        done();
      };
      xhr.send();
    })

    it('should allow registering a handler with URL regexp', function(done) {
      mock.setup();

      mock.mock('POST', /\/a\/\d+/, function(req, res) {
        return res
          .status(200)
          .body(req.url().split('/')[2])
        ;
      });

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/a/123');
      xhr.onload = function() {
        assert.equal(xhr.responseText, '123');
        mock.teardown();
        done();
      };
      xhr.send();
    })
  });

  describe('.addGlobalEventListener()', function() {

    it('should allow registering load global event listener', function(done) {
      mock.setup();

      mock.addGlobalEventListener('load', function(event) {
        mock.teardown();
        done();
      });

      mock.mock(function(req, res) {
        return res;
      });

      var xhr = new XMLHttpRequest();
      xhr.open('/');
      xhr.send();
    });

    it('should call the global event listener for every request', function(done) {
      var testCount = 2;
      var globalLoadCount = 0;

      mock.setup();

      mock.addGlobalEventListener('load', function(event) {
        globalLoadCount++;
        if (globalLoadCount === testCount) {
          mock.teardown();
          done();
        }
      });

      mock.mock(function(req, res) {
        return res;
      });

      var xhr = new XMLHttpRequest();
      xhr.open('/');
      xhr.send();

      var xhr2 = new XMLHttpRequest();
      xhr2.open('/123');
      xhr2.send();

    });

  });

});
