/**
 * Node.js Polyfills for Web Environment
 * Provides compatibility for Node.js modules in browser/web environments
 */

// Polyfill for process object
if (typeof global !== 'undefined' && !global.process) {
  global.process = require('process/browser');
}

// Ensure process.stdout exists with isTTY property
if (typeof process !== 'undefined') {
  if (!process.stdout) {
    process.stdout = {
      isTTY: false,
      write: () => {},
      end: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      removeListener: () => {},
      removeAllListeners: () => {},
      setMaxListeners: () => {},
      getMaxListeners: () => 0,
      listeners: () => [],
      rawListeners: () => [],
      listenerCount: () => 0,
      prependListener: () => {},
      prependOnceListener: () => {},
      eventNames: () => [],
    };
  } else if (typeof process.stdout.isTTY === 'undefined') {
    process.stdout.isTTY = false;
  }

  // Ensure process.stderr exists
  if (!process.stderr) {
    process.stderr = {
      isTTY: false,
      write: () => {},
      end: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      removeListener: () => {},
      removeAllListeners: () => {},
      setMaxListeners: () => {},
      getMaxListeners: () => 0,
      listeners: () => [],
      rawListeners: () => [],
      listenerCount: () => 0,
      prependListener: () => {},
      prependOnceListener: () => {},
      eventNames: () => [],
    };
  } else if (typeof process.stderr.isTTY === 'undefined') {
    process.stderr.isTTY = false;
  }

  // Ensure process.stdin exists
  if (!process.stdin) {
    process.stdin = {
      isTTY: false,
      readable: true,
      read: () => null,
      setEncoding: () => {},
      pause: () => {},
      resume: () => {},
      isPaused: () => false,
      pipe: () => {},
      unpipe: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      removeListener: () => {},
      removeAllListeners: () => {},
      setMaxListeners: () => {},
      getMaxListeners: () => 0,
      listeners: () => [],
      rawListeners: () => [],
      listenerCount: () => 0,
      prependListener: () => {},
      prependOnceListener: () => {},
      eventNames: () => [],
    };
  } else if (typeof process.stdin.isTTY === 'undefined') {
    process.stdin.isTTY = false;
  }

  // Ensure other process properties exist
  if (typeof process.platform === 'undefined') {
    process.platform = 'browser';
  }

  if (typeof process.arch === 'undefined') {
    process.arch = 'javascript';
  }

  if (typeof process.version === 'undefined') {
    process.version = 'v16.0.0';
  }

  if (typeof process.versions === 'undefined') {
    process.versions = {
      node: '16.0.0',
      v8: '9.0.0',
      uv: '1.0.0',
      zlib: '1.0.0',
      brotli: '1.0.0',
      ares: '1.0.0',
      modules: '93',
      nghttp2: '1.0.0',
      napi: '8',
      llhttp: '6.0.0',
      openssl: '1.1.1',
      cldr: '39.0',
      icu: '69.1',
      tz: '2021a',
      unicode: '13.0'
    };
  }

  // Polyfill process methods
  if (typeof process.nextTick === 'undefined') {
    process.nextTick = (callback, ...args) => {
      setTimeout(() => callback(...args), 0);
    };
  }

  if (typeof process.exit === 'undefined') {
    process.exit = (code) => {
      console.warn('process.exit() called in browser environment with code:', code);
    };
  }

  if (typeof process.cwd === 'undefined') {
    process.cwd = () => '/';
  }

  if (typeof process.chdir === 'undefined') {
    process.chdir = (directory) => {
      console.warn('process.chdir() called in browser environment:', directory);
    };
  }
}

// Polyfill for Buffer if not available
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = require('buffer').Buffer;
}

// Polyfill for global if not available
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    process: typeof process !== 'undefined' ? process : {},
    Buffer: typeof Buffer !== 'undefined' ? Buffer : {},
  };
}

console.log('✅ Node.js polyfills loaded for web environment');
