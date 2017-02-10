var window              = require('global');
var MockXMLHttpRequest  = require('./lib/MockXMLHttpRequest');
var real                = window.XMLHttpRequest;
var mock                = MockXMLHttpRequest;

/**
 * Mock utility
 */
module.exports = {

  XMLHttpRequest: MockXMLHttpRequest,

  _globalEventListeners: [],

  /**
   * Replace the native XHR with the mocked XHR
   * @returns {exports}
   */
  setup: function() {
    window.XMLHttpRequest = mock;
    return this.reset();
  },

  /**
   * Replace the mocked XHR with the native XHR and remove any handlers
   * @returns {exports}
   */
  teardown: function() {
    window.XMLHttpRequest = real;
    return this.reset();
  },

  /**
   * Remove any handlers
   * @returns {exports}
   */
  reset: function() {
    this._globalEventListeners = [];
    MockXMLHttpRequest.reset();
    return this;
  },

  /**
   * Mock a request
   * @param   {string}    [method]
   * @param   {string}    [url]
   * @param   {Function}  fn
   * @returns {exports}
   */
  mock: function(method, url, fn) {
    var handler, matcher;
    if (arguments.length === 3) {
      matcher = function(req) {
        if (req.method() !== method) return false;
        var reqUrl = req.url();
        // allow regexp urls matcher
        if (url instanceof RegExp) return url.test(reqUrl);
        // otherwise assume the url is a string
        return url === reqUrl;
      }
      handler = function(req, res) {
        if (matcher(req)) {
          return fn(req, res);
        }
        return false;
      };
    } else {
      handler = method;
    }

    MockXMLHttpRequest.addHandler(handler, this._globalEventListeners);

    return this;
  },

  /**
   * Mock a GET request
   * @param   {String}    url
   * @param   {Function}  fn
   * @returns {exports}
   */
  get: function(url, fn) {
    return this.mock('GET', url, fn);
  },

  /**
   * Mock a POST request
   * @param   {String}    url
   * @param   {Function}  fn
   * @returns {exports}
   */
  post: function(url, fn) {
    return this.mock('POST', url, fn);
  },

  /**
   * Mock a PUT request
   * @param   {String}    url
   * @param   {Function}  fn
   * @returns {exports}
   */
  put: function(url, fn) {
    return this.mock('PUT', url, fn);
  },

  /**
   * Mock a PATCH request
   * @param   {String}    url
   * @param   {Function}  fn
   * @returns {exports}
   */
  patch: function(url, fn) {
    return this.mock('PATCH', url, fn);
  },

  /**
   * Mock a DELETE request
   * @param   {String}    url
   * @param   {Function}  fn
   * @returns {exports}
   */
  delete: function(url, fn) {
    return this.mock('DELETE', url, fn);
  },

  /**
   * Add an event listener for all requests
   * @param   {String}    event
   * @param   {Function}  listener
   * @returns {null}
   */
  addGlobalEventListener: function(event, listener) {
    this._globalEventListeners.push({
      event: event,
      listener: listener
    });
  }

};
