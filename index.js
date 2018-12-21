const { TransparentProxy } = require('./transparent-proxy');

/**
 * @param {any} obj
 */
function isPrimitive(obj) {
  return obj === undefined
    || obj === null
    || typeof obj === 'boolean'
    || typeof obj === 'number'
    || typeof obj === 'string'
    || typeof obj === 'symbol'; // for simplicity let's treat symbols as primitives
}

/**
 */
function createWrapFn() {
  const originalsToProxies = new WeakMap();
  const proxiesToOriginals = new WeakMap();
  /**
   * Whitelist holds the known private symbols that have been exposed to the
   * membrane.
   */
  const whitelist = new Set();

  /**
   * We also need a mapping from the original object to its shadow target, so
   * we can copy the transparently-placed data to the original.
   */
  const originalToTargets = new WeakMap();

  /**
   * @param {proxy} proxy
   * @param {Set<any>} originals
   * @param {Set<any>} proxies
   */
  function unwrap(proxy, originals, proxies) {
    if (proxiesToOriginals.has(proxy)) {
      return proxiesToOriginals.get(proxy);
    }
    return wrap(proxy, proxies, originals);
  }

  /**
   * @param {symbol} privateSymbol
   * @param {Set<any>} originals
   * @param {Set<any>} proxies
   */
  function handlePrivates(privateSymbol, originals, proxies) {
    if (whitelist.has(privateSymbol)) {
      return;
    }
    whitelist.add(privateSymbol);
    proxies.forEach(original => {
      const target = originalToTargets.get(original);
      if (!target.hasOwnProperty(privateSymbol)) {
        return;
      }
      original[privateSymbol] = wrap(target[privateSymbol], originals, proxies);
    });
  }

  /**
   * @param {object | Function} original
   * @param {Set<any>} originals
   * @param {Set<any>} proxies
   */
  function wrap(original, originals, proxies) {
    // we don't need to wrap any primitive values
    if (isPrimitive(original)) return original;
    // we also don't need to wrap already wrapped values
    if (originalsToProxies.has(original)) return originalsToProxies.get(original);
    // if it's a proxied value, that means we're unwrapping it
    if (proxiesToOriginals.has(original)) return proxiesToOriginals.get(original);
    const shadowTarget = typeof original === 'function'
      ? () => { }
      : {};

    const proxy = new TransparentProxy(shadowTarget, {
      apply(target, thisArg, argArray) {
        thisArg = unwrap(thisArg, originals, proxies);
        for (let i = 0; i < argArray.length; i++) {
          if (!isPrimitive(argArray[i])) {
            argArray[i] = unwrap(argArray[i], originals, proxies);
          }
        }
        const retval = Reflect.apply(original, thisArg, argArray);

        if (typeof retval === 'symbol' && retval.private) {
          handlePrivates(retval, originals, proxies);
        }

        return unwrap(retval, originals, proxies);
      },
      get(target, p, receiver) {
        receiver = unwrap(receiver, originals, proxies);
        const retval = Reflect.get(original, p, receiver);

        if (typeof retval === 'symbol' && retval.private) {
          handlePrivates(retval, originals, proxies);
        }

        return unwrap(retval, originals, proxies);
      },
      set(target, p, value, receiver) {
        value = unwrap(value, originals, proxies);
        receiver = unwrap(receiver, originals, proxies);
        return Reflect.set(original, p, value, receiver);
      },
    }, whitelist);

    originals.add(original);
    originalToTargets.set(original, shadowTarget);
    originalsToProxies.set(original, proxy);
    proxiesToOriginals.set(proxy, original);

    return proxy;
  }

  return wrap;
}

/**
 * @param {any} graph
 */
function Membrane(graph) {
  const wrap = createWrapFn();
  return wrap(graph, new Set(), new Set());
}

exports.Membrane = Membrane;
