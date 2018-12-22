const privates = new Set();
Symbol.private = function(desc) {
    const sym = Symbol(desc);
    privates.add(sym);
    return sym;
};
Object.defineProperty(Symbol.prototype, 'private', {
    configurable: true,
    get() {
        return privates.has(this.valueOf());
    },
});

