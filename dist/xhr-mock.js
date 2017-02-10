(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xhrMock = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var window              = require('global');
var MockXMLHttpRequest  = require('./lib/MockXMLHttpRequest');
var real                = window.XMLHttpRequest;
var mock                = MockXMLHttpRequest;

/**
 * Mock utility
 */
module.exports = {

  XMLHttpRequest: MockXMLHttpRequest,

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

    MockXMLHttpRequest.addHandler(handler);

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
  }

};

},{"./lib/MockXMLHttpRequest":4,"global":5}],2:[function(require,module,exports){
var URL = require('url-parse');

/**
 * The mocked request data
 * @constructor
 */
function MockRequest(xhr) {
  this._xhr       = xhr
  this._method    = xhr.method;
  this._url       = xhr.url;
  this._headers   = {};
  this.headers(xhr._requestHeaders);
  this.body(xhr.data);
}

/**
 * Get/set the HTTP method
 * @returns {string}
 */
MockRequest.prototype.method = function() {
  return this._method;
};

/**
 * Get/set the HTTP URL
 * @returns {string}
 */
MockRequest.prototype.url = function() {
  return this._url;
};

/**
 * Get/set the parsed URL query
 * @returns {Object}
 */
MockRequest.prototype.query = function() {
  var url = new URL(this._url, true);
  return url.query;
}

/**
 * Get/set a HTTP header
 * @param   {string} name
 * @param   {string} [value]
 * @returns {string|undefined|MockRequest}
 */
MockRequest.prototype.header = function(name, value) {
  if (arguments.length === 2) {
    this._headers[name.toLowerCase()] = value;
    return this;
  } else {
    return this._headers[name.toLowerCase()] || null;
  }
};

/**
 * Get/set all of the HTTP headers
 * @param   {Object} [headers]
 * @returns {Object|MockRequest}
 */
MockRequest.prototype.headers = function(headers) {
  if (arguments.length) {
    for (var name in headers) {
      if (headers.hasOwnProperty(name)) {
        this.header(name, headers[name]);
      }
    }
    return this;
  } else {
    return this._headers;
  }
};

/**
 * Get/set the HTTP body
 * @param   {string} [body]
 * @returns {string|MockRequest}
 */
MockRequest.prototype.body = function(body) {
  if (arguments.length) {
    this._body = body;
    return this;
  } else {
    return this._body;
  }
};

/**
 * Trigger progress event
 * @param   {number} [loaded]
 * @param   {number} [total]
 * @param   {boolean} [lengthComputable]
 * @returns {}
 */
MockRequest.prototype.progress = function(loaded, total, lengthComputable) {
  this._xhr.trigger('progress', {
    lengthComputable: lengthComputable || true,
    loaded: loaded,
    total: total
  })
};

module.exports = MockRequest;

},{"url-parse":8}],3:[function(require,module,exports){

/**
 * The mocked response data
 * @constructor
 */
function MockResponse() {
  this._status      = 200;
  this._headers     = {};
  this._body        = '';
  this._timeout     = false;
}

/**
 * Get/set the HTTP status
 * @param   {number} [code]
 * @returns {number|MockResponse}
 */
MockResponse.prototype.status = function(code) {
  if (arguments.length) {
    this._status = code;
    return this;
  } else {
    return this._status;
  }
};

/**
 * Get/set a HTTP header
 * @param   {string} name
 * @param   {string} [value]
 * @returns {string|undefined|MockResponse}
 */
MockResponse.prototype.header = function(name, value) {
  if (arguments.length === 2) {
    this._headers[name.toLowerCase()] = value;
    return this;
  } else {
    return this._headers[name.toLowerCase()] || null;
  }
};

/**
 * Get/set all of the HTTP headers
 * @param   {Object} [headers]
 * @returns {Object|MockResponse}
 */
MockResponse.prototype.headers = function(headers) {
  if (arguments.length) {
    for (var name in headers) {
      if (headers.hasOwnProperty(name)) {
        this.header(name, headers[name]);
      }
    }
    return this;
  } else {
    return this._headers;
  }
};

/**
 * Get/set the HTTP body
 * @param   {string} [body]
 * @returns {string|MockResponse}
 */
MockResponse.prototype.body = function(body) {
  if (arguments.length) {
    this._body = body;
    return this;
  } else {
    return this._body;
  }
};

/**
 * Get/set the HTTP timeout
 * @param   {boolean|number} [timeout]
 * @returns {boolean|number|MockResponse}
 */
MockResponse.prototype.timeout = function(timeout) {
  if (arguments.length) {
    this._timeout = timeout;
    return this;
  } else {
    return this._timeout;
  }
};

module.exports = MockResponse;

},{}],4:[function(require,module,exports){
var MockRequest   = require('./MockRequest');
var MockResponse  = require('./MockResponse');

var notImplementedError = new Error('This feature hasn\'t been implmented yet. Please submit an Issue or Pull Request on Github.');

//https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
//https://xhr.spec.whatwg.org/
//http://www.w3.org/TR/2006/WD-XMLHttpRequest-20060405/

MockXMLHttpRequest.STATE_UNSENT             = 0;
MockXMLHttpRequest.STATE_OPENED             = 1;
MockXMLHttpRequest.STATE_HEADERS_RECEIVED   = 2;
MockXMLHttpRequest.STATE_LOADING            = 3;
MockXMLHttpRequest.STATE_DONE               = 4;

/**
 * The request handlers
 * @private
 * @type {Array}
 */
MockXMLHttpRequest.handlers = [];

/**
 * Add a request handler
 * @param   {function(MockRequest, MockResponse)} fn
 * @returns {MockXMLHttpRequest}
 */
MockXMLHttpRequest.addHandler = function(fn) {
  MockXMLHttpRequest.handlers.push(fn);
  return this;
};

/**
 * Remove a request handler
 * @param   {function(MockRequest, MockResponse)} fn
 * @returns {MockXMLHttpRequest}
 */
MockXMLHttpRequest.removeHandler = function(fn) {
  throw notImplementedError;
};

/**
 * Remove all request handlers
 */
MockXMLHttpRequest.reset = function() {
  MockXMLHttpRequest.handlers = [];
}

/**
 * Handle a request
 * @param   {MockRequest} request
 * @returns {MockResponse|null}
 */
MockXMLHttpRequest.handle = function(request) {

  for (var i=0; i<MockXMLHttpRequest.handlers.length; ++i) {

    //get the generator to create a response to the request
    var response = MockXMLHttpRequest.handlers[i](request, new MockResponse());

    if (response) {
      return response;
    }

  }

  return null;
};

/**
 * Mock XMLHttpRequest
 * @constructor
 */
function MockXMLHttpRequest() {
  this.reset();
  this._eventListeners = [];
  this.timeout = 0;
  // some libraries (like Mixpanel) use the presence of this field to check if XHR is properly supported
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
  this.withCredentials = false;
}

/**
 * Reset the response values
 * @private
 */
MockXMLHttpRequest.prototype.reset = function() {

  this._requestHeaders  = {};
  this._responseHeaders = {};

  this.status       = 0;
  this.statusText   = '';

  this.response     = null;
  this.responseType = null;
  this.responseText = null;
  this.responseXML  = null;

  this.readyState   = MockXMLHttpRequest.STATE_UNSENT;
};

/**
 * Trigger an event
 * @param   {String} event
 * @returns {MockXMLHttpRequest}
 */
MockXMLHttpRequest.prototype.trigger = function(event, eventDetails) {

  if (this.onreadystatechange) {
    this.onreadystatechange();
  }

  if (this['on'+event]) {
    this['on'+event]();
  }

  for (var x = 0; x < this._eventListeners.length; x++) {
    var eventListener = this._eventListeners[x];

    if (eventListener.event === event) {
      var eventListenerDetails = eventDetails || {};
      eventListenerDetails.currentTarget = this;
      eventListenerDetails.type = event;
      eventListener.listener.call(this, eventListenerDetails);
    }
  }

  return this;
};

MockXMLHttpRequest.prototype.open = function(method, url, async, user, password) {
  this.reset();
  this.method   = method;
  this.url      = url;
  this.async    = async;
  this.user     = user;
  this.password = password;
  this.data     = null;
  this.readyState = MockXMLHttpRequest.STATE_OPENED;
};

MockXMLHttpRequest.prototype.setRequestHeader = function(name, value) {
  this._requestHeaders[name] = value;
};

MockXMLHttpRequest.prototype.overrideMimeType = function(mime) {
  throw notImplementedError;
};

MockXMLHttpRequest.prototype.send = function(data) {
  var self = this;
  this.data = data;

  self.readyState = MockXMLHttpRequest.STATE_LOADING;

  self._sendTimeout = setTimeout(function() {

    var response = MockXMLHttpRequest.handle(new MockRequest(self));

    if (response && response instanceof MockResponse) {

      var timeout = response.timeout();

      if (timeout) {

        //trigger a timeout event because the request timed out - wait for the timeout time because many libs like jquery and superagent use setTimeout to detect the error type
        self._sendTimeout = setTimeout(function() {
          self.readyState = MockXMLHttpRequest.STATE_DONE;
          self.trigger('timeout');
        }, typeof(timeout) === 'number' ? timeout : self.timeout+1);

      } else {

        //map the response to the XHR object
        self.status             = response.status();
        self._responseHeaders   = response.headers();
        self.responseType       = 'text';
        self.response           = response.body();
        self.responseText       = response.body(); //TODO: detect an object and return JSON, detect XML and return XML
        self.readyState         = MockXMLHttpRequest.STATE_DONE;

        //trigger a load event because the request was received
        self.trigger('load');

      }

    } else {

      //trigger an error because the request was not handled
      self.readyState = MockXMLHttpRequest.STATE_DONE;
      self.trigger('error');

    }

  }, 0);

};

MockXMLHttpRequest.prototype.abort = function() {
  clearTimeout(this._sendTimeout);

  if (this.readyState > MockXMLHttpRequest.STATE_UNSENT && this.readyState < MockXMLHttpRequest.STATE_DONE) {
    this.readyState = MockXMLHttpRequest.STATE_UNSENT;
    this.trigger('abort');
  }

};

MockXMLHttpRequest.prototype.getAllResponseHeaders = function() {

  if (this.readyState < MockXMLHttpRequest.STATE_HEADERS_RECEIVED) {
    return null;
  }

  var headers = '';
  for (var name in this._responseHeaders) {
    if (this._responseHeaders.hasOwnProperty(name)) {
      headers += name+': '+this._responseHeaders[name]+'\r\n';
    }
  }

  return headers;
};

MockXMLHttpRequest.prototype.getResponseHeader = function(name) {

  if (this.readyState < MockXMLHttpRequest.STATE_HEADERS_RECEIVED) {
    return null;
  }

  return this._responseHeaders[name.toLowerCase()] || null;
};

MockXMLHttpRequest.prototype.addEventListener = function(event, listener) {
  this._eventListeners.push({
    event: event,
    listener: listener
  });
};

MockXMLHttpRequest.prototype.removeEventListener = function(event, listener) {
  var currentIndex = 0;

  while (currentIndex < this._eventListeners.length) {
    var eventListener = this._eventListeners[currentIndex];
    if (eventListener.event === event && eventListener.listener === listener) {
      this._eventListeners.splice(currentIndex, 1);
    } else {
      currentIndex++;
    }
  }
};

module.exports = MockXMLHttpRequest;

},{"./MockRequest":2,"./MockResponse":3}],5:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?&]+)=?([^&]*)/g
    , result = {}
    , part;

  //
  // Little nifty parsing hack, leverage the fact that RegExp.exec increments
  // the lastIndex property so we can continue executing this loop until we've
  // parsed all results.
  //
  for (;
    part = parser.exec(query);
    result[decodeURIComponent(part[1])] = decodeURIComponent(part[2])
  );

  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';

  var pairs = [];

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';

  for (var key in obj) {
    if (has.call(obj, key)) {
      pairs.push(encodeURIComponent(key) +'='+ encodeURIComponent(obj[key]));
    }
  }

  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
exports.stringify = querystringify;
exports.parse = querystring;

},{}],7:[function(require,module,exports){
'use strict';

/**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
module.exports = function required(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;

  if (!port) return false;

  switch (protocol) {
    case 'http':
    case 'ws':
    return port !== 80;

    case 'https':
    case 'wss':
    return port !== 443;

    case 'ftp':
    return port !== 21;

    case 'gopher':
    return port !== 70;

    case 'file':
    return false;
  }

  return port !== 0;
};

},{}],8:[function(require,module,exports){
'use strict';

var required = require('requires-port')
  , lolcation = require('./lolcation')
  , qs = require('querystringify')
  , protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i;

/**
 * These are the parse rules for the URL parser, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
var rules = [
  ['#', 'hash'],                        // Extract from the back.
  ['?', 'query'],                       // Extract from the back.
  ['/', 'pathname'],                    // Extract from the back.
  ['@', 'auth', 1],                     // Extract from the front.
  [NaN, 'host', undefined, 1, 1],       // Set left over value.
  [/:(\d+)$/, 'port', undefined, 1],    // RegExp the back.
  [NaN, 'hostname', undefined, 1, 1]    // Set left over.
];

/**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase.
 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
 * @property {String} rest Rest of the URL that is not part of the protocol.
 */

/**
 * Extract protocol information from a URL with/without double slash ("//").
 *
 * @param {String} address URL we want to extract from.
 * @return {ProtocolExtract} Extracted information.
 * @api private
 */
function extractProtocol(address) {
  var match = protocolre.exec(address);

  return {
    protocol: match[1] ? match[1].toLowerCase() : '',
    slashes: !!match[2],
    rest: match[3]
  };
}

/**
 * Resolve a relative URL pathname against a base URL pathname.
 *
 * @param {String} relative Pathname of the relative URL.
 * @param {String} base Pathname of the base URL.
 * @return {String} Resolved pathname.
 * @api private
 */
function resolve(relative, base) {
  var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/'))
    , i = path.length
    , last = path[i - 1]
    , unshift = false
    , up = 0;

  while (i--) {
    if (path[i] === '.') {
      path.splice(i, 1);
    } else if (path[i] === '..') {
      path.splice(i, 1);
      up++;
    } else if (up) {
      if (i === 0) unshift = true;
      path.splice(i, 1);
      up--;
    }
  }

  if (unshift) path.unshift('');
  if (last === '.' || last === '..') path.push('');

  return path.join('/');
}

/**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} location Location defaults for relative paths.
 * @param {Boolean|Function} parser Parser for the query string.
 * @api public
 */
function URL(address, location, parser) {
  if (!(this instanceof URL)) {
    return new URL(address, location, parser);
  }

  var relative, extracted, parse, instruction, index, key
    , instructions = rules.slice()
    , type = typeof location
    , url = this
    , i = 0;

  //
  // The following if statements allows this module two have compatibility with
  // 2 different API:
  //
  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
  //    where the boolean indicates that the query string should also be parsed.
  //
  // 2. The `URL` interface of the browser which accepts a URL, object as
  //    arguments. The supplied object will be used as default values / fall-back
  //    for relative paths.
  //
  if ('object' !== type && 'string' !== type) {
    parser = location;
    location = null;
  }

  if (parser && 'function' !== typeof parser) parser = qs.parse;

  location = lolcation(location);

  //
  // Extract protocol information before running the instructions.
  //
  extracted = extractProtocol(address || '');
  relative = !extracted.protocol && !extracted.slashes;
  url.slashes = extracted.slashes || relative && location.slashes;
  url.protocol = extracted.protocol || location.protocol || '';
  address = extracted.rest;

  //
  // When the authority component is absent the URL starts with a path
  // component.
  //
  if (!extracted.slashes) instructions[2] = [/(.*)/, 'pathname'];

  for (; i < instructions.length; i++) {
    instruction = instructions[i];
    parse = instruction[0];
    key = instruction[1];

    if (parse !== parse) {
      url[key] = address;
    } else if ('string' === typeof parse) {
      if (~(index = address.indexOf(parse))) {
        if ('number' === typeof instruction[2]) {
          url[key] = address.slice(0, index);
          address = address.slice(index + instruction[2]);
        } else {
          url[key] = address.slice(index);
          address = address.slice(0, index);
        }
      }
    } else if (index = parse.exec(address)) {
      url[key] = index[1];
      address = address.slice(0, index.index);
    }

    url[key] = url[key] || (
      relative && instruction[3] ? location[key] || '' : ''
    );

    //
    // Hostname, host and protocol should be lowercased so they can be used to
    // create a proper `origin`.
    //
    if (instruction[4]) url[key] = url[key].toLowerCase();
  }

  //
  // Also parse the supplied query string in to an object. If we're supplied
  // with a custom parser as function use that instead of the default build-in
  // parser.
  //
  if (parser) url.query = parser(url.query);

  //
  // If the URL is relative, resolve the pathname against the base URL.
  //
  if (
      relative
    && location.slashes
    && url.pathname.charAt(0) !== '/'
    && (url.pathname !== '' || location.pathname !== '')
  ) {
    url.pathname = resolve(url.pathname, location.pathname);
  }

  //
  // We should not add port numbers if they are already the default port number
  // for a given protocol. As the host also contains the port number we're going
  // override it with the hostname which contains no port number.
  //
  if (!required(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }

  //
  // Parse down the `auth` for the username and password.
  //
  url.username = url.password = '';
  if (url.auth) {
    instruction = url.auth.split(':');
    url.username = instruction[0] || '';
    url.password = instruction[1] || '';
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  //
  // The href is just the compiled result.
  //
  url.href = url.toString();
}

/**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function
 *                               used to parse the query.
 *                               When setting the protocol, double slash will be
 *                               removed from the final url if it is true.
 * @returns {URL}
 * @api public
 */
URL.prototype.set = function set(part, value, fn) {
  var url = this;

  switch (part) {
    case 'query':
      if ('string' === typeof value && value.length) {
        value = (fn || qs.parse)(value);
      }

      url[part] = value;
      break;

    case 'port':
      url[part] = value;

      if (!required(value, url.protocol)) {
        url.host = url.hostname;
        url[part] = '';
      } else if (value) {
        url.host = url.hostname +':'+ value;
      }

      break;

    case 'hostname':
      url[part] = value;

      if (url.port) value += ':'+ url.port;
      url.host = value;
      break;

    case 'host':
      url[part] = value;

      if (/:\d+$/.test(value)) {
        value = value.split(':');
        url.port = value.pop();
        url.hostname = value.join(':');
      } else {
        url.hostname = value;
        url.port = '';
      }

      break;

    case 'protocol':
      url.protocol = value.toLowerCase();
      url.slashes = !fn;
      break;

    case 'pathname':
      url.pathname = value.length && value.charAt(0) !== '/' ? '/' + value : value;

      break;

    default:
      url[part] = value;
  }

  for (var i = 0; i < rules.length; i++) {
    var ins = rules[i];

    if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  url.href = url.toString();

  return url;
};

/**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String}
 * @api public
 */
URL.prototype.toString = function toString(stringify) {
  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

  var query
    , url = this
    , protocol = url.protocol;

  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

  var result = protocol + (url.slashes ? '//' : '');

  if (url.username) {
    result += url.username;
    if (url.password) result += ':'+ url.password;
    result += '@';
  }

  result += url.host + url.pathname;

  query = 'object' === typeof url.query ? stringify(url.query) : url.query;
  if (query) result += '?' !== query.charAt(0) ? '?'+ query : query;

  if (url.hash) result += url.hash;

  return result;
};

//
// Expose the URL parser and some additional properties that might be useful for
// others or testing.
//
URL.extractProtocol = extractProtocol;
URL.location = lolcation;
URL.qs = qs;

module.exports = URL;

},{"./lolcation":9,"querystringify":6,"requires-port":7}],9:[function(require,module,exports){
(function (global){
'use strict';

var slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;

/**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
var ignore = { hash: 1, query: 1 }
  , URL;

/**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @api public
 */
module.exports = function lolcation(loc) {
  loc = loc || global.location || {};
  URL = URL || require('./');

  var finaldestination = {}
    , type = typeof loc
    , key;

  if ('blob:' === loc.protocol) {
    finaldestination = new URL(unescape(loc.pathname), {});
  } else if ('string' === type) {
    finaldestination = new URL(loc, {});
    for (key in ignore) delete finaldestination[key];
  } else if ('object' === type) {
    for (key in loc) {
      if (key in ignore) continue;
      finaldestination[key] = loc[key];
    }

    if (finaldestination.slashes === undefined) {
      finaldestination.slashes = slashes.test(loc.href);
    }
  }

  return finaldestination;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./":8}]},{},[1])(1)
});