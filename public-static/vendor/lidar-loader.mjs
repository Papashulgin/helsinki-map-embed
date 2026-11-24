var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@loaders.gl/loader-utils/dist/lib/env-utils/assert.js
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "loader assertion failed.");
  }
}

// node_modules/@loaders.gl/loader-utils/dist/lib/env-utils/globals.js
var globals = {
  self: typeof self !== "undefined" && self,
  window: typeof window !== "undefined" && window,
  global: typeof global !== "undefined" && global,
  document: typeof document !== "undefined" && document
};
var self_ = globals.self || globals.window || globals.global || {};
var window_ = globals.window || globals.self || globals.global || {};
var global_ = globals.global || globals.self || globals.window || {};
var document_ = globals.document || {};
var isBrowser = (
  // @ts-ignore process does not exist on browser
  Boolean(typeof process !== "object" || String(process) !== "[object process]" || process.browser)
);
var matches = typeof process !== "undefined" && process.version && /v([0-9]*)/.exec(process.version);
var nodeVersion = matches && parseFloat(matches[1]) || 0;

// node_modules/@probe.gl/env/dist/lib/globals.js
var window_2 = globalThis;
var document_2 = globalThis.document || {};
var process_ = globalThis.process || {};
var console_ = globalThis.console;
var navigator_ = globalThis.navigator || {};

// node_modules/@probe.gl/env/dist/lib/is-electron.js
function isElectron(mockUserAgent) {
  if (typeof window !== "undefined" && window.process?.type === "renderer") {
    return true;
  }
  if (typeof process !== "undefined" && Boolean(process.versions?.["electron"])) {
    return true;
  }
  const realUserAgent = typeof navigator !== "undefined" && navigator.userAgent;
  const userAgent = mockUserAgent || realUserAgent;
  return Boolean(userAgent && userAgent.indexOf("Electron") >= 0);
}

// node_modules/@probe.gl/env/dist/lib/is-browser.js
function isBrowser2() {
  const isNode = (
    // @ts-expect-error
    typeof process === "object" && String(process) === "[object process]" && !process?.browser
  );
  return !isNode || isElectron();
}

// node_modules/@probe.gl/env/dist/index.js
var VERSION = true ? "4.1.2" : "untranspiled source";

// node_modules/@probe.gl/log/dist/utils/assert.js
function assert2(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// node_modules/@probe.gl/log/dist/loggers/log-utils.js
function normalizeLogLevel(logLevel) {
  if (!logLevel) {
    return 0;
  }
  let resolvedLevel;
  switch (typeof logLevel) {
    case "number":
      resolvedLevel = logLevel;
      break;
    case "object":
      resolvedLevel = logLevel.logLevel || logLevel.priority || 0;
      break;
    default:
      return 0;
  }
  assert2(Number.isFinite(resolvedLevel) && resolvedLevel >= 0);
  return resolvedLevel;
}
function normalizeArguments(opts) {
  const { logLevel, message } = opts;
  opts.logLevel = normalizeLogLevel(logLevel);
  const args = opts.args ? Array.from(opts.args) : [];
  while (args.length && args.shift() !== message) {
  }
  switch (typeof logLevel) {
    case "string":
    case "function":
      if (message !== void 0) {
        args.unshift(message);
      }
      opts.message = logLevel;
      break;
    case "object":
      Object.assign(opts, logLevel);
      break;
    default:
  }
  if (typeof opts.message === "function") {
    opts.message = opts.message();
  }
  const messageType = typeof opts.message;
  assert2(messageType === "string" || messageType === "object");
  return Object.assign(opts, { args }, opts.opts);
}

// node_modules/@probe.gl/log/dist/loggers/base-log.js
var noop = () => {
};
var BaseLog = class {
  constructor({ level = 0 } = {}) {
    this.userData = {};
    this._onceCache = /* @__PURE__ */ new Set();
    this._level = level;
  }
  set level(newLevel) {
    this.setLevel(newLevel);
  }
  get level() {
    return this.getLevel();
  }
  setLevel(level) {
    this._level = level;
    return this;
  }
  getLevel() {
    return this._level;
  }
  // Unconditional logging
  warn(message, ...args) {
    return this._log("warn", 0, message, args, { once: true });
  }
  error(message, ...args) {
    return this._log("error", 0, message, args);
  }
  // Conditional logging
  log(logLevel, message, ...args) {
    return this._log("log", logLevel, message, args);
  }
  info(logLevel, message, ...args) {
    return this._log("info", logLevel, message, args);
  }
  once(logLevel, message, ...args) {
    return this._log("once", logLevel, message, args, { once: true });
  }
  _log(type, logLevel, message, args, options = {}) {
    const normalized = normalizeArguments({
      logLevel,
      message,
      args: this._buildArgs(logLevel, message, args),
      opts: options
    });
    return this._createLogFunction(type, normalized, options);
  }
  _buildArgs(logLevel, message, args) {
    return [logLevel, message, ...args];
  }
  _createLogFunction(type, normalized, options) {
    if (!this._shouldLog(normalized.logLevel)) {
      return noop;
    }
    const tag = this._getOnceTag(options.tag ?? normalized.tag ?? normalized.message);
    if ((options.once || normalized.once) && tag !== void 0) {
      if (this._onceCache.has(tag)) {
        return noop;
      }
      this._onceCache.add(tag);
    }
    return this._emit(type, normalized);
  }
  _shouldLog(logLevel) {
    return this.getLevel() >= normalizeLogLevel(logLevel);
  }
  _getOnceTag(tag) {
    if (tag === void 0) {
      return void 0;
    }
    try {
      return typeof tag === "string" ? tag : String(tag);
    } catch {
      return void 0;
    }
  }
};

// node_modules/@probe.gl/log/dist/utils/local-storage.js
function getStorage(type) {
  try {
    const storage = window[type];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return storage;
  } catch (e) {
    return null;
  }
}
var LocalStorage = class {
  constructor(id, defaultConfig, type = "sessionStorage") {
    this.storage = getStorage(type);
    this.id = id;
    this.config = defaultConfig;
    this._loadConfiguration();
  }
  getConfiguration() {
    return this.config;
  }
  setConfiguration(configuration) {
    Object.assign(this.config, configuration);
    if (this.storage) {
      const serialized = JSON.stringify(this.config);
      this.storage.setItem(this.id, serialized);
    }
  }
  // Get config from persistent store, if available
  _loadConfiguration() {
    let configuration = {};
    if (this.storage) {
      const serializedConfiguration = this.storage.getItem(this.id);
      configuration = serializedConfiguration ? JSON.parse(serializedConfiguration) : {};
    }
    Object.assign(this.config, configuration);
    return this;
  }
};

// node_modules/@probe.gl/log/dist/utils/formatters.js
function formatTime(ms) {
  let formatted;
  if (ms < 10) {
    formatted = `${ms.toFixed(2)}ms`;
  } else if (ms < 100) {
    formatted = `${ms.toFixed(1)}ms`;
  } else if (ms < 1e3) {
    formatted = `${ms.toFixed(0)}ms`;
  } else {
    formatted = `${(ms / 1e3).toFixed(2)}s`;
  }
  return formatted;
}
function leftPad(string, length = 8) {
  const padLength = Math.max(length - string.length, 0);
  return `${" ".repeat(padLength)}${string}`;
}

// node_modules/@probe.gl/log/dist/utils/color.js
var COLOR;
(function(COLOR2) {
  COLOR2[COLOR2["BLACK"] = 30] = "BLACK";
  COLOR2[COLOR2["RED"] = 31] = "RED";
  COLOR2[COLOR2["GREEN"] = 32] = "GREEN";
  COLOR2[COLOR2["YELLOW"] = 33] = "YELLOW";
  COLOR2[COLOR2["BLUE"] = 34] = "BLUE";
  COLOR2[COLOR2["MAGENTA"] = 35] = "MAGENTA";
  COLOR2[COLOR2["CYAN"] = 36] = "CYAN";
  COLOR2[COLOR2["WHITE"] = 37] = "WHITE";
  COLOR2[COLOR2["BRIGHT_BLACK"] = 90] = "BRIGHT_BLACK";
  COLOR2[COLOR2["BRIGHT_RED"] = 91] = "BRIGHT_RED";
  COLOR2[COLOR2["BRIGHT_GREEN"] = 92] = "BRIGHT_GREEN";
  COLOR2[COLOR2["BRIGHT_YELLOW"] = 93] = "BRIGHT_YELLOW";
  COLOR2[COLOR2["BRIGHT_BLUE"] = 94] = "BRIGHT_BLUE";
  COLOR2[COLOR2["BRIGHT_MAGENTA"] = 95] = "BRIGHT_MAGENTA";
  COLOR2[COLOR2["BRIGHT_CYAN"] = 96] = "BRIGHT_CYAN";
  COLOR2[COLOR2["BRIGHT_WHITE"] = 97] = "BRIGHT_WHITE";
})(COLOR || (COLOR = {}));
var BACKGROUND_INCREMENT = 10;
function getColor(color) {
  if (typeof color !== "string") {
    return color;
  }
  color = color.toUpperCase();
  return COLOR[color] || COLOR.WHITE;
}
function addColor(string, color, background) {
  if (!isBrowser2 && typeof string === "string") {
    if (color) {
      const colorCode = getColor(color);
      string = `\x1B[${colorCode}m${string}\x1B[39m`;
    }
    if (background) {
      const colorCode = getColor(background);
      string = `\x1B[${colorCode + BACKGROUND_INCREMENT}m${string}\x1B[49m`;
    }
  }
  return string;
}

// node_modules/@probe.gl/log/dist/utils/autobind.js
function autobind(obj, predefined = ["constructor"]) {
  const proto = Object.getPrototypeOf(obj);
  const propNames = Object.getOwnPropertyNames(proto);
  const object = obj;
  for (const key of propNames) {
    const value = object[key];
    if (typeof value === "function") {
      if (!predefined.find((name) => key === name)) {
        object[key] = value.bind(obj);
      }
    }
  }
}

// node_modules/@probe.gl/log/dist/probe.js
var Probe = class {
  getHighResolutionTimer() {
    let timestamp;
    if (isBrowser2() && window_2.performance) {
      timestamp = window_2?.performance?.now?.();
    } else if ("hrtime" in process_) {
      const timeParts = process_?.hrtime?.();
      timestamp = timeParts[0] * 1e3 + timeParts[1] / 1e6;
    } else {
      timestamp = Date.now();
    }
    return timestamp;
  }
  getMemoryUsageMB() {
    const performance = window_2?.performance;
    const usedJSHeapSize = performance?.memory?.usedJSHeapSize;
    if (usedJSHeapSize === void 0 || usedJSHeapSize === null) {
      return null;
    }
    return Math.trunc(usedJSHeapSize / 1024 / 1024);
  }
};
var probe = new Probe();
globalThis.Probe = Probe;
globalThis.probe = probe;

// node_modules/@probe.gl/log/dist/loggers/probe-log.js
var originalConsole = {
  debug: isBrowser2() ? console.debug || console.log : console.log,
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};
var DEFAULT_LOG_CONFIGURATION = {
  enabled: true,
  level: 0
};
var ProbeLog = class extends BaseLog {
  constructor({ id } = { id: "" }) {
    super({ level: 0 });
    this.VERSION = VERSION;
    this._startTs = probe.getHighResolutionTimer();
    this._deltaTs = probe.getHighResolutionTimer();
    this.userData = {};
    this.LOG_THROTTLE_TIMEOUT = 0;
    this.id = id;
    this.userData = {};
    this._storage = new LocalStorage(`__probe-${this.id}__`, { [this.id]: DEFAULT_LOG_CONFIGURATION });
    this.timeStamp(`${this.id} started`);
    autobind(this);
    Object.seal(this);
  }
  isEnabled() {
    return this._getConfiguration().enabled;
  }
  getLevel() {
    return this._getConfiguration().level;
  }
  /** @return milliseconds, with fractions */
  getTotal() {
    return Number((probe.getHighResolutionTimer() - this._startTs).toPrecision(10));
  }
  /** @return milliseconds, with fractions */
  getDelta() {
    return Number((probe.getHighResolutionTimer() - this._deltaTs).toPrecision(10));
  }
  /** @deprecated use logLevel */
  set priority(newPriority) {
    this.level = newPriority;
  }
  /** @deprecated use logLevel */
  get priority() {
    return this.level;
  }
  /** @deprecated use logLevel */
  getPriority() {
    return this.level;
  }
  // Configure
  enable(enabled = true) {
    this._updateConfiguration({ enabled });
    return this;
  }
  setLevel(level) {
    this._updateConfiguration({ level });
    return this;
  }
  /** return the current status of the setting */
  get(setting) {
    return this._getConfiguration()[setting];
  }
  // update the status of the setting
  set(setting, value) {
    this._updateConfiguration({ [setting]: value });
  }
  /** Logs the current settings as a table */
  settings() {
    if (console.table) {
      console.table(this._storage.config);
    } else {
      console.log(this._storage.config);
    }
  }
  // Unconditional logging
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  }
  warn(message, ...args) {
    return this._log("warn", 0, message, args, {
      method: originalConsole.warn,
      once: true
    });
  }
  error(message, ...args) {
    return this._log("error", 0, message, args, {
      method: originalConsole.error
    });
  }
  /** Print a deprecation warning */
  deprecated(oldUsage, newUsage) {
    return this.warn(`\`${oldUsage}\` is deprecated and will be removed in a later version. Use \`${newUsage}\` instead`);
  }
  /** Print a removal warning */
  removed(oldUsage, newUsage) {
    return this.error(`\`${oldUsage}\` has been removed. Use \`${newUsage}\` instead`);
  }
  probe(logLevel, message, ...args) {
    const memoryUsageMB = probe.getMemoryUsageMB();
    if (memoryUsageMB !== null) {
      const memoryUsagePrefix = `${memoryUsageMB}MB `;
      if (typeof message === "function") {
        message = () => `${memoryUsagePrefix}${message()}`;
      } else if (typeof message === "string") {
        message = `${memoryUsagePrefix}${message}`;
      }
    }
    return this._log("log", logLevel, message, args, {
      method: originalConsole.log,
      time: true,
      once: true
    });
  }
  log(logLevel, message, ...args) {
    return this._log("log", logLevel, message, args, {
      method: originalConsole.debug
    });
  }
  info(logLevel, message, ...args) {
    return this._log("info", logLevel, message, args, { method: console.info });
  }
  once(logLevel, message, ...args) {
    return this._log("once", logLevel, message, args, {
      method: originalConsole.debug || originalConsole.info,
      once: true
    });
  }
  /** Logs an object as a table */
  table(logLevel, table, columns) {
    if (table) {
      return this._log("table", logLevel, table, columns && [columns] || [], {
        method: console.table || noop,
        tag: getTableHeader(table)
      });
    }
    return noop;
  }
  time(logLevel, message) {
    return this._log("time", logLevel, message, [], {
      method: console.time ? console.time : console.info
    });
  }
  timeEnd(logLevel, message) {
    return this._log("time", logLevel, message, [], {
      method: console.timeEnd ? console.timeEnd : console.info
    });
  }
  timeStamp(logLevel, message) {
    return this._log("time", logLevel, message, [], {
      method: console.timeStamp || noop
    });
  }
  group(logLevel, message, opts = { collapsed: false }) {
    const method = (opts.collapsed ? console.groupCollapsed : console.group) || console.info;
    return this._log("group", logLevel, message, [], { method });
  }
  groupCollapsed(logLevel, message, opts = {}) {
    return this.group(logLevel, message, Object.assign({}, opts, { collapsed: true }));
  }
  groupEnd(logLevel) {
    return this._log("groupEnd", logLevel, "", [], {
      method: console.groupEnd || noop
    });
  }
  // EXPERIMENTAL
  withGroup(logLevel, message, func) {
    this.group(logLevel, message)();
    try {
      func();
    } finally {
      this.groupEnd(logLevel)();
    }
  }
  trace() {
    if (console.trace) {
      console.trace();
    }
  }
  _shouldLog(logLevel) {
    return this.isEnabled() && super._shouldLog(logLevel);
  }
  _emit(_type, normalized) {
    const method = normalized.method;
    assert2(method);
    normalized.total = this.getTotal();
    normalized.delta = this.getDelta();
    this._deltaTs = probe.getHighResolutionTimer();
    const message = decorateMessage(this.id, normalized.message, normalized);
    return method.bind(console, message, ...normalized.args);
  }
  _getConfiguration() {
    if (!this._storage.config[this.id]) {
      this._updateConfiguration(DEFAULT_LOG_CONFIGURATION);
    }
    return this._storage.config[this.id];
  }
  _updateConfiguration(configuration) {
    const currentConfiguration = this._storage.config[this.id] || {
      ...DEFAULT_LOG_CONFIGURATION
    };
    this._storage.setConfiguration({
      [this.id]: { ...currentConfiguration, ...configuration }
    });
  }
};
ProbeLog.VERSION = VERSION;
function decorateMessage(id, message, opts) {
  if (typeof message === "string") {
    const time = opts.time ? leftPad(formatTime(opts.total)) : "";
    message = opts.time ? `${id}: ${time}  ${message}` : `${id}: ${message}`;
    message = addColor(message, opts.color, opts.background);
  }
  return message;
}
function getTableHeader(table) {
  for (const key in table) {
    for (const title in table[key]) {
      return title || "untitled";
    }
  }
  return "empty";
}

// node_modules/@probe.gl/log/dist/init.js
if (!globalThis.probe) {
  globalThis.probe = probe;
}

// node_modules/@probe.gl/log/dist/index.js
var dist_default = new ProbeLog({ id: "@probe.gl/log" });

// node_modules/@loaders.gl/loader-utils/dist/lib/log-utils/log.js
var VERSION2 = true ? "4.5.4" : "latest";
var version = VERSION2[0] >= "0" && VERSION2[0] <= "9" ? `v${VERSION2}` : "";
function createLog() {
  const log2 = new ProbeLog({ id: "loaders.gl" });
  globalThis.loaders ||= {};
  globalThis.loaders.log = log2;
  globalThis.loaders.version = version;
  globalThis.probe ||= {};
  globalThis.probe.loaders = log2;
  return log2;
}
var log = createLog();

// node_modules/@loaders.gl/loader-utils/dist/lib/javascript-utils/is-type.js
var isBoolean = (value) => typeof value === "boolean";
var isFunction = (value) => typeof value === "function";
var isObject = (value) => value !== null && typeof value === "object";
var isPureObject = (value) => isObject(value) && value.constructor === {}.constructor;
var isSharedArrayBuffer = (value) => typeof SharedArrayBuffer !== "undefined" && value instanceof SharedArrayBuffer;
var isArrayBufferLike = (value) => isObject(value) && typeof value.byteLength === "number" && typeof value.slice === "function";
var isIterable = (value) => Boolean(value) && isFunction(value[Symbol.iterator]);
var isAsyncIterable = (value) => Boolean(value) && isFunction(value[Symbol.asyncIterator]);
var isResponse = (value) => typeof Response !== "undefined" && value instanceof Response || isObject(value) && isFunction(value.arrayBuffer) && isFunction(value.text) && isFunction(value.json);
var isBlob = (value) => typeof Blob !== "undefined" && value instanceof Blob;
var isReadableDOMStream = (value) => typeof ReadableStream !== "undefined" && value instanceof ReadableStream || isObject(value) && isFunction(value.tee) && isFunction(value.cancel) && isFunction(value.getReader);
var isReadableNodeStream = (value) => isObject(value) && isFunction(value.read) && isFunction(value.pipe) && isBoolean(value.readable);
var isReadableStream = (value) => isReadableDOMStream(value) || isReadableNodeStream(value);

// node_modules/@loaders.gl/loader-utils/dist/lib/option-utils/merge-options.js
function mergeOptions(baseOptions, newOptions) {
  return mergeOptionsRecursively(baseOptions || {}, newOptions);
}
function mergeOptionsRecursively(baseOptions, newOptions, level = 0) {
  if (level > 3) {
    return newOptions;
  }
  const options = { ...baseOptions };
  for (const [key, newValue] of Object.entries(newOptions)) {
    if (newValue && typeof newValue === "object" && !Array.isArray(newValue)) {
      options[key] = mergeOptionsRecursively(options[key] || {}, newOptions[key], level + 1);
    } else {
      options[key] = newOptions[key];
    }
  }
  return options;
}

// node_modules/@loaders.gl/worker-utils/dist/lib/npm-tag.js
var NPM_TAG = "latest";

// node_modules/@loaders.gl/worker-utils/dist/lib/env-utils/version.js
function getVersion() {
  if (!globalThis._loadersgl_?.version) {
    globalThis._loadersgl_ = globalThis._loadersgl_ || {};
    if (false) {
      console.warn("loaders.gl: The __VERSION__ variable is not injected using babel plugin. Latest unstable workers would be fetched from the CDN.");
      globalThis._loadersgl_.version = NPM_TAG;
      warningIssued = true;
    } else {
      globalThis._loadersgl_.version = "4.5.4";
    }
  }
  return globalThis._loadersgl_.version;
}
var VERSION3 = getVersion();

// node_modules/@loaders.gl/worker-utils/dist/lib/env-utils/assert.js
function assert3(condition, message) {
  if (!condition) {
    throw new Error(message || "loaders.gl assertion failed.");
  }
}

// node_modules/@loaders.gl/worker-utils/dist/lib/env-utils/globals.js
var globals2 = {
  self: typeof self !== "undefined" && self,
  window: typeof window !== "undefined" && window,
  global: typeof global !== "undefined" && global,
  document: typeof document !== "undefined" && document
};
var self_2 = globals2.self || globals2.window || globals2.global || {};
var window_3 = globals2.window || globals2.self || globals2.global || {};
var global_3 = globals2.global || globals2.self || globals2.window || {};
var document_3 = globals2.document || {};
var isBrowser3 = (
  // @ts-ignore process.browser
  typeof process !== "object" || String(process) !== "[object process]" || process.browser
);
var isMobile = typeof window !== "undefined" && typeof window.orientation !== "undefined";
var matches2 = typeof process !== "undefined" && process.version && /v([0-9]*)/.exec(process.version);
var nodeVersion2 = matches2 && parseFloat(matches2[1]) || 0;

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-farm/worker-job.js
var WorkerJob = class {
  name;
  workerThread;
  isRunning = true;
  /** Promise that resolves when Job is done */
  result;
  _resolve = () => {
  };
  _reject = () => {
  };
  constructor(jobName, workerThread) {
    this.name = jobName;
    this.workerThread = workerThread;
    this.result = new Promise((resolve2, reject) => {
      this._resolve = resolve2;
      this._reject = reject;
    });
  }
  /**
   * Send a message to the job's worker thread
   * @param data any data structure, ideally consisting mostly of transferrable objects
   */
  postMessage(type, payload) {
    this.workerThread.postMessage({
      source: "loaders.gl",
      // Lets worker ignore unrelated messages
      type,
      payload
    });
  }
  /**
   * Call to resolve the `result` Promise with the supplied value
   */
  done(value) {
    assert3(this.isRunning);
    this.isRunning = false;
    this._resolve(value);
  }
  /**
   * Call to reject the `result` Promise with the supplied error
   */
  error(error) {
    assert3(this.isRunning);
    this.isRunning = false;
    this._reject(error);
  }
};

// node_modules/@loaders.gl/worker-utils/dist/lib/node/worker_threads-browser.js
var NodeWorker = class {
  terminate() {
  }
};

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-utils/get-loadable-worker-url.js
var workerURLCache = /* @__PURE__ */ new Map();
function getLoadableWorkerURL(props) {
  assert3(props.source && !props.url || !props.source && props.url);
  let workerURL = workerURLCache.get(props.source || props.url);
  if (!workerURL) {
    if (props.url) {
      workerURL = getLoadableWorkerURLFromURL(props.url);
      workerURLCache.set(props.url, workerURL);
    }
    if (props.source) {
      workerURL = getLoadableWorkerURLFromSource(props.source);
      workerURLCache.set(props.source, workerURL);
    }
  }
  assert3(workerURL);
  return workerURL;
}
function getLoadableWorkerURLFromURL(url) {
  if (!url.startsWith("http")) {
    return url;
  }
  const workerSource = buildScriptSource(url);
  return getLoadableWorkerURLFromSource(workerSource);
}
function getLoadableWorkerURLFromSource(workerSource) {
  const blob = new Blob([workerSource], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}
function buildScriptSource(workerUrl) {
  return `try {
  importScripts('${workerUrl}');
} catch (error) {
  console.error(error);
  throw error;
}`;
}

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-utils/get-transfer-list.js
function getTransferList(object, recursive = true, transfers) {
  const transfersSet = transfers || /* @__PURE__ */ new Set();
  if (!object) {
  } else if (isTransferable(object)) {
    transfersSet.add(object);
  } else if (isTransferable(object.buffer)) {
    transfersSet.add(object.buffer);
  } else if (ArrayBuffer.isView(object)) {
  } else if (recursive && typeof object === "object") {
    for (const key in object) {
      getTransferList(object[key], recursive, transfersSet);
    }
  }
  return transfers === void 0 ? Array.from(transfersSet) : [];
}
function isTransferable(object) {
  if (!object) {
    return false;
  }
  if (object instanceof ArrayBuffer) {
    return true;
  }
  if (typeof MessagePort !== "undefined" && object instanceof MessagePort) {
    return true;
  }
  if (typeof ImageBitmap !== "undefined" && object instanceof ImageBitmap) {
    return true;
  }
  if (typeof OffscreenCanvas !== "undefined" && object instanceof OffscreenCanvas) {
    return true;
  }
  return false;
}

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-farm/worker-thread.js
var NOOP = () => {
};
var WorkerThread = class {
  name;
  source;
  url;
  terminated = false;
  worker;
  onMessage;
  onError;
  _loadableURL = "";
  /** Checks if workers are supported on this platform */
  static isSupported() {
    return typeof Worker !== "undefined" && isBrowser3 || typeof NodeWorker !== "undefined" && !isBrowser3;
  }
  constructor(props) {
    const { name, source, url } = props;
    assert3(source || url);
    this.name = name;
    this.source = source;
    this.url = url;
    this.onMessage = NOOP;
    this.onError = (error) => console.log(error);
    this.worker = isBrowser3 ? this._createBrowserWorker() : this._createNodeWorker();
  }
  /**
   * Terminate this worker thread
   * @note Can free up significant memory
   */
  destroy() {
    this.onMessage = NOOP;
    this.onError = NOOP;
    this.worker.terminate();
    this.terminated = true;
  }
  get isRunning() {
    return Boolean(this.onMessage);
  }
  /**
   * Send a message to this worker thread
   * @param data any data structure, ideally consisting mostly of transferrable objects
   * @param transferList If not supplied, calculated automatically by traversing data
   */
  postMessage(data, transferList) {
    transferList = transferList || getTransferList(data);
    this.worker.postMessage(data, transferList);
  }
  // PRIVATE
  /**
   * Generate a standard Error from an ErrorEvent
   * @param event
   */
  _getErrorFromErrorEvent(event) {
    let message = "Failed to load ";
    message += `worker ${this.name} from ${this.url}. `;
    if (event.message) {
      message += `${event.message} in `;
    }
    if (event.lineno) {
      message += `:${event.lineno}:${event.colno}`;
    }
    return new Error(message);
  }
  /**
   * Creates a worker thread on the browser
   */
  _createBrowserWorker() {
    this._loadableURL = getLoadableWorkerURL({ source: this.source, url: this.url });
    const worker = new Worker(this._loadableURL, { name: this.name });
    worker.onmessage = (event) => {
      if (!event.data) {
        this.onError(new Error("No data received"));
      } else {
        this.onMessage(event.data);
      }
    };
    worker.onerror = (error) => {
      this.onError(this._getErrorFromErrorEvent(error));
      this.terminated = true;
    };
    worker.onmessageerror = (event) => console.error(event);
    return worker;
  }
  /**
   * Creates a worker thread in node.js
   * @todo https://nodejs.org/api/async_hooks.html#async-resource-worker-pool
   */
  _createNodeWorker() {
    let worker;
    if (this.url) {
      const absolute = this.url.includes(":/") || this.url.startsWith("/");
      const url = absolute ? this.url : `./${this.url}`;
      const type = this.url.endsWith(".ts") || this.url.endsWith(".mjs") ? "module" : "commonjs";
      worker = new NodeWorker(url, { eval: false, type });
    } else if (this.source) {
      worker = new NodeWorker(this.source, { eval: true });
    } else {
      throw new Error("no worker");
    }
    worker.on("message", (data) => {
      this.onMessage(data);
    });
    worker.on("error", (error) => {
      this.onError(error);
    });
    worker.on("exit", (code) => {
    });
    return worker;
  }
};

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-farm/worker-pool.js
var WorkerPool = class {
  name = "unnamed";
  source;
  // | Function;
  url;
  maxConcurrency = 1;
  maxMobileConcurrency = 1;
  onDebug = () => {
  };
  reuseWorkers = true;
  props = {};
  jobQueue = [];
  idleQueue = [];
  count = 0;
  isDestroyed = false;
  /** Checks if workers are supported on this platform */
  static isSupported() {
    return WorkerThread.isSupported();
  }
  /**
   * @param processor - worker function
   * @param maxConcurrency - max count of workers
   */
  constructor(props) {
    this.source = props.source;
    this.url = props.url;
    this.setProps(props);
  }
  /**
   * Terminates all workers in the pool
   * @note Can free up significant memory
   */
  destroy() {
    this.idleQueue.forEach((worker) => worker.destroy());
    this.isDestroyed = true;
  }
  setProps(props) {
    this.props = { ...this.props, ...props };
    if (props.name !== void 0) {
      this.name = props.name;
    }
    if (props.maxConcurrency !== void 0) {
      this.maxConcurrency = props.maxConcurrency;
    }
    if (props.maxMobileConcurrency !== void 0) {
      this.maxMobileConcurrency = props.maxMobileConcurrency;
    }
    if (props.reuseWorkers !== void 0) {
      this.reuseWorkers = props.reuseWorkers;
    }
    if (props.onDebug !== void 0) {
      this.onDebug = props.onDebug;
    }
  }
  async startJob(name, onMessage2 = (job, type, data) => job.done(data), onError = (job, error) => job.error(error)) {
    const startPromise = new Promise((onStart) => {
      this.jobQueue.push({ name, onMessage: onMessage2, onError, onStart });
      return this;
    });
    this._startQueuedJob();
    return await startPromise;
  }
  // PRIVATE
  /**
   * Starts first queued job if worker is available or can be created
   * Called when job is started and whenever a worker returns to the idleQueue
   */
  async _startQueuedJob() {
    if (!this.jobQueue.length) {
      return;
    }
    const workerThread = this._getAvailableWorker();
    if (!workerThread) {
      return;
    }
    const queuedJob = this.jobQueue.shift();
    if (queuedJob) {
      this.onDebug({
        message: "Starting job",
        name: queuedJob.name,
        workerThread,
        backlog: this.jobQueue.length
      });
      const job = new WorkerJob(queuedJob.name, workerThread);
      workerThread.onMessage = (data) => queuedJob.onMessage(job, data.type, data.payload);
      workerThread.onError = (error) => queuedJob.onError(job, error);
      queuedJob.onStart(job);
      try {
        await job.result;
      } catch (error) {
        console.error(`Worker exception: ${error}`);
      } finally {
        this.returnWorkerToQueue(workerThread);
      }
    }
  }
  /**
   * Returns a worker to the idle queue
   * Destroys the worker if
   *  - pool is destroyed
   *  - if this pool doesn't reuse workers
   *  - if maxConcurrency has been lowered
   * @param worker
   */
  returnWorkerToQueue(worker) {
    const shouldDestroyWorker = (
      // Workers on Node.js prevent the process from exiting.
      // Until we figure out how to close them before exit, we always destroy them
      !isBrowser3 || // If the pool is destroyed, there is no reason to keep the worker around
      this.isDestroyed || // If the app has disabled worker reuse, any completed workers should be destroyed
      !this.reuseWorkers || // If concurrency has been lowered, this worker might be surplus to requirements
      this.count > this._getMaxConcurrency()
    );
    if (shouldDestroyWorker) {
      worker.destroy();
      this.count--;
    } else {
      this.idleQueue.push(worker);
    }
    if (!this.isDestroyed) {
      this._startQueuedJob();
    }
  }
  /**
   * Returns idle worker or creates new worker if maxConcurrency has not been reached
   */
  _getAvailableWorker() {
    if (this.idleQueue.length > 0) {
      return this.idleQueue.shift() || null;
    }
    if (this.count < this._getMaxConcurrency()) {
      this.count++;
      const name = `${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;
      return new WorkerThread({ name, source: this.source, url: this.url });
    }
    return null;
  }
  _getMaxConcurrency() {
    return isMobile ? this.maxMobileConcurrency : this.maxConcurrency;
  }
};

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-farm/worker-farm.js
var DEFAULT_PROPS = {
  maxConcurrency: 3,
  maxMobileConcurrency: 1,
  reuseWorkers: true,
  onDebug: () => {
  }
};
var WorkerFarm = class _WorkerFarm {
  props;
  workerPools = /* @__PURE__ */ new Map();
  // singleton
  static _workerFarm;
  /** Checks if workers are supported on this platform */
  static isSupported() {
    return WorkerThread.isSupported();
  }
  /** Get the singleton instance of the global worker farm */
  static getWorkerFarm(props = {}) {
    _WorkerFarm._workerFarm = _WorkerFarm._workerFarm || new _WorkerFarm({});
    _WorkerFarm._workerFarm.setProps(props);
    return _WorkerFarm._workerFarm;
  }
  /** get global instance with WorkerFarm.getWorkerFarm() */
  constructor(props) {
    this.props = { ...DEFAULT_PROPS };
    this.setProps(props);
    this.workerPools = /* @__PURE__ */ new Map();
  }
  /**
   * Terminate all workers in the farm
   * @note Can free up significant memory
   */
  destroy() {
    for (const workerPool of this.workerPools.values()) {
      workerPool.destroy();
    }
    this.workerPools = /* @__PURE__ */ new Map();
  }
  /**
   * Set props used when initializing worker pools
   * @param props
   */
  setProps(props) {
    this.props = { ...this.props, ...props };
    for (const workerPool of this.workerPools.values()) {
      workerPool.setProps(this._getWorkerPoolProps());
    }
  }
  /**
   * Returns a worker pool for the specified worker
   * @param options - only used first time for a specific worker name
   * @param options.name - the name of the worker - used to identify worker pool
   * @param options.url -
   * @param options.source -
   * @example
   *   const job = WorkerFarm.getWorkerFarm().getWorkerPool({name, url}).startJob(...);
   */
  getWorkerPool(options) {
    const { name, source, url } = options;
    let workerPool = this.workerPools.get(name);
    if (!workerPool) {
      workerPool = new WorkerPool({
        name,
        source,
        url
      });
      workerPool.setProps(this._getWorkerPoolProps());
      this.workerPools.set(name, workerPool);
    }
    return workerPool;
  }
  _getWorkerPoolProps() {
    return {
      maxConcurrency: this.props.maxConcurrency,
      maxMobileConcurrency: this.props.maxMobileConcurrency,
      reuseWorkers: this.props.reuseWorkers,
      onDebug: this.props.onDebug
    };
  }
};

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-api/get-worker-url.js
function getWorkerURL(worker, options = {}) {
  const workerOptions = options[worker.id] || {};
  const workerFile = isBrowser3 ? worker.workerFile || `${worker.id}-worker.js` : `${worker.id}-worker-node.js`;
  let url = workerOptions.workerUrl;
  if (!url && worker.id === "compression") {
    url = options.workerUrl;
  }
  const workerType = options._workerType || options?.core?._workerType;
  if (workerType === "test") {
    if (isBrowser3) {
      url = `modules/${worker.module}/dist/${workerFile}`;
    } else {
      url = `modules/${worker.module}/src/workers/${worker.id}-worker-node.ts`;
    }
  }
  if (!url) {
    let version2 = worker.version;
    if (version2 === "latest") {
      version2 = NPM_TAG;
    }
    const versionTag = version2 ? `@${version2}` : "";
    url = `https://unpkg.com/@loaders.gl/${worker.module}${versionTag}/dist/${workerFile}`;
  }
  assert3(url);
  return url;
}

// node_modules/@loaders.gl/worker-utils/dist/lib/worker-api/validate-worker-version.js
function validateWorkerVersion(worker, coreVersion = VERSION3) {
  assert3(worker, "no worker provided");
  const workerVersion = worker.version;
  if (!coreVersion || !workerVersion) {
    return false;
  }
  return true;
}

// node_modules/@loaders.gl/loader-utils/dist/lib/worker-loader-utils/parse-with-worker.js
function canParseWithWorker(loader, options) {
  if (!WorkerFarm.isSupported()) {
    return false;
  }
  const nodeWorkers = options?._nodeWorkers ?? options?.core?._nodeWorkers;
  if (!isBrowser3 && !nodeWorkers) {
    return false;
  }
  const useWorkers = options?.worker ?? options?.core?.worker;
  return Boolean(loader.worker && useWorkers);
}
async function parseWithWorker(loader, data, options, context, parseOnMainThread) {
  const name = loader.id;
  const url = getWorkerURL(loader, options);
  const workerFarm = WorkerFarm.getWorkerFarm(options?.core);
  const workerPool = workerFarm.getWorkerPool({ name, url });
  options = JSON.parse(JSON.stringify(options || {}));
  options._workerLoaderId = loader.id;
  context = JSON.parse(JSON.stringify(context || {}));
  const job = await workerPool.startJob(
    "process-on-worker",
    // @ts-expect-error
    onMessage.bind(null, parseOnMainThread)
    // eslint-disable-line @typescript-eslint/no-misused-promises
  );
  job.postMessage("process", {
    // @ts-ignore
    input: data,
    options,
    context
  });
  const result = await job.result;
  return await result.result;
}
async function onMessage(parseOnMainThread, job, type, payload) {
  switch (type) {
    case "done":
      job.done(payload);
      break;
    case "error":
      job.error(new Error(payload.error));
      break;
    case "process":
      const { id, input, options } = payload;
      try {
        const result = await parseOnMainThread(input, options);
        job.postMessage("done", { id, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        job.postMessage("error", { id, error: message });
      }
      break;
    default:
      console.warn(`parse-with-worker unknown message ${type}`);
  }
}

// node_modules/@loaders.gl/loader-utils/dist/lib/binary-utils/array-buffer-utils.js
function compareArrayBuffers(arrayBuffer1, arrayBuffer2, byteLength) {
  byteLength = byteLength || arrayBuffer1.byteLength;
  if (arrayBuffer1.byteLength < byteLength || arrayBuffer2.byteLength < byteLength) {
    return false;
  }
  const array1 = new Uint8Array(arrayBuffer1);
  const array2 = new Uint8Array(arrayBuffer2);
  for (let i = 0; i < array1.length; ++i) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}
function concatenateArrayBuffers(...sources) {
  return concatenateArrayBuffersFromArray(sources);
}
function concatenateArrayBuffersFromArray(sources) {
  const sourceArrays = sources.map((source2) => source2 instanceof ArrayBuffer ? new Uint8Array(source2) : source2);
  const byteLength = sourceArrays.reduce((length, typedArray) => length + typedArray.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const sourceArray of sourceArrays) {
    result.set(sourceArray, offset);
    offset += sourceArray.byteLength;
  }
  return result.buffer;
}

// node_modules/@loaders.gl/loader-utils/dist/lib/iterators/async-iteration.js
async function concatenateArrayBuffersAsync(asyncIterator) {
  const arrayBuffers = [];
  for await (const chunk of asyncIterator) {
    arrayBuffers.push(copyToArrayBuffer(chunk));
  }
  return concatenateArrayBuffers(...arrayBuffers);
}
function copyToArrayBuffer(chunk) {
  if (chunk instanceof ArrayBuffer) {
    return chunk;
  }
  if (ArrayBuffer.isView(chunk)) {
    const { buffer, byteOffset, byteLength } = chunk;
    return copyFromBuffer(buffer, byteOffset, byteLength);
  }
  return copyFromBuffer(chunk);
}
function copyFromBuffer(buffer, byteOffset = 0, byteLength = buffer.byteLength - byteOffset) {
  const view = new Uint8Array(buffer, byteOffset, byteLength);
  const copy = new Uint8Array(view.length);
  copy.set(view);
  return copy.buffer;
}

// node_modules/@loaders.gl/loader-utils/dist/lib/path-utils/file-aliases.js
var pathPrefix = "";
var fileAliases = {};
function resolvePath(filename2) {
  for (const alias in fileAliases) {
    if (filename2.startsWith(alias)) {
      const replacement = fileAliases[alias];
      filename2 = filename2.replace(alias, replacement);
    }
  }
  if (!filename2.startsWith("http://") && !filename2.startsWith("https://")) {
    filename2 = `${pathPrefix}${filename2}`;
  }
  return filename2;
}

// node_modules/@loaders.gl/loader-utils/dist/lib/node/buffer.browser.js
function toArrayBuffer(buffer) {
  return buffer;
}

// node_modules/@loaders.gl/loader-utils/dist/lib/binary-utils/memory-conversion-utils.js
function isBuffer(value) {
  return value && typeof value === "object" && value.isBuffer;
}
function toArrayBuffer2(data) {
  if (isBuffer(data)) {
    return toArrayBuffer(data);
  }
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (isSharedArrayBuffer(data)) {
    return copyToArrayBuffer2(data);
  }
  if (ArrayBuffer.isView(data)) {
    const buffer = data.buffer;
    if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
      return buffer;
    }
    return buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  if (typeof data === "string") {
    const text = data;
    const uint8Array = new TextEncoder().encode(text);
    return uint8Array.buffer;
  }
  if (data && typeof data === "object" && data._toArrayBuffer) {
    return data._toArrayBuffer();
  }
  throw new Error("toArrayBuffer");
}
function ensureArrayBuffer(bufferSource) {
  if (bufferSource instanceof ArrayBuffer) {
    return bufferSource;
  }
  if (isSharedArrayBuffer(bufferSource)) {
    return copyToArrayBuffer2(bufferSource);
  }
  const { buffer, byteOffset, byteLength } = bufferSource;
  if (buffer instanceof ArrayBuffer && byteOffset === 0 && byteLength === buffer.byteLength) {
    return buffer;
  }
  return copyToArrayBuffer2(buffer, byteOffset, byteLength);
}
function copyToArrayBuffer2(buffer, byteOffset = 0, byteLength = buffer.byteLength - byteOffset) {
  const view = new Uint8Array(buffer, byteOffset, byteLength);
  const copy = new Uint8Array(view.length);
  copy.set(view);
  return copy.buffer;
}
function toArrayBufferView(data) {
  if (ArrayBuffer.isView(data)) {
    return data;
  }
  return new Uint8Array(data);
}

// node_modules/@loaders.gl/loader-utils/dist/lib/path-utils/path.js
var path_exports = {};
__export(path_exports, {
  dirname: () => dirname,
  filename: () => filename,
  join: () => join,
  resolve: () => resolve
});

// node_modules/@loaders.gl/loader-utils/dist/lib/path-utils/get-cwd.js
function getCWD() {
  if (typeof process !== "undefined" && typeof process.cwd !== "undefined") {
    return process.cwd();
  }
  const pathname = window.location?.pathname;
  return pathname?.slice(0, pathname.lastIndexOf("/") + 1) || "";
}

// node_modules/@loaders.gl/loader-utils/dist/lib/path-utils/path.js
function filename(url) {
  const slashIndex = url ? url.lastIndexOf("/") : -1;
  return slashIndex >= 0 ? url.substr(slashIndex + 1) : url;
}
function dirname(url) {
  const slashIndex = url ? url.lastIndexOf("/") : -1;
  return slashIndex >= 0 ? url.substr(0, slashIndex) : "";
}
function join(...parts) {
  const separator = "/";
  parts = parts.map((part, index) => {
    if (index) {
      part = part.replace(new RegExp(`^${separator}`), "");
    }
    if (index !== parts.length - 1) {
      part = part.replace(new RegExp(`${separator}$`), "");
    }
    return part;
  });
  return parts.join(separator);
}
function resolve(...components) {
  const paths = [];
  for (let _i = 0; _i < components.length; _i++) {
    paths[_i] = components[_i];
  }
  let resolvedPath = "";
  let resolvedAbsolute = false;
  let cwd;
  for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    let path;
    if (i >= 0) {
      path = paths[i];
    } else {
      if (cwd === void 0) {
        cwd = getCWD();
      }
      path = cwd;
    }
    if (path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = path.charCodeAt(0) === SLASH;
  }
  resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute) {
    return `/${resolvedPath}`;
  } else if (resolvedPath.length > 0) {
    return resolvedPath;
  }
  return ".";
}
var SLASH = 47;
var DOT = 46;
function normalizeStringPosix(path, allowAboveRoot) {
  let res = "";
  let lastSlash = -1;
  let dots = 0;
  let code;
  let isAboveRoot = false;
  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) {
      code = path.charCodeAt(i);
    } else if (code === SLASH) {
      break;
    } else {
      code = SLASH;
    }
    if (code === SLASH) {
      if (lastSlash === i - 1 || dots === 1) {
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || !isAboveRoot || res.charCodeAt(res.length - 1) !== DOT || res.charCodeAt(res.length - 2) !== DOT) {
          if (res.length > 2) {
            const start = res.length - 1;
            let j = start;
            for (; j >= 0; --j) {
              if (res.charCodeAt(j) === SLASH) {
                break;
              }
            }
            if (j !== start) {
              res = j === -1 ? "" : res.slice(0, j);
              lastSlash = i;
              dots = 0;
              isAboveRoot = false;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSlash = i;
            dots = 0;
            isAboveRoot = false;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) {
            res += "/..";
          } else {
            res = "..";
          }
          isAboveRoot = true;
        }
      } else {
        const slice = path.slice(lastSlash + 1, i);
        if (res.length > 0) {
          res += `/${slice}`;
        } else {
          res = slice;
        }
        isAboveRoot = false;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

// node_modules/@loaders.gl/core/dist/lib/fetch/fetch-error.js
var FetchError = class extends Error {
  constructor(message, info) {
    super(message);
    this.reason = info.reason;
    this.url = info.url;
    this.response = info.response;
  }
  /** A best effort reason for why the fetch failed */
  reason;
  /** The URL that failed to load. Empty string if not available. */
  url;
  /** The Response object, if any. */
  response;
};

// node_modules/@loaders.gl/core/dist/lib/utils/mime-type-utils.js
var DATA_URL_PATTERN = /^data:([-\w.]+\/[-\w.+]+)(;|,)/;
var MIME_TYPE_PATTERN = /^([-\w.]+\/[-\w.+]+)/;
function compareMIMETypes(mimeType1, mimeType2) {
  if (mimeType1.toLowerCase() === mimeType2.toLowerCase()) {
    return true;
  }
  return false;
}
function parseMIMEType(mimeString) {
  const matches3 = MIME_TYPE_PATTERN.exec(mimeString);
  if (matches3) {
    return matches3[1];
  }
  return mimeString;
}
function parseMIMETypeFromURL(url) {
  const matches3 = DATA_URL_PATTERN.exec(url);
  if (matches3) {
    return matches3[1];
  }
  return "";
}

// node_modules/@loaders.gl/core/dist/lib/utils/url-utils.js
var QUERY_STRING_PATTERN = /\?.*/;
function extractQueryString(url) {
  const matches3 = url.match(QUERY_STRING_PATTERN);
  return matches3 && matches3[0];
}
function stripQueryString(url) {
  return url.replace(QUERY_STRING_PATTERN, "");
}
function shortenUrlForDisplay(url) {
  if (url.length < 50) {
    return url;
  }
  const urlEnd = url.slice(url.length - 15);
  const urlStart = url.substr(0, 32);
  return `${urlStart}...${urlEnd}`;
}

// node_modules/@loaders.gl/core/dist/lib/utils/resource-utils.js
function getResourceUrl(resource) {
  if (isResponse(resource)) {
    return resource.url;
  }
  if (isBlob(resource)) {
    const fileName = "name" in resource ? resource.name : "";
    return fileName || "";
  }
  if (typeof resource === "string") {
    return resource;
  }
  return "";
}
function getResourceMIMEType(resource) {
  if (isResponse(resource)) {
    const contentTypeHeader = resource.headers.get("content-type") || "";
    const noQueryUrl = stripQueryString(resource.url);
    return parseMIMEType(contentTypeHeader) || parseMIMETypeFromURL(noQueryUrl);
  }
  if (isBlob(resource)) {
    return resource.type || "";
  }
  if (typeof resource === "string") {
    return parseMIMETypeFromURL(resource);
  }
  return "";
}
function getResourceContentLength(resource) {
  if (isResponse(resource)) {
    const response = resource;
    return response.headers["content-length"] || -1;
  }
  if (isBlob(resource)) {
    const blob = resource;
    return blob.size;
  }
  if (typeof resource === "string") {
    return resource.length;
  }
  if (resource instanceof ArrayBuffer) {
    return resource.byteLength;
  }
  if (ArrayBuffer.isView(resource)) {
    return resource.byteLength;
  }
  return -1;
}

// node_modules/@loaders.gl/core/dist/lib/utils/response-utils.js
async function makeResponse(resource) {
  if (isResponse(resource)) {
    return resource;
  }
  const headers = {};
  const contentLength = getResourceContentLength(resource);
  if (contentLength >= 0) {
    headers["content-length"] = String(contentLength);
  }
  const url = getResourceUrl(resource);
  const type = getResourceMIMEType(resource);
  if (type) {
    headers["content-type"] = type;
  }
  const initialDataUrl = await getInitialDataUrl(resource);
  if (initialDataUrl) {
    headers["x-first-bytes"] = initialDataUrl;
  }
  if (typeof resource === "string") {
    resource = new TextEncoder().encode(resource);
  }
  const response = new Response(resource, { headers });
  Object.defineProperty(response, "url", { value: url });
  return response;
}
async function checkResponse(response) {
  if (!response.ok) {
    const error = await getResponseError(response);
    throw error;
  }
}
async function getResponseError(response) {
  const shortUrl = shortenUrlForDisplay(response.url);
  let message = `Failed to fetch resource (${response.status}) ${response.statusText}: ${shortUrl}`;
  message = message.length > 100 ? `${message.slice(0, 100)}...` : message;
  const info = {
    reason: response.statusText,
    url: response.url,
    response
  };
  try {
    const contentType = response.headers.get("Content-Type");
    info.reason = !response.bodyUsed && contentType?.includes("application/json") ? await response.json() : await response.text();
  } catch (error) {
  }
  return new FetchError(message, info);
}
async function getInitialDataUrl(resource) {
  const INITIAL_DATA_LENGTH = 5;
  if (typeof resource === "string") {
    return `data:,${resource.slice(0, INITIAL_DATA_LENGTH)}`;
  }
  if (resource instanceof Blob) {
    const blobSlice = resource.slice(0, 5);
    return await new Promise((resolve2) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve2(event?.target?.result);
      reader.readAsDataURL(blobSlice);
    });
  }
  if (resource instanceof ArrayBuffer) {
    const slice = resource.slice(0, INITIAL_DATA_LENGTH);
    const base64 = arrayBufferToBase64(slice);
    return `data:base64,${base64}`;
  }
  return null;
}
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// node_modules/@loaders.gl/core/dist/lib/fetch/fetch-file.js
function isNodePath(url) {
  return !isRequestURL(url) && !isDataURL(url);
}
function isRequestURL(url) {
  return url.startsWith("http:") || url.startsWith("https:");
}
function isDataURL(url) {
  return url.startsWith("data:");
}
async function fetchFile(urlOrData, fetchOptions) {
  if (typeof urlOrData === "string") {
    const url = resolvePath(urlOrData);
    if (isNodePath(url)) {
      if (globalThis.loaders?.fetchNode) {
        return globalThis.loaders?.fetchNode(url, fetchOptions);
      }
    }
    return await fetch(url, fetchOptions);
  }
  return await makeResponse(urlOrData);
}

// node_modules/@loaders.gl/core/dist/lib/loader-utils/loggers.js
var probeLog = new ProbeLog({ id: "loaders.gl" });
var NullLog = class {
  log() {
    return () => {
    };
  }
  info() {
    return () => {
    };
  }
  warn() {
    return () => {
    };
  }
  error() {
    return () => {
    };
  }
};
var ConsoleLog = class {
  console;
  constructor() {
    this.console = console;
  }
  log(...args) {
    return this.console.log.bind(this.console, ...args);
  }
  info(...args) {
    return this.console.info.bind(this.console, ...args);
  }
  warn(...args) {
    return this.console.warn.bind(this.console, ...args);
  }
  error(...args) {
    return this.console.error.bind(this.console, ...args);
  }
};

// node_modules/@loaders.gl/core/dist/lib/loader-utils/option-defaults.js
var DEFAULT_LOADER_OPTIONS = {
  core: {
    baseUrl: void 0,
    // baseUrl
    fetch: null,
    mimeType: void 0,
    fallbackMimeType: void 0,
    ignoreRegisteredLoaders: void 0,
    nothrow: false,
    log: new ConsoleLog(),
    // A probe.gl compatible (`log.log()()` syntax) that just logs to console
    useLocalLibraries: false,
    CDN: "https://unpkg.com/@loaders.gl",
    worker: true,
    // By default, use worker if provided by loader.
    maxConcurrency: 3,
    // How many worker instances should be created for each loader.
    maxMobileConcurrency: 1,
    // How many worker instances should be created for each loader on mobile devices.
    reuseWorkers: isBrowser,
    // By default reuse workers in browser (Node.js refuses to terminate if browsers are running)
    _nodeWorkers: false,
    // By default do not support node workers
    _workerType: "",
    // 'test' to use locally generated workers
    limit: 0,
    _limitMB: 0,
    batchSize: "auto",
    batchDebounceMs: 0,
    metadata: false,
    // TODO - currently only implemented for parseInBatches, adds initial metadata batch,
    transforms: []
  }
};
var REMOVED_LOADER_OPTIONS = {
  // deprecated top-level alias
  baseUri: "core.baseUrl",
  fetch: "core.fetch",
  mimeType: "core.mimeType",
  fallbackMimeType: "core.fallbackMimeType",
  ignoreRegisteredLoaders: "core.ignoreRegisteredLoaders",
  nothrow: "core.nothrow",
  log: "core.log",
  useLocalLibraries: "core.useLocalLibraries",
  CDN: "core.CDN",
  worker: "core.worker",
  maxConcurrency: "core.maxConcurrency",
  maxMobileConcurrency: "core.maxMobileConcurrency",
  reuseWorkers: "core.reuseWorkers",
  _nodeWorkers: "core.nodeWorkers",
  _workerType: "core._workerType",
  _worker: "core._workerType",
  limit: "core.limit",
  _limitMB: "core._limitMB",
  batchSize: "core.batchSize",
  batchDebounceMs: "core.batchDebounceMs",
  metadata: "core.metadata",
  transforms: "core.transforms",
  // Older deprecations
  throws: "nothrow",
  dataType: "(no longer used)",
  uri: "core.baseUrl",
  // Warn if fetch options are used on toplevel
  method: "core.fetch.method",
  headers: "core.fetch.headers",
  body: "core.fetch.body",
  mode: "core.fetch.mode",
  credentials: "core.fetch.credentials",
  cache: "core.fetch.cache",
  redirect: "core.fetch.redirect",
  referrer: "core.fetch.referrer",
  referrerPolicy: "core.fetch.referrerPolicy",
  integrity: "core.fetch.integrity",
  keepalive: "core.fetch.keepalive",
  signal: "core.fetch.signal"
};

// node_modules/@loaders.gl/core/dist/lib/loader-utils/option-utils.js
var CORE_LOADER_OPTION_KEYS = [
  "baseUrl",
  "fetch",
  "mimeType",
  "fallbackMimeType",
  "ignoreRegisteredLoaders",
  "nothrow",
  "log",
  "useLocalLibraries",
  "CDN",
  "worker",
  "maxConcurrency",
  "maxMobileConcurrency",
  "reuseWorkers",
  "_nodeWorkers",
  "_workerType",
  "limit",
  "_limitMB",
  "batchSize",
  "batchDebounceMs",
  "metadata",
  "transforms"
];
function getGlobalLoaderState() {
  globalThis.loaders = globalThis.loaders || {};
  const { loaders } = globalThis;
  if (!loaders._state) {
    loaders._state = {};
  }
  return loaders._state;
}
function getGlobalLoaderOptions() {
  const state = getGlobalLoaderState();
  state.globalOptions = state.globalOptions || {
    ...DEFAULT_LOADER_OPTIONS,
    core: { ...DEFAULT_LOADER_OPTIONS.core }
  };
  return normalizeLoaderOptions(state.globalOptions);
}
function normalizeOptions(options, loader, loaders, url) {
  loaders = loaders || [];
  loaders = Array.isArray(loaders) ? loaders : [loaders];
  validateOptions(options, loaders);
  return normalizeLoaderOptions(normalizeOptionsInternal(loader, options, url));
}
function normalizeLoaderOptions(options) {
  const normalized = cloneLoaderOptions(options);
  moveDeprecatedTopLevelOptionsToCore(normalized);
  for (const key of CORE_LOADER_OPTION_KEYS) {
    if (normalized.core && normalized.core[key] !== void 0) {
      delete normalized[key];
    }
  }
  if (normalized.core && normalized.core._workerType !== void 0) {
    delete normalized._worker;
  }
  return normalized;
}
function validateOptions(options, loaders) {
  validateOptionsObject(options, null, DEFAULT_LOADER_OPTIONS, REMOVED_LOADER_OPTIONS, loaders);
  for (const loader of loaders) {
    const idOptions = options && options[loader.id] || {};
    const loaderOptions = loader.options && loader.options[loader.id] || {};
    const deprecatedOptions = loader.deprecatedOptions && loader.deprecatedOptions[loader.id] || {};
    validateOptionsObject(idOptions, loader.id, loaderOptions, deprecatedOptions, loaders);
  }
}
function validateOptionsObject(options, id, defaultOptions, deprecatedOptions, loaders) {
  const loaderName = id || "Top level";
  const prefix = id ? `${id}.` : "";
  for (const key in options) {
    const isSubOptions = !id && isObject(options[key]);
    const isBaseUriOption = key === "baseUri" && !id;
    const isWorkerUrlOption = key === "workerUrl" && id;
    if (!(key in defaultOptions) && !isBaseUriOption && !isWorkerUrlOption) {
      if (key in deprecatedOptions) {
        if (probeLog.level > 0) {
          probeLog.warn(`${loaderName} loader option '${prefix}${key}' no longer supported, use '${deprecatedOptions[key]}'`)();
        }
      } else if (!isSubOptions) {
        if (probeLog.level > 0) {
          const suggestion = findSimilarOption(key, loaders);
          probeLog.warn(`${loaderName} loader option '${prefix}${key}' not recognized. ${suggestion}`)();
        }
      }
    }
  }
}
function findSimilarOption(optionKey, loaders) {
  const lowerCaseOptionKey = optionKey.toLowerCase();
  let bestSuggestion = "";
  for (const loader of loaders) {
    for (const key in loader.options) {
      if (optionKey === key) {
        return `Did you mean '${loader.id}.${key}'?`;
      }
      const lowerCaseKey = key.toLowerCase();
      const isPartialMatch = lowerCaseOptionKey.startsWith(lowerCaseKey) || lowerCaseKey.startsWith(lowerCaseOptionKey);
      if (isPartialMatch) {
        bestSuggestion = bestSuggestion || `Did you mean '${loader.id}.${key}'?`;
      }
    }
  }
  return bestSuggestion;
}
function normalizeOptionsInternal(loader, options, url) {
  const loaderDefaultOptions = loader.options || {};
  const mergedOptions = { ...loaderDefaultOptions };
  if (loaderDefaultOptions.core) {
    mergedOptions.core = { ...loaderDefaultOptions.core };
  }
  moveDeprecatedTopLevelOptionsToCore(mergedOptions);
  if (mergedOptions.core?.log === null) {
    mergedOptions.core = { ...mergedOptions.core, log: new NullLog() };
  }
  mergeNestedFields(mergedOptions, normalizeLoaderOptions(getGlobalLoaderOptions()));
  const userOptions = normalizeLoaderOptions(options);
  mergeNestedFields(mergedOptions, userOptions);
  addUrlOptions(mergedOptions, url);
  addDeprecatedTopLevelOptions(mergedOptions);
  return mergedOptions;
}
function mergeNestedFields(mergedOptions, options) {
  for (const key in options) {
    if (key in options) {
      const value = options[key];
      if (isPureObject(value) && isPureObject(mergedOptions[key])) {
        mergedOptions[key] = {
          ...mergedOptions[key],
          ...options[key]
        };
      } else {
        mergedOptions[key] = options[key];
      }
    }
  }
}
function addUrlOptions(options, url) {
  if (!url) {
    return;
  }
  const hasCoreBaseUrl = options.core?.baseUrl !== void 0;
  if (!hasCoreBaseUrl) {
    options.core ||= {};
    options.core.baseUrl = path_exports.dirname(stripQueryString(url));
  }
}
function cloneLoaderOptions(options) {
  const clonedOptions = { ...options };
  if (options.core) {
    clonedOptions.core = { ...options.core };
  }
  return clonedOptions;
}
function moveDeprecatedTopLevelOptionsToCore(options) {
  if (options.baseUri !== void 0) {
    options.core ||= {};
    if (options.core.baseUrl === void 0) {
      options.core.baseUrl = options.baseUri;
    }
  }
  for (const key of CORE_LOADER_OPTION_KEYS) {
    if (options[key] !== void 0) {
      const coreOptions = options.core = options.core || {};
      const coreRecord = coreOptions;
      if (coreRecord[key] === void 0) {
        coreRecord[key] = options[key];
      }
    }
  }
  const workerTypeAlias = options._worker;
  if (workerTypeAlias !== void 0) {
    options.core ||= {};
    if (options.core._workerType === void 0) {
      options.core._workerType = workerTypeAlias;
    }
  }
}
function addDeprecatedTopLevelOptions(options) {
  const coreOptions = options.core;
  if (!coreOptions) {
    return;
  }
  for (const key of CORE_LOADER_OPTION_KEYS) {
    if (coreOptions[key] !== void 0) {
      options[key] = coreOptions[key];
    }
  }
}

// node_modules/@loaders.gl/core/dist/lib/loader-utils/normalize-loader.js
function isLoaderObject(loader) {
  if (!loader) {
    return false;
  }
  if (Array.isArray(loader)) {
    loader = loader[0];
  }
  const hasExtensions = Array.isArray(loader?.extensions);
  return hasExtensions;
}
function normalizeLoader(loader) {
  assert(loader, "null loader");
  assert(isLoaderObject(loader), "invalid loader");
  let options;
  if (Array.isArray(loader)) {
    options = loader[1];
    loader = loader[0];
    loader = {
      ...loader,
      options: { ...loader.options, ...options }
    };
  }
  if (loader?.parseTextSync || loader?.parseText) {
    loader.text = true;
  }
  if (!loader.text) {
    loader.binary = true;
  }
  return loader;
}

// node_modules/@loaders.gl/core/dist/lib/api/register-loaders.js
var getGlobalLoaderRegistry = () => {
  const state = getGlobalLoaderState();
  state.loaderRegistry = state.loaderRegistry || [];
  return state.loaderRegistry;
};
function getRegisteredLoaders() {
  return getGlobalLoaderRegistry();
}

// node_modules/@loaders.gl/core/dist/lib/api/select-loader.js
var EXT_PATTERN = /\.([^.]+)$/;
async function selectLoader(data, loaders = [], options, context) {
  if (!validHTTPResponse(data)) {
    return null;
  }
  const normalizedOptions = normalizeLoaderOptions(options || {});
  normalizedOptions.core ||= {};
  if (data instanceof Response && mayContainText(data)) {
    const text = await data.clone().text();
    const textLoader = selectLoaderSync(text, loaders, { ...normalizedOptions, core: { ...normalizedOptions.core, nothrow: true } }, context);
    if (textLoader) {
      return textLoader;
    }
  }
  let loader = selectLoaderSync(data, loaders, { ...normalizedOptions, core: { ...normalizedOptions.core, nothrow: true } }, context);
  if (loader) {
    return loader;
  }
  if (isBlob(data)) {
    data = await data.slice(0, 10).arrayBuffer();
    loader = selectLoaderSync(data, loaders, normalizedOptions, context);
  }
  if (!loader && data instanceof Response && mayContainText(data)) {
    const text = await data.clone().text();
    loader = selectLoaderSync(text, loaders, normalizedOptions, context);
  }
  if (!loader && !normalizedOptions.core.nothrow) {
    throw new Error(getNoValidLoaderMessage(data));
  }
  return loader;
}
function mayContainText(response) {
  const mimeType = getResourceMIMEType(response);
  return Boolean(mimeType && (mimeType.startsWith("text/") || mimeType === "application/json" || mimeType.endsWith("+json")));
}
function selectLoaderSync(data, loaders = [], options, context) {
  if (!validHTTPResponse(data)) {
    return null;
  }
  const normalizedOptions = normalizeLoaderOptions(options || {});
  normalizedOptions.core ||= {};
  if (loaders && !Array.isArray(loaders)) {
    return normalizeLoader(loaders);
  }
  let candidateLoaders = [];
  if (loaders) {
    candidateLoaders = candidateLoaders.concat(loaders);
  }
  if (!normalizedOptions.core.ignoreRegisteredLoaders) {
    candidateLoaders.push(...getRegisteredLoaders());
  }
  normalizeLoaders(candidateLoaders);
  const loader = selectLoaderInternal(data, candidateLoaders, normalizedOptions, context);
  if (!loader && !normalizedOptions.core.nothrow) {
    throw new Error(getNoValidLoaderMessage(data));
  }
  return loader;
}
function selectLoaderInternal(data, loaders, options, context) {
  const url = getResourceUrl(data);
  const type = getResourceMIMEType(data);
  const testUrl = stripQueryString(url) || context?.url;
  let loader = null;
  let reason = "";
  if (options?.core?.mimeType) {
    loader = findLoaderByMIMEType(loaders, options?.core?.mimeType);
    reason = `match forced by supplied MIME type ${options?.core?.mimeType}`;
  }
  loader = loader || findLoaderByUrl(loaders, testUrl);
  reason = reason || (loader ? `matched url ${testUrl}` : "");
  loader = loader || findLoaderByMIMEType(loaders, type);
  reason = reason || (loader ? `matched MIME type ${type}` : "");
  loader = loader || findLoaderByInitialBytes(loaders, data);
  reason = reason || (loader ? `matched initial data ${getFirstCharacters(data)}` : "");
  if (options?.core?.fallbackMimeType) {
    loader = loader || findLoaderByMIMEType(loaders, options?.core?.fallbackMimeType);
    reason = reason || (loader ? `matched fallback MIME type ${type}` : "");
  }
  if (reason) {
    log.log(1, `selectLoader selected ${loader?.name}: ${reason}.`);
  }
  return loader;
}
function validHTTPResponse(data) {
  if (data instanceof Response) {
    if (data.status === 204) {
      return false;
    }
  }
  return true;
}
function getNoValidLoaderMessage(data) {
  const url = getResourceUrl(data);
  const type = getResourceMIMEType(data);
  let message = "No valid loader found (";
  message += url ? `${path_exports.filename(url)}, ` : "no url provided, ";
  message += `MIME type: ${type ? `"${type}"` : "not provided"}, `;
  const firstCharacters = data ? getFirstCharacters(data) : "";
  message += firstCharacters ? ` first bytes: "${firstCharacters}"` : "first bytes: not available";
  message += ")";
  return message;
}
function normalizeLoaders(loaders) {
  for (const loader of loaders) {
    normalizeLoader(loader);
  }
}
function findLoaderByUrl(loaders, url) {
  const match = url && EXT_PATTERN.exec(url);
  const extension = match && match[1];
  return extension ? findLoaderByExtension(loaders, extension) : null;
}
function findLoaderByExtension(loaders, extension) {
  extension = extension.toLowerCase();
  for (const loader of loaders) {
    for (const loaderExtension of loader.extensions) {
      if (loaderExtension.toLowerCase() === extension) {
        return loader;
      }
    }
  }
  return null;
}
function findLoaderByMIMEType(loaders, mimeType) {
  for (const loader of loaders) {
    if (loader.mimeTypes?.some((mimeType1) => compareMIMETypes(mimeType, mimeType1))) {
      return loader;
    }
    if (compareMIMETypes(mimeType, `application/x.${loader.id}`)) {
      return loader;
    }
  }
  return null;
}
function findLoaderByInitialBytes(loaders, data) {
  if (!data) {
    return null;
  }
  for (const loader of loaders) {
    if (typeof data === "string") {
      if (testDataAgainstText(data, loader)) {
        return loader;
      }
    } else if (ArrayBuffer.isView(data)) {
      if (testDataAgainstBinary(data.buffer, data.byteOffset, loader)) {
        return loader;
      }
    } else if (data instanceof ArrayBuffer) {
      const byteOffset = 0;
      if (testDataAgainstBinary(data, byteOffset, loader)) {
        return loader;
      }
    }
  }
  return null;
}
function testDataAgainstText(data, loader) {
  if (loader.testText) {
    return loader.testText(data);
  }
  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some((test) => data.startsWith(test));
}
function testDataAgainstBinary(data, byteOffset, loader) {
  const tests = Array.isArray(loader.tests) ? loader.tests : [loader.tests];
  return tests.some((test) => testBinary(data, byteOffset, loader, test));
}
function testBinary(data, byteOffset, loader, test) {
  if (isArrayBufferLike(test)) {
    return compareArrayBuffers(test, data, test.byteLength);
  }
  switch (typeof test) {
    case "function":
      return test(ensureArrayBuffer(data));
    case "string":
      const magic = getMagicString(data, byteOffset, test.length);
      return test === magic;
    default:
      return false;
  }
}
function getFirstCharacters(data, length = 5) {
  if (typeof data === "string") {
    return data.slice(0, length);
  } else if (ArrayBuffer.isView(data)) {
    return getMagicString(data.buffer, data.byteOffset, length);
  } else if (data instanceof ArrayBuffer) {
    const byteOffset = 0;
    return getMagicString(data, byteOffset, length);
  }
  return "";
}
function getMagicString(arrayBuffer, byteOffset, length) {
  if (arrayBuffer.byteLength < byteOffset + length) {
    return "";
  }
  const dataView = new DataView(arrayBuffer);
  let magic = "";
  for (let i = 0; i < length; i++) {
    magic += String.fromCharCode(dataView.getUint8(byteOffset + i));
  }
  return magic;
}

// node_modules/@loaders.gl/core/dist/iterators/make-iterator/make-string-iterator.js
var DEFAULT_CHUNK_SIZE = 256 * 1024;
function* makeStringIterator(string, options) {
  const chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE;
  let offset = 0;
  const textEncoder = new TextEncoder();
  while (offset < string.length) {
    const chunkLength = Math.min(string.length - offset, chunkSize);
    const chunk = string.slice(offset, offset + chunkLength);
    offset += chunkLength;
    yield ensureArrayBuffer(textEncoder.encode(chunk));
  }
}

// node_modules/@loaders.gl/core/dist/iterators/make-iterator/make-array-buffer-iterator.js
var DEFAULT_CHUNK_SIZE2 = 256 * 1024;
function* makeArrayBufferIterator(arrayBuffer, options = {}) {
  const { chunkSize = DEFAULT_CHUNK_SIZE2 } = options;
  let byteOffset = 0;
  while (byteOffset < arrayBuffer.byteLength) {
    const chunkByteLength = Math.min(arrayBuffer.byteLength - byteOffset, chunkSize);
    const chunk = new ArrayBuffer(chunkByteLength);
    const sourceArray = new Uint8Array(arrayBuffer, byteOffset, chunkByteLength);
    const chunkArray = new Uint8Array(chunk);
    chunkArray.set(sourceArray);
    byteOffset += chunkByteLength;
    yield chunk;
  }
}

// node_modules/@loaders.gl/core/dist/iterators/make-iterator/make-blob-iterator.js
var DEFAULT_CHUNK_SIZE3 = 1024 * 1024;
async function* makeBlobIterator(blob, options) {
  const chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE3;
  let offset = 0;
  while (offset < blob.size) {
    const end = offset + chunkSize;
    const chunk = await blob.slice(offset, end).arrayBuffer();
    offset = end;
    yield chunk;
  }
}

// node_modules/@loaders.gl/core/dist/iterators/make-iterator/make-stream-iterator.js
function makeStreamIterator(stream, options) {
  return isBrowser ? makeBrowserStreamIterator(stream, options) : makeNodeStreamIterator(stream, options);
}
async function* makeBrowserStreamIterator(stream, options) {
  const reader = stream.getReader();
  let nextBatchPromise;
  try {
    while (true) {
      const currentBatchPromise = nextBatchPromise || reader.read();
      if (options?._streamReadAhead) {
        nextBatchPromise = reader.read();
      }
      const { done, value } = await currentBatchPromise;
      if (done) {
        return;
      }
      yield toArrayBuffer2(value);
    }
  } catch (error) {
    reader.releaseLock();
  }
}
async function* makeNodeStreamIterator(stream, options) {
  for await (const chunk of stream) {
    yield toArrayBuffer2(chunk);
  }
}

// node_modules/@loaders.gl/core/dist/iterators/make-iterator/make-iterator.js
function makeIterator(data, options) {
  if (typeof data === "string") {
    return makeStringIterator(data, options);
  }
  if (data instanceof ArrayBuffer) {
    return makeArrayBufferIterator(data, options);
  }
  if (isBlob(data)) {
    return makeBlobIterator(data, options);
  }
  if (isReadableStream(data)) {
    return makeStreamIterator(data, options);
  }
  if (isResponse(data)) {
    const responseBody = data.body;
    if (!responseBody) {
      throw new Error("Readable stream not available on Response");
    }
    return makeStreamIterator(responseBody, options);
  }
  throw new Error("makeIterator");
}

// node_modules/@loaders.gl/core/dist/lib/loader-utils/get-data.js
var ERR_DATA = "Cannot convert supplied data type";
function getArrayBufferOrStringFromDataSync(data, loader, options) {
  if (loader.text && typeof data === "string") {
    return data;
  }
  if (isBuffer(data)) {
    data = data.buffer;
  }
  if (isArrayBufferLike(data)) {
    const bufferSource = toArrayBufferView(data);
    if (loader.text && !loader.binary) {
      const textDecoder = new TextDecoder("utf8");
      return textDecoder.decode(bufferSource);
    }
    return toArrayBuffer2(bufferSource);
  }
  throw new Error(ERR_DATA);
}
async function getArrayBufferOrStringFromData(data, loader, options) {
  if (typeof data === "string" || isArrayBufferLike(data)) {
    return getArrayBufferOrStringFromDataSync(data, loader, options);
  }
  if (isBlob(data)) {
    data = await makeResponse(data);
  }
  if (isResponse(data)) {
    await checkResponse(data);
    return loader.binary ? await data.arrayBuffer() : await data.text();
  }
  if (isReadableStream(data)) {
    data = makeIterator(data, options);
  }
  if (isIterable(data) || isAsyncIterable(data)) {
    return concatenateArrayBuffersAsync(data);
  }
  throw new Error(ERR_DATA);
}

// node_modules/@loaders.gl/core/dist/lib/loader-utils/get-fetch-function.js
function getFetchFunction(options, context) {
  const globalOptions = getGlobalLoaderOptions();
  const loaderOptions = options || globalOptions;
  const fetchOption = loaderOptions.fetch ?? loaderOptions.core?.fetch;
  if (typeof fetchOption === "function") {
    return fetchOption;
  }
  if (isObject(fetchOption)) {
    return (url) => fetchFile(url, fetchOption);
  }
  if (context?.fetch) {
    return context?.fetch;
  }
  return fetchFile;
}

// node_modules/@loaders.gl/core/dist/lib/loader-utils/loader-context.js
function getLoaderContext(context, options, parentContext) {
  if (parentContext) {
    return parentContext;
  }
  const newContext = {
    fetch: getFetchFunction(options, context),
    ...context
  };
  if (newContext.url) {
    const baseUrl = stripQueryString(newContext.url);
    newContext.baseUrl = baseUrl;
    newContext.queryString = extractQueryString(newContext.url);
    newContext.filename = path_exports.filename(baseUrl);
    newContext.baseUrl = path_exports.dirname(baseUrl);
  }
  if (!Array.isArray(newContext.loaders)) {
    newContext.loaders = null;
  }
  return newContext;
}
function getLoadersFromContext(loaders, context) {
  if (loaders && !Array.isArray(loaders)) {
    return loaders;
  }
  let candidateLoaders;
  if (loaders) {
    candidateLoaders = Array.isArray(loaders) ? loaders : [loaders];
  }
  if (context && context.loaders) {
    const contextLoaders = Array.isArray(context.loaders) ? context.loaders : [context.loaders];
    candidateLoaders = candidateLoaders ? [...candidateLoaders, ...contextLoaders] : contextLoaders;
  }
  return candidateLoaders && candidateLoaders.length ? candidateLoaders : void 0;
}

// node_modules/@loaders.gl/core/dist/lib/api/parse.js
async function parse(data, loaders, options, context) {
  if (loaders && !Array.isArray(loaders) && !isLoaderObject(loaders)) {
    context = void 0;
    options = loaders;
    loaders = void 0;
  }
  data = await data;
  options = options || {};
  const url = getResourceUrl(data);
  const typedLoaders = loaders;
  const candidateLoaders = getLoadersFromContext(typedLoaders, context);
  const loader = await selectLoader(data, candidateLoaders, options);
  if (!loader) {
    return null;
  }
  const strictOptions = normalizeOptions(options, loader, candidateLoaders, url);
  context = getLoaderContext(
    // @ts-expect-error
    { url, _parse: parse, loaders: candidateLoaders },
    strictOptions,
    context || null
  );
  return await parseWithLoader(loader, data, strictOptions, context);
}
async function parseWithLoader(loader, data, options, context) {
  validateWorkerVersion(loader);
  options = mergeOptions(loader.options, options);
  if (isResponse(data)) {
    const { ok, redirected, status, statusText, type, url } = data;
    const headers = Object.fromEntries(data.headers.entries());
    context.response = { headers, ok, redirected, status, statusText, type, url };
  }
  data = await getArrayBufferOrStringFromData(data, loader, options);
  const loaderWithParser = loader;
  if (loaderWithParser.parseTextSync && typeof data === "string") {
    return loaderWithParser.parseTextSync(data, options, context);
  }
  if (canParseWithWorker(loader, options)) {
    return await parseWithWorker(loader, data, options, context, parse);
  }
  if (loaderWithParser.parseText && typeof data === "string") {
    return await loaderWithParser.parseText(data, options, context);
  }
  if (loaderWithParser.parse) {
    return await loaderWithParser.parse(data, options, context);
  }
  assert3(!loaderWithParser.parseSync);
  throw new Error(`${loader.id} loader - no parser found and worker is disabled`);
}

// node_modules/@loaders.gl/schema-utils/dist/lib/schema/data-type.js
function getDataTypeFromTypedArray(array) {
  switch (array.constructor) {
    case Int8Array:
      return "int8";
    case Uint8Array:
    case Uint8ClampedArray:
      return "uint8";
    case Int16Array:
      return "int16";
    case Uint16Array:
      return "uint16";
    case Int32Array:
      return "int32";
    case Uint32Array:
      return "uint32";
    case Float32Array:
      return "float32";
    case Float64Array:
      return "float64";
    default:
      return "null";
  }
}

// node_modules/@loaders.gl/schema-utils/dist/lib/mesh/mesh-utils.js
function getMeshBoundingBox(attributes) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  const positions = attributes.POSITION ? attributes.POSITION.value : [];
  const len = positions && positions.length;
  for (let i = 0; i < len; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    minZ = z < minZ ? z : minZ;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;
    maxZ = z > maxZ ? z : maxZ;
  }
  return [
    [minX, minY, minZ],
    [maxX, maxY, maxZ]
  ];
}

// node_modules/@loaders.gl/schema-utils/dist/lib/mesh/deduce-mesh-schema.js
function deduceMeshSchema(attributes, metadata = {}) {
  const fields = deduceMeshFields(attributes);
  return { fields, metadata };
}
function deduceMeshField(name, attribute, optionalMetadata) {
  const type = getDataTypeFromTypedArray(attribute.value);
  const metadata = optionalMetadata ? optionalMetadata : makeMeshAttributeMetadata(attribute);
  return {
    name,
    type: { type: "fixed-size-list", listSize: attribute.size, children: [{ name: "value", type }] },
    nullable: false,
    metadata
  };
}
function deduceMeshFields(attributes) {
  const fields = [];
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    fields.push(deduceMeshField(attributeName, attribute));
  }
  return fields;
}
function makeMeshAttributeMetadata(attribute) {
  const result = {};
  if ("byteOffset" in attribute) {
    result.byteOffset = attribute.byteOffset.toString(10);
  }
  if ("byteStride" in attribute) {
    result.byteStride = attribute.byteStride.toString(10);
  }
  if ("normalized" in attribute) {
    result.normalized = attribute.normalized.toString();
  }
  return result;
}

// node_modules/@loaders.gl/las/dist/las-format.js
var LASFormat = {
  name: "LAS",
  id: "las",
  module: "las",
  extensions: ["las", "laz"],
  // LAZ is the "compressed" flavor of LAS,
  mimeTypes: ["application/octet-stream"],
  // TODO - text version?
  text: false,
  binary: true,
  tests: ["LASF"]
};

// node_modules/@loaders.gl/las/dist/las-loader.js
var VERSION4 = true ? "4.5.4" : "latest";
var LASWorkerLoader = {
  ...LASFormat,
  dataType: null,
  batchType: null,
  version: VERSION4,
  worker: true,
  options: {
    las: {
      shape: "mesh",
      fp64: false,
      skip: 1,
      colorDepth: 8
    }
  }
};

// node_modules/@loaders.gl/las/dist/lib/get-las-schema.js
function getLASSchema(lasHeader, attributes) {
  const metadataMap = makeMetadataFromLasHeader(lasHeader);
  const schema = deduceMeshSchema(attributes, metadataMap);
  return schema;
}
function makeMetadataFromLasHeader(lasHeader) {
  const metadata = {};
  metadata.las_pointsOffset = lasHeader.pointsOffset.toString(10);
  metadata.las_pointsFormatId = lasHeader.pointsFormatId.toString(10);
  metadata.las_pointsStructSize = lasHeader.pointsStructSize.toString(10);
  metadata.las_pointsCount = lasHeader.pointsCount.toString(10);
  metadata.las_scale = JSON.stringify(lasHeader.scale);
  metadata.las_offset = JSON.stringify(lasHeader.offset);
  if (lasHeader.maxs !== void 0) {
    metadata.las_maxs = JSON.stringify(lasHeader.maxs);
  }
  if (lasHeader.mins !== void 0) {
    metadata.las_mins = JSON.stringify(lasHeader.mins);
  }
  metadata.las_totalToRead = lasHeader.totalToRead.toString(10);
  metadata.las_pointsFortotalReadmatId = lasHeader.totalRead.toString(10);
  if (lasHeader.versionAsString !== void 0) {
    metadata.las_versionAsString = lasHeader.versionAsString;
  }
  if (lasHeader.isCompressed !== void 0) {
    metadata.las_isCompressed = lasHeader.isCompressed.toString();
  }
  return metadata;
}

// node_modules/@loaders.gl/las/dist/libs/laz-rs-wasm/laz_rs_wasm.js
var wasm;
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
var cachedTextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
if (typeof TextDecoder !== "undefined") {
  cachedTextDecoder.decode();
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance.ptr;
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_export_0.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
var WASM_VECTOR_LEN = 0;
function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
var cachedTextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : { encode: () => {
  throw Error("TextEncoder not available");
} };
var encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
  return cachedTextEncoder.encodeInto(arg, view);
} : function(arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127)
      break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}
var WasmLasZipDecompressorFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_wasmlaszipdecompressor_free(ptr >>> 0, 1));
var WasmLasZipDecompressor = class {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    WasmLasZipDecompressorFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_wasmlaszipdecompressor_free(ptr, 0);
  }
  /**
   * @returns {WasmQuickHeader}
   */
  get header() {
    const ret = wasm.__wbg_get_wasmlaszipdecompressor_header(this.__wbg_ptr);
    return WasmQuickHeader.__wrap(ret);
  }
  /**
   * @param {WasmQuickHeader} arg0
   */
  set header(arg0) {
    _assertClass(arg0, WasmQuickHeader);
    var ptr0 = arg0.__destroy_into_raw();
    wasm.__wbg_set_wasmlaszipdecompressor_header(this.__wbg_ptr, ptr0);
  }
  /**
   * @param {Uint8Array} buf
   */
  constructor(buf) {
    const ret = wasm.wasmlaszipdecompressor_new(buf);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    this.__wbg_ptr = ret[0] >>> 0;
    WasmLasZipDecompressorFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
   * @param {Uint8Array} out
   */
  decompress_many(out) {
    var ptr0 = passArray8ToWasm0(out, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.wasmlaszipdecompressor_decompress_many(this.__wbg_ptr, ptr0, len0, out);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
};
var WasmQuickHeaderFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_wasmquickheader_free(ptr >>> 0, 1));
var WasmQuickHeader = class _WasmQuickHeader {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_WasmQuickHeader.prototype);
    obj.__wbg_ptr = ptr;
    WasmQuickHeaderFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    WasmQuickHeaderFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_wasmquickheader_free(ptr, 0);
  }
  /**
   * @returns {number}
   */
  get major() {
    const ret = wasm.__wbg_get_wasmquickheader_major(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set major(arg0) {
    wasm.__wbg_set_wasmquickheader_major(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get minor() {
    const ret = wasm.__wbg_get_wasmquickheader_minor(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set minor(arg0) {
    wasm.__wbg_set_wasmquickheader_minor(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get offset_to_points() {
    const ret = wasm.__wbg_get_wasmquickheader_offset_to_points(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set offset_to_points(arg0) {
    wasm.__wbg_set_wasmquickheader_offset_to_points(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get num_vlrs() {
    const ret = wasm.__wbg_get_wasmquickheader_num_vlrs(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @param {number} arg0
   */
  set num_vlrs(arg0) {
    wasm.__wbg_set_wasmquickheader_num_vlrs(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get point_format_id() {
    const ret = wasm.__wbg_get_wasmquickheader_point_format_id(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set point_format_id(arg0) {
    wasm.__wbg_set_wasmquickheader_point_format_id(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get point_size() {
    const ret = wasm.__wbg_get_wasmquickheader_point_size(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set point_size(arg0) {
    wasm.__wbg_set_wasmquickheader_point_size(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {bigint}
   */
  get num_points() {
    const ret = wasm.__wbg_get_wasmquickheader_num_points(this.__wbg_ptr);
    return BigInt.asUintN(64, ret);
  }
  /**
   * @param {bigint} arg0
   */
  set num_points(arg0) {
    wasm.__wbg_set_wasmquickheader_num_points(this.__wbg_ptr, arg0);
  }
  /**
   * @returns {number}
   */
  get header_size() {
    const ret = wasm.__wbg_get_wasmquickheader_header_size(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {number} arg0
   */
  set header_size(arg0) {
    wasm.__wbg_set_wasmquickheader_header_size(this.__wbg_ptr, arg0);
  }
};
async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get("Content-Type") != "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}
function __wbg_get_imports() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbindgen_copy_to_typed_array = function(arg0, arg1, arg2) {
    new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
  };
  imports.wbg.__wbg_buffer_ccaed51a635d8a2d = function(arg0) {
    const ret = arg0.buffer;
    return ret;
  };
  imports.wbg.__wbg_new_fec2611eb9180f95 = function(arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
  };
  imports.wbg.__wbg_set_ec2fcf81bc573fd9 = function(arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
  };
  imports.wbg.__wbg_length_9254c4bd3b9f23c4 = function(arg0) {
    const ret = arg0.length;
    return ret;
  };
  imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
    const ret = new Error();
    return ret;
  };
  imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
      deferred0_0 = arg0;
      deferred0_1 = arg1;
      console.error(getStringFromWasm0(arg0, arg1));
    } finally {
      wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
  };
  imports.wbg.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };
  imports.wbg.__wbindgen_memory = function() {
    const ret = wasm.memory;
    return ret;
  };
  imports.wbg.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_export_0;
    const offset = table.grow(4);
    table.set(0, void 0);
    table.set(offset + 0, void 0);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
  };
  return imports;
}
function __wbg_init_memory(imports, memory) {
}
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  __wbg_init.__wbindgen_wasm_module = module;
  cachedDataViewMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
async function __wbg_init(module_or_path) {
  if (wasm !== void 0)
    return wasm;
  if (typeof module_or_path !== "undefined") {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn("using deprecated parameters for the initialization function; pass a single object instead");
    }
  }
  if (typeof module_or_path === "undefined") {
    module_or_path = new URL("laz_rs_wasm_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();
  if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) {
    module_or_path = fetch(module_or_path);
  }
  __wbg_init_memory(imports);
  const { instance, module } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module);
}
var laz_rs_wasm_default = __wbg_init;

// node_modules/@loaders.gl/las/dist/lib/laz-rs-wasm/laslaz-decoder.js
var POINT_FORMAT_READERS = {
  0: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15)
    };
  },
  1: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15)
    };
  },
  2: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15),
      color: [dv.getUint16(20, true), dv.getUint16(22, true), dv.getUint16(24, true)]
    };
  },
  3: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15),
      color: [dv.getUint16(28, true), dv.getUint16(30, true), dv.getUint16(32, true)]
    };
  },
  4: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15)
    };
  },
  5: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(15),
      color: [dv.getUint16(28, true), dv.getUint16(30, true), dv.getUint16(32, true)]
    };
  },
  6: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(16)
    };
  },
  7: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(16),
      color: [dv.getUint16(30, true), dv.getUint16(32, true), dv.getUint16(34, true)]
    };
  },
  8: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(16),
      color: [dv.getUint16(30, true), dv.getUint16(32, true), dv.getUint16(34, true)]
    };
  },
  9: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(16)
    };
  },
  10: (dv) => {
    return {
      position: [dv.getInt32(0, true), dv.getInt32(4, true), dv.getInt32(8, true)],
      intensity: dv.getUint16(12, true),
      classification: dv.getUint8(16),
      color: [dv.getUint16(30, true), dv.getUint16(32, true), dv.getUint16(34, true)]
    };
  }
};
function readAs(buf, Type = {}, offset, count) {
  count = count === void 0 || count === 0 ? 1 : count;
  const sub = buf.slice(offset, offset + Type.BYTES_PER_ELEMENT * count);
  const r = new Type(sub);
  if (count === 1) {
    return r[0];
  }
  const ret = [];
  for (let i = 0; i < count; i++) {
    ret.push(r[i]);
  }
  return ret;
}
function parseLASHeader(arraybuffer) {
  const ver = new Uint8Array(arraybuffer, 24, 2);
  const version2 = ver[0] * 10 + ver[1];
  const versionAsString = `${ver[0]}.${ver[1]}`;
  const rawPointsFormatId = readAs(arraybuffer, Uint8Array, 32 * 3 + 8);
  const bit7 = (rawPointsFormatId & 128) >> 7;
  const bit6 = (rawPointsFormatId & 64) >> 6;
  const isCompressed = bit7 === 1 || bit6 === 1;
  const pointsFormatId = rawPointsFormatId & 63;
  const o = {
    pointsOffset: readAs(arraybuffer, Uint32Array, 32 * 3),
    pointsFormatId,
    pointsStructSize: readAs(arraybuffer, Uint16Array, 32 * 3 + 8 + 1),
    pointsCount: readAs(arraybuffer, Uint32Array, 32 * 3 + 11),
    versionAsString,
    isCompressed
  };
  let start = 32 * 3 + 35;
  o.scale = readAs(arraybuffer, Float64Array, start, 3);
  start += 24;
  o.offset = readAs(arraybuffer, Float64Array, start, 3);
  start += 24;
  const bounds = readAs(arraybuffer, Float64Array, start, 6);
  start += 48;
  o.maxs = [bounds[0], bounds[2], bounds[4]];
  o.mins = [bounds[1], bounds[3], bounds[5]];
  start += 20;
  if (version2 === 14) {
    o.pointsCount = Number(readAs(arraybuffer, BigUint64Array, start));
  }
  const colorPointFormats = /* @__PURE__ */ new Set([2, 3, 5, 7, 8, 10]);
  o.hasColor = colorPointFormats.has(pointsFormatId);
  return o;
}
var LASLoader = class {
  arraybuffer;
  readOffset = 0;
  header = null;
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;
  }
  /**
   * @returns boolean
   */
  open() {
    return true;
  }
  /**
   * Parsing of incoming binary
   * @returns LASHeader
   */
  getHeader() {
    this.header = parseLASHeader(this.arraybuffer);
    return this.header;
  }
  /**
   * Reading data
   * @param count
   * @param skip
   * @returns LasData
   */
  readData(count, skip) {
    const { header, arraybuffer } = this;
    if (!header) {
      throw new Error("Cannot start reading data till a header request is issued");
    }
    let { readOffset } = this;
    let start;
    if (skip <= 1) {
      count = Math.min(count, header.pointsCount - readOffset);
      start = header.pointsOffset + readOffset * header.pointsStructSize;
      const end = start + count * header.pointsStructSize;
      readOffset += count;
      this.readOffset = readOffset;
      return {
        buffer: arraybuffer.slice(start, end),
        count,
        hasMoreData: readOffset < header.pointsCount
      };
    }
    const pointsToRead = Math.min(count * skip, header.pointsCount - readOffset);
    const bufferSize = Math.ceil(pointsToRead / skip);
    let pointsRead = 0;
    const buf = new Uint8Array(bufferSize * header.pointsStructSize);
    for (let i = 0; i < pointsToRead; i++) {
      if (i % skip === 0) {
        start = header.pointsOffset + readOffset * header.pointsStructSize;
        const src = new Uint8Array(arraybuffer, start, header.pointsStructSize);
        buf.set(src, pointsRead * header.pointsStructSize);
        pointsRead++;
      }
      readOffset++;
    }
    this.readOffset = readOffset;
    return {
      buffer: buf.buffer,
      count: pointsRead,
      hasMoreData: readOffset < header.pointsCount
    };
  }
  /**
   * Method which brings data to null to close the file
   * @returns
   */
  close() {
    this.arraybuffer = null;
    return true;
  }
};
var LAZLoader = class {
  arraybuffer;
  readOffset = 0;
  instance = null;
  header = null;
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;
  }
  /**
   * Opens the file
   * @returns boolean
   */
  open() {
    try {
      const abInt = new Uint8Array(this.arraybuffer);
      this.instance = new WasmLasZipDecompressor(abInt);
      return true;
    } catch (error) {
      throw new Error(`Failed to open file: ${error.message}`);
    }
  }
  getHeader() {
    try {
      this.header = parseLASHeader(this.arraybuffer);
      return this.header;
    } catch (error) {
      throw new Error(`Failed to get header: ${error.message}`);
    }
  }
  /**
   * @param count
   * @param offset
   * @param skip
   * @returns LASData
   */
  readData(count, skip) {
    if (!this.instance) {
      throw new Error("You need to open the file before trying to read stuff");
    }
    const { header, instance } = this;
    if (!header) {
      throw new Error("You need to query header before reading, I maintain state that way, sorry :(");
    }
    try {
      const pointsToRead = Math.min(count * skip, header.pointsCount - this.readOffset);
      const bufferSize = Math.ceil(pointsToRead / skip);
      let pointsRead = 0;
      const buf = new Uint8Array(bufferSize * header.pointsStructSize);
      const bufRead = new Uint8Array(header.pointsStructSize);
      for (let i = 0; i < pointsToRead; i++) {
        instance.decompress_many(bufRead);
        if (i % skip === 0) {
          buf.set(bufRead, pointsRead * header.pointsStructSize);
          pointsRead++;
        }
        this.readOffset++;
      }
      return {
        buffer: buf.buffer,
        count: pointsRead,
        hasMoreData: this.readOffset < header.pointsCount
      };
    } catch (error) {
      throw new Error(`Failed to read data: ${error.message}`);
    }
  }
  /**
   * Deletes the instance
   * @returns boolean
   */
  close() {
    try {
      if (this.instance !== null) {
        this.instance.free();
        this.instance = null;
      }
      this.arraybuffer = null;
      return true;
    } catch (error) {
      throw new Error(`Failed to close file: ${error.message}`);
    }
  }
};
var LASDecoder = class {
  arrayb;
  decoder;
  pointsCount;
  pointSize;
  constructor(buffer, len, header) {
    this.arrayb = buffer;
    this.decoder = POINT_FORMAT_READERS[header.pointsFormatId];
    this.pointsCount = len;
    this.pointSize = header.pointsStructSize;
  }
  /**
   * Decodes data depends on this point size
   * @param index
   * @returns New object
   */
  getPoint(index) {
    if (index < 0 || index >= this.pointsCount) {
      throw new Error("Point index out of range");
    }
    const dv = new DataView(this.arrayb, index * this.pointSize, this.pointSize);
    return this.decoder(dv);
  }
};
var LASFile = class {
  arraybuffer;
  formatId = 0;
  loader;
  isCompressed = true;
  isOpen = false;
  version = 0;
  versionAsString = "";
  constructor(arraybuffer) {
    this.arraybuffer = arraybuffer;
    this.validate();
    this.loader = this.isCompressed ? new LAZLoader(this.arraybuffer) : new LASLoader(this.arraybuffer);
  }
  validate() {
    const signature = readAs(this.arraybuffer, Uint8Array, 0, 4);
    const check = String.fromCharCode(...signature);
    if (check !== "LASF") {
      throw new Error("Invalid LAS file");
    }
    if (this.determineVersion() > 14) {
      throw new Error("Only file versions <= 1.4 are supported");
    }
    this.determineFormat();
    if (POINT_FORMAT_READERS[this.formatId] === void 0) {
      throw new Error("The point format ID is not supported");
    }
  }
  /**
   * Determines format in parameters of LASHeader
   */
  determineFormat() {
    const formatId = readAs(this.arraybuffer, Uint8Array, 32 * 3 + 8);
    const bit7 = (formatId & 128) >> 7;
    const bit6 = (formatId & 64) >> 6;
    if (bit7 === 1 && bit6 === 1) {
      throw new Error("Old style compression not supported");
    }
    this.formatId = formatId & 63;
    this.isCompressed = bit7 === 1 || bit6 === 1;
  }
  /**
   * Determines version
   * @returns version
   */
  determineVersion() {
    const ver = new Uint8Array(this.arraybuffer, 24, 2);
    this.version = ver[0] * 10 + ver[1];
    this.versionAsString = `${ver[0]}.${ver[1]}`;
    return this.version;
  }
  /**
   * Reads if the file is open
   * @returns boolean
   */
  open() {
    if (this.loader.open()) {
      this.isOpen = true;
    }
  }
  /**
   * Gets the header
   * @returns Header
   */
  getHeader() {
    return this.loader.getHeader();
  }
  /**
   * @param count
   * @param start
   * @param skip
   * @returns LASData
   */
  readData(count, skip) {
    return this.loader.readData(count, skip);
  }
  /**
   * Closes the file
   */
  close() {
    if (this.loader.close()) {
      this.isOpen = false;
    }
  }
  /**
   */
  getUnpacker() {
    return LASDecoder;
  }
};

// node_modules/@loaders.gl/las/dist/lib/laz-rs-wasm/parse-las.js
function parseLAS(arrayBuffer, options) {
  return parseLASMesh(arrayBuffer, options);
}
function parseLASMesh(arrayBuffer, options = {}) {
  let pointIndex = 0;
  let positions;
  let colors;
  let intensities;
  let classifications;
  let originalHeader;
  const lasMesh = {
    loader: "las",
    loaderData: {},
    // shape: 'mesh',
    schema: { fields: [], metadata: {} },
    header: {
      vertexCount: 0,
      boundingBox: [
        [0, 0, 0],
        [0, 0, 0]
      ]
    },
    attributes: {},
    topology: "point-list",
    mode: 0
    // GL.POINTS
  };
  parseLASChunked(arrayBuffer, options.las?.skip ?? 1, (decoder = {}, lasHeader) => {
    if (!originalHeader) {
      originalHeader = lasHeader;
      const total = lasHeader.totalToRead;
      const PositionsType = options.las?.fp64 ? Float64Array : Float32Array;
      positions = new PositionsType(total * 3);
      colors = lasHeader.hasColor ? new Uint8Array(total * 4) : null;
      intensities = new Uint16Array(total);
      classifications = new Uint8Array(total);
      lasMesh.loaderData = lasHeader;
      lasMesh.attributes = {
        POSITION: { value: positions, size: 3 },
        // non-gltf attributes, use non-capitalized names for now
        intensity: { value: intensities, size: 1 },
        classification: { value: classifications, size: 1 }
      };
      if (colors) {
        lasMesh.attributes.COLOR_0 = { value: colors, size: 4 };
      }
    }
    const batchSize = decoder.pointsCount;
    const { scale: [scaleX, scaleY, scaleZ], offset: [offsetX, offsetY, offsetZ] } = lasHeader;
    const twoByteColor = detectTwoByteColors(decoder, batchSize, options.las?.colorDepth);
    for (let i = 0; i < batchSize; i++) {
      const { position, color, intensity, classification } = decoder.getPoint(i);
      positions[pointIndex * 3] = position[0] * scaleX + offsetX;
      positions[pointIndex * 3 + 1] = position[1] * scaleY + offsetY;
      positions[pointIndex * 3 + 2] = position[2] * scaleZ + offsetZ;
      if (color && colors) {
        if (twoByteColor) {
          colors[pointIndex * 4] = color[0] / 256;
          colors[pointIndex * 4 + 1] = color[1] / 256;
          colors[pointIndex * 4 + 2] = color[2] / 256;
        } else {
          colors[pointIndex * 4] = color[0];
          colors[pointIndex * 4 + 1] = color[1];
          colors[pointIndex * 4 + 2] = color[2];
        }
        colors[pointIndex * 4 + 3] = 255;
      }
      intensities[pointIndex] = intensity;
      classifications[pointIndex] = classification;
      pointIndex++;
    }
    const meshBatch = {
      ...lasMesh,
      header: {
        vertexCount: lasHeader.totalRead
      },
      progress: lasHeader.totalRead / lasHeader.totalToRead
    };
    options?.onProgress?.(meshBatch);
  });
  lasMesh.header = {
    vertexCount: originalHeader.totalToRead,
    boundingBox: getMeshBoundingBox(lasMesh?.attributes || {})
  };
  if (lasMesh) {
    lasMesh.schema = getLASSchema(lasMesh.loaderData, lasMesh.attributes);
  }
  return lasMesh;
}
function parseLASChunked(rawData, skip = 1, onParseData = {}) {
  const dataHandler = new LASFile(rawData);
  try {
    dataHandler.open();
    const header = dataHandler.getHeader();
    const Unpacker = dataHandler.getUnpacker();
    const totalToRead = Math.ceil(header.pointsCount / Math.max(1, skip));
    header.totalToRead = totalToRead;
    let totalRead = 0;
    while (true) {
      const chunk = dataHandler.readData(1e3 * 100, skip);
      totalRead += chunk.count;
      header.totalRead = totalRead;
      const unpacker = new Unpacker(chunk.buffer, chunk.count, header);
      onParseData(unpacker, header);
      if (!chunk.hasMoreData || totalRead >= totalToRead) {
        break;
      }
    }
  } catch (e) {
    throw e;
  } finally {
    dataHandler.close();
  }
}
function detectTwoByteColors(decoder = {}, batchSize, colorDepth) {
  let twoByteColor = false;
  switch (colorDepth) {
    case 8:
      twoByteColor = false;
      break;
    case 16:
      twoByteColor = true;
      break;
    case "auto":
      if (decoder.getPoint(0).color) {
        for (let i = 0; i < batchSize; i++) {
          const { color } = decoder.getPoint(i);
          if (color[0] > 255 || color[1] > 255 || color[2] > 255) {
            twoByteColor = true;
          }
        }
      }
      break;
    default:
      console.warn("las: illegal value for options.las.colorDepth");
      break;
  }
  return twoByteColor;
}

// node_modules/@loaders.gl/las/dist/laz-rs-loader.js
var LAZRsLoader = {
  ...LASWorkerLoader,
  // The bundled LAS worker imports the laz-perf implementation. Keep the
  // laz-rs variant on the main thread until it has a dedicated worker bundle.
  worker: false,
  parse: async (arrayBuffer, options) => {
    await laz_rs_wasm_default();
    return parseLAS(arrayBuffer, { ...options });
  }
};

// scripts/lidar-loader-entry.js
function parseLidarFile(arrayBuffer, options) {
  return parse(arrayBuffer, LAZRsLoader, options);
}
export {
  parseLidarFile
};
