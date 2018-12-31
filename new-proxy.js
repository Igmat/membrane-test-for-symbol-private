/**
 * @param {any} obj
 * @param {ProxyHandler} handler
 */
function newProxy(obj, handler) {
    /**
     * @param {symbol} sym
     */
    function isPrivate(sym) {
        return typeof sym === 'symbol' && !!sym.private;
    }

    return new Proxy(obj, {
        ...handler,
        get(target, p, receiver) {
            if (!isPrivate(p) && handler.get) return handler.get(target, p, receiver);

            return Reflect.get(target, p, receiver);
        },
        getOwnPropertyDescriptor(target, p) {
            if (!isPrivate(p) && handler.getOwnPropertyDescriptor) return handler.getOwnPropertyDescriptor(target, p);

            return Reflect.getOwnPropertyDescriptor(target, p);
        },
        has(target, p) {
            if (!isPrivate(p) && handler.has) return handler.has(target, p);

            return Reflect.has(target, p);

        },
        set(target, p, value, receiver) {
            if (!isPrivate(p) && handler.set) return handler.set(target, p, value, receiver);

            return Reflect.set(target, p, value, receiver);

        },
        deleteProperty(target, p) {
            if (!isPrivate(p) && handler.deleteProperty) return handler.deleteProperty(target, p);

            return Reflect.deleteProperty(target, p);
        },
        defineProperty(target, p, attributes) {
            if (!isPrivate(p) && handler.defineProperty) return handler.defineProperty(target, p, attributes);

            return Reflect.defineProperty(target, p, attributes);
        },
    });
}

exports.newProxy = newProxy;
