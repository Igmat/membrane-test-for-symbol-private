const { membrane } = require('..');
const assert = require('assert');
require('./__polyfill');

global.describe = function (name, cb) {
    console.group(name);
    cb();
    console.groupEnd(name);
}
global.it = function (name, cb) {
    try {
        cb();
        console.log('\x1b[32m', '\u2713', name, '\x1b[0m');
    } catch (e) {
        debugger;
        console.log('\x1b[31m', '\u2718', name, '\x1b[0m');
        console.group('');
        console.log(e.stack);
        console.groupEnd('');
    }
}

function setup(leftField, rightField) {
    const Left = {
        base: {},
        someObject: {},
        field: leftField,
        value: { fromTheLeft: true },

        get(obj) {
            return obj[leftField];
        },
        set(obj, value) {
            obj[leftField] = value;
        },
        has(obj) {
            return Reflect.has(obj, leftField);
        },
        hasOwn(obj) {
            return obj.hasOwnProperty(leftField);
        },
        hasIn(obj) {
            return leftField in obj;
        }
    };

    const Right = {
        base: {},
        someObject: {},
        field: rightField,
        value: { fromTheRight: true },

        get(obj) {
            return obj[rightField];
        },
        set(obj, value) {
            obj[rightField] = value;
        },
        has(obj) {
            return Reflect.has(obj, rightField);
        },
        hasOwn(obj) {
            return obj.hasOwnProperty(rightField);
        },
        hasIn(obj) {
            return rightField in obj;
        }
    }

    const graph = {};
    const wrappedGraph = membrane(graph);
    graph.Left = Left;
    wrappedGraph.Right = Right;

    const wrappedLeftSide = wrappedGraph.Left;
    const wrappedRightSide = graph.Right;

    return {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    };
}

exports.stringFields = function () {
    return setup('leftField', 'rightField');
}

exports.symbolFields = function () {
    return setup(Symbol('leftField'), Symbol('rightField'));
}

exports.privateSymbolFields = function () {
    return setup(Symbol.private('leftField'), Symbol.private('rightField'));
}

exports.preExposedPrivateSymbolFields = function () {
    const membrane = setup(Symbol.private('leftField'), Symbol.private('rightField'));
    // Expose the fields before the tests.
    membrane.wrappedLeftSide.field;
    membrane.wrappedRightSide.field;
    return membrane;
}

exports.suite = function (setup, set, get, existenceChecks) {
    it('bT[fT] = vT;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(Left, Left.base, Left.value);

        const got = get(wrappedLeftSide, wrappedLeftSide.base);

        // Test that it's wrapped.
        assert.notStrictEqual(got, Left.value);
        // Test that it's the wrapped left value.
        assert.strictEqual(got.fromTheLeft, true);
        // Sanity check.
        assert.strictEqual(get(Left, Left.base), Left.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](Left, Left.base));
                assert(existenceChecks[check](wrappedLeftSide, wrappedLeftSide.base));

                assert(!existenceChecks[check](Left, Left.someObject));
                assert(!existenceChecks[check](wrappedLeftSide, wrappedLeftSide.someObject));
            });
    });

    it('bT[fT] = vP;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(Left, Left.base, wrappedRightSide.value);

        const got = get(wrappedLeftSide, wrappedLeftSide.base);

        // Test that it's unwrapped.
        assert.strictEqual(got, Right.value);
        // Test that it was the wrapped right value.
        assert.strictEqual(wrappedRightSide.value.fromTheRight, true);
        // Sanity check.
        assert.strictEqual(get(Left, Left.base), wrappedRightSide.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](Left, Left.base));
                assert(existenceChecks[check](wrappedLeftSide, wrappedLeftSide.base));

                assert(!existenceChecks[check](Left, Left.someObject));
                assert(!existenceChecks[check](wrappedLeftSide, wrappedLeftSide.someObject));
            });
    });

    it('bT[fP] = vT;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(wrappedRightSide, Left.base, Left.value);

        const got = get(Right, wrappedLeftSide.base);

        // Test that it's wrapped.
        assert.notStrictEqual(got, Left.value);
        // Test that it's the wrapped left value.
        assert.strictEqual(got.fromTheLeft, true);
        // Sanity check.
        assert.strictEqual(get(wrappedRightSide, Left.base), Left.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](wrappedRightSide, Left.base));
                assert(existenceChecks[check](Right, wrappedLeftSide.base));

                assert(!existenceChecks[check](wrappedRightSide, Left.someObject));
                assert(!existenceChecks[check](Right, wrappedLeftSide.someObject));
            });
    });

    it('bT[fP] = vP;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(wrappedRightSide, Left.base, wrappedRightSide.value);

        const got = get(Right, wrappedLeftSide.base);
        // Test that it's unwrapped.
        assert.strictEqual(got, Right.value);
        // Test that it was the wrapped right value.
        assert.strictEqual(wrappedRightSide.value.fromTheRight, true);
        // Sanity check.
        assert.strictEqual(get(wrappedRightSide, Left.base), wrappedRightSide.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](wrappedRightSide, Left.base));
                assert(existenceChecks[check](Right, wrappedLeftSide.base));

                assert(!existenceChecks[check](wrappedRightSide, Left.someObject));
                assert(!existenceChecks[check](Right, wrappedLeftSide.someObject));
            });
    });

    it('bP[fT] = vT;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(Left, wrappedRightSide.base, Left.value);

        const got = get(wrappedLeftSide, Right.base);
        // Test that it's wrapped.
        assert.notStrictEqual(got, Left.value);
        // Test that it's the wrapped left value.
        assert.strictEqual(got.fromTheLeft, true);
        // Sanity check.
        assert.strictEqual(get(Left, wrappedRightSide.base), Left.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](Left, wrappedRightSide.base));
                assert(existenceChecks[check](wrappedLeftSide, Right.base));

                assert(!existenceChecks[check](Left, wrappedRightSide.someObject));
                assert(!existenceChecks[check](wrappedLeftSide, Right.someObject));
            });
    });

    it('bP[fT] = vP;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(Left, wrappedRightSide.base, wrappedRightSide.value);

        const got = get(wrappedLeftSide, Right.base);
        // Test that it's unwrapped.
        assert.strictEqual(got, Right.value);
        // Test that it was the wrapped right value.
        assert.strictEqual(wrappedRightSide.value.fromTheRight, true);
        // Sanity check.
        assert.strictEqual(get(Left, wrappedRightSide.base), wrappedRightSide.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](Left, wrappedRightSide.base));
                assert(existenceChecks[check](wrappedLeftSide, Right.base));

                assert(!existenceChecks[check](Left, wrappedRightSide.someObject));
                assert(!existenceChecks[check](wrappedLeftSide, Right.someObject));
            });
    });

    it('bP[fP] = vT;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(wrappedRightSide, wrappedRightSide.base, Left.value);

        const got = get(Right, Right.base);
        // Test that it's wrapped.
        assert.notStrictEqual(got, Left.value);
        // Test that it's the wrapped left value.
        assert.strictEqual(got.fromTheLeft, true);
        // Sanity check.
        assert.strictEqual(get(wrappedRightSide, wrappedRightSide.base), Left.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](Right, Right.base));
                assert(existenceChecks[check](wrappedRightSide, wrappedRightSide.base));

                assert(!existenceChecks[check](Right, Right.someObject));
                assert(!existenceChecks[check](wrappedRightSide, wrappedRightSide.someObject));
            });
    });

    it('bP[fP] = vP;', () => {
        const {
            Left,
            Right,
            wrappedLeftSide,
            wrappedRightSide,
        } = setup();
        set(wrappedRightSide, wrappedRightSide.base, wrappedRightSide.value);

        const got = get(Right, Right.base);
        // Test that it's unwrapped.
        assert.strictEqual(got, Right.value);
        // Test that it was the wrapped right value.
        assert.strictEqual(wrappedRightSide.value.fromTheRight, true);
        // Sanity check.
        assert.strictEqual(get(wrappedRightSide, wrappedRightSide.base), wrappedRightSide.value);

        // has checks
        Object.keys(existenceChecks)
            .forEach(check => {
                assert(existenceChecks[check](Right, Right.base));
                assert(existenceChecks[check](wrappedRightSide, wrappedRightSide.base));

                assert(!existenceChecks[check](Right, Right.someObject));
                assert(!existenceChecks[check](wrappedRightSide, wrappedRightSide.someObject));
            });
    });

    Object.keys(existenceChecks)
        .forEach(check => {
            /**
             * @param {'bT' | 'bP'} baseName
             * @param {'fT' | 'fP'} fieldName
             * @param {boolean} [doSet]
             */
            function hasCheckInvariant(baseName, fieldName, doSet) {
                it(`${baseName} ${check} ${fieldName} ${doSet ? 'with' : 'without'} set`, () => {
                    const {
                        Left,
                        Right,
                        wrappedLeftSide,
                        wrappedRightSide,
                    } = setup();
                    const baseSide = baseName === 'bT'
                        ? [Left, wrappedLeftSide]
                        : [Right, wrappedRightSide];
                    const [originalBaseSide, wrappedBaseSide] = ((baseName === 'bT') !== (fieldName === 'fT'))
                        ? baseSide.reverse()
                        : baseSide;
                    const [originalFieldSide, wrappedFieldSide] = fieldName === 'fT'
                        ? [Left, wrappedLeftSide]
                        : [Right, wrappedRightSide];
                    if (doSet) {
                        set(originalFieldSide, originalBaseSide.base, true);
                    }
                    const original = existenceChecks[check](originalFieldSide, originalBaseSide.base);
                    const wrapped = existenceChecks[check](wrappedFieldSide, wrappedBaseSide.base);

                    assert.strictEqual(original, !!doSet);
                    assert.strictEqual(wrapped, original);
                });
            }
            describe(`Existence check by '${check}'`, () => {
                hasCheckInvariant('bT', 'fT');
                hasCheckInvariant('bT', 'fT', true);
                hasCheckInvariant('bT', 'fP');
                hasCheckInvariant('bT', 'fP', true);
                hasCheckInvariant('bP', 'fT');
                hasCheckInvariant('bP', 'fT', true);
                hasCheckInvariant('bP', 'fP');
                hasCheckInvariant('bP', 'fP', true);
            });
        });
};
