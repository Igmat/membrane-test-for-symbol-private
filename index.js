const { newProxy } = require('./new-proxy');

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

class Side {
    /**
     * @param {Side} [otherSide]
     */
    constructor(otherSide) {
        this.originalsToProxies = new WeakMap();
        this.proxiesToOriginals = new WeakMap();
        /**
         * `privateHandlers` are special objects dedicated to keep invariants built
         * on top of exposing private symbols via public API
         * we also need one-to-one relation between `privateHandler` and `original`
         */
        this.privateHandlersOriginals = new WeakMap();
        /**
         * we're keep track of created handlers, so we'll be able to adjust them with
         * newly exposed private symbols
         */
        this.allHandlers = new Set();
        this.exposedSymbols = new Set();
        this.otherSide = otherSide || new Side(this);

        this.wrap = this.wrap.bind(this);
        this.unwrap = this.unwrap.bind(this);
        this.handlePrivate = this.handlePrivate.bind(this);
        this.addPrivateHandler = this.addSymbolToPrivateHandler.bind(this);
    }
    /**
     * @param {any} original
     * @returns {any}
     */
    wrap(original) {
        // we don't need to wrap any primitive values
        if (isPrimitive(original)) return original;
        // we also don't need to create additional wrappers if one already exists
        if (this.originalsToProxies.has(original)) return this.originalsToProxies.get(original);
        // we also don't need to wrap already wrapped values **actually this check hasn't been hit during tests, but lets keep it for safety**
        if (this.proxiesToOriginals.has(original)) return original;
        // we also don't need to wrap outer proxies, since those objects don't belong to our graph
        // so we return originals of outer object in order to not break outer invariants
        if (this.otherSide.proxiesToOriginals.has(original)) return this.otherSide.proxiesToOriginals.get(original);

        const privateHandlerProto = typeof original === 'function'
            ? () => { }
            : {};
        const privateHandler = typeof original === 'function'
            ? () => { }
            : {};
        Object.setPrototypeOf(privateHandler, privateHandlerProto);

        this.privateHandlersOriginals.set(privateHandler, original);
        this.allHandlers.add(privateHandler);
        this.exposedSymbols.forEach(symbol => this.addSymbolToPrivateHandler(privateHandler, symbol));
        this.otherSide.exposedSymbols.forEach(symbol => this.addSymbolToPrivateHandler(privateHandler, symbol));

        const { handlePrivate, wrap, unwrap, exposedSymbols, otherSide } = this;

        // we use `newProxy` instead of `new Proxy` to emulate behavior of `Symbol.private`
        //       note that we don't use `original` here as proxy target
        //                     ↓↓↓↓↓↓↓↓↓↓↓↓↓↓
        const proxy = newProxy(privateHandler, {
            apply(target, thisArg, argArray) {
                thisArg = unwrap(thisArg);
                for (let i = 0; i < argArray.length; i++) {
                    if (!isPrimitive(argArray[i])) {
                        argArray[i] = unwrap(argArray[i]);
                    }
                }

                //          but we use `original` here instead of `target`
                //                           ↓↓↓↓↓↓↓↓
                const retval = Reflect.apply(original, thisArg, argArray);

                // in case when private symbols is exposed via some part of public API
                // we have to add such symbol to all possible targets where it could appear
                if (typeof retval === 'symbol' && !!retval.private) {
                    handlePrivate(retval);
                    otherSide.handlePrivate(retval);
                    exposedSymbols.add(retval);
                }

                return wrap(retval);
            },
            get(target, p, receiver) {
                receiver = unwrap(receiver);
                //       but we use `original` here instead of `target`
                //                         ↓↓↓↓↓↓↓↓
                const retval = Reflect.get(original, p, receiver);

                // in case when private symbols is exposed via some part of public API
                // we have to add such symbol to all possible targets where it could appear
                if (typeof retval === 'symbol' && !!retval.private) {
                    handlePrivate(retval);
                    otherSide.handlePrivate(retval);
                    exposedSymbols.add(retval);
                }

                return wrap(retval);
            },
            set(target, p, value, receiver) {
                value = unwrap(value);
                receiver = unwrap(receiver);

                // but we use `original` here instead of `target`
                //                 ↓↓↓↓↓↓↓↓
                return Reflect.set(original, p, value, receiver);
            },

            // following methods also should be implemented,
            // but it they are skipped for simplicity
            getPrototypeOf(target) {
                const retval = Reflect.getPrototypeOf(original);

                return wrap(retval);
            },
            setPrototypeOf(target, v) {
                v = unwrap(v);

                return Reflect.setPrototypeOf(original, v);
            },
            isExtensible(target) {
                return Reflect.isExtensible(original);
            },
            preventExtensions(target) {
                return Reflect.isExtensible(original);
            },
            getOwnPropertyDescriptor(target, p) {
                const retval = Reflect.getOwnPropertyDescriptor(original, p);

                return wrap(retval);
            },
            has(target, p) {
                return Reflect.has(original, p);
            },
            deleteProperty(target, p) {
                return Reflect.deleteProperty(original, p);
            },
            defineProperty(target, p, attributes) {
                attributes = unwrap(attributes);

                return Reflect.defineProperty(original, p, attributes);
            },
            ownKeys(target) {
                return Reflect.ownKeys(original);
            },
            construct(target, argArray, newTarget) {
                newTarget = unwrap(newTarget);
                for (let i = 0; i < argArray.length; i++) {
                    if (!isPrimitive(argArray[i])) {
                        argArray[i] = unwrap(argArray[i]);
                    }
                }

                //               but we use `original` here instead of `target`
                //                               ↓↓↓↓↓↓↓↓
                const retval = Reflect.construct(original, argArray, newTarget);

                // in case when private symbols is exposed via some part of public API
                // we have to add such symbol to all possible targets where it could appear
                if (typeof retval === 'symbol' && !!retval.private) {
                    handlePrivate(retval);
                    otherSide.handlePrivate(retval);
                    exposedSymbols.add(retval);
                }

                return wrap(retval);
            },
        });

        this.originalsToProxies.set(original, proxy);
        this.proxiesToOriginals.set(proxy, original);

        return proxy;
    }
    /**
     * @param {any} obj
     * @returns {any}
     */
    unwrap(obj) {
        if (this.proxiesToOriginals.has(obj)) {
            return this.proxiesToOriginals.get(obj);
        }
        return this.otherSide.wrap(obj);
    }

    /**
     * @param {symbol} privateSymbol
     */
    handlePrivate(privateSymbol) {
        this.allHandlers.forEach(handler => this.addSymbolToPrivateHandler(handler, privateSymbol));
    }

    /**
     * just simple helper that creates getter/setter pair for specific
     * private symbol and object that gets through membrane
     * @param {object | Function} handler
     * @param {symbol} privateSymbol
     */
    addSymbolToPrivateHandler(handler, privateSymbol) {
        const original = this.privateHandlersOriginals.get(handler);
        const handlerProto = Object.getPrototypeOf(handler);
        const { wrap, unwrap } = this;
        const propertyHandler = {
            get() {
                return wrap(original[privateSymbol]);
            },
            set(v) {
                original[privateSymbol] = unwrap(v);
            }
        };
        if (Object.hasOwnProperty.call(original, privateSymbol)) {
            const descriptor = Reflect.getOwnPropertyDescriptor(handler, privateSymbol);
            if (descriptor && !descriptor.configurable) return;

            Object.defineProperty(handler, privateSymbol, propertyHandler);

            return;
        }
        if (Object.hasOwnProperty.call(handler, privateSymbol)) {
            const descriptor = Reflect.getOwnPropertyDescriptor(handler, privateSymbol);
            if (!descriptor.configurable) return;

            original[privateSymbol] = this.unwrap(handler[privateSymbol]);

            Object.defineProperty(handler, privateSymbol, propertyHandler);

            return;
        }
        if (Object.hasOwnProperty.call(handlerProto, privateSymbol)) return;
        Object.defineProperty(handlerProto, privateSymbol, {
            get: propertyHandler.get,
            set(v) {
                Object.defineProperty(handler, privateSymbol, propertyHandler);

                propertyHandler.set(v);
            }
        });
    }
}
/**
 * @param {any} graph
 */
function membrane(graph) {
    const leftSide = new Side();

    return leftSide.wrap(graph);
}

exports.membrane = membrane;
