/**
 * @param {any} obj
 * @param {ProxyHandler} handler
 * @param {Set<symbol>} whitelist
 */
function TransparentProxy(obj, handler, whitelist) {
  function isPrivateSymbol(sym) {
    return typeof sym === 'symbol' && !!sym.private;
  }

  function trap(handler, name) {
    return function(target, key, ...args) {
      if (isPrivateSymbol(key) && !whitelist.has(key)) {
        return Reflect[name](target, key, ...args);
      }

      const trap = handler[name];
      if (trap) {
        return trap.call(handler, target, key, ...args);
      }

      return Reflect[name](target, key, ...args);
    };
  }

  return new Proxy(obj, {
    ...handler,
    get: trap(handler, 'get'),
    getOwnPropertyDescriptor: trap(handler, 'getOwnPropertyDescriptor'),
    has: trap(handler, 'has'),
    set: trap(handler, 'set'),
    deleteProperty: trap(handler, 'deleteProperty'),
    defineProperty: trap(handler, 'defineProperty'),
  });
}

exports.TransparentProxy = TransparentProxy;
