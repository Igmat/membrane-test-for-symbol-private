const { membrane } = require('..');
const assert = require('assert');
require('./__polyfill');

global.describe = function(name, cb) {
    console.group(name);
    cb();
    console.groupEnd(name);
}
global.it = function(name, cb) {
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
        field: leftField,
        value: { fromTheLeft: true },

        get(obj) {
            return obj[leftField];
        },
        set(obj, value) {
            obj[leftField] = value;
        },
    };

    const Right = {
        base: {},
        field: rightField,
        value: { fromTheRight: true },

        get(obj) {
            return obj[rightField];
        },
        set(obj, value) {
            obj[rightField] = value;
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

exports.stringFields = function() {
    return setup('leftField', 'rightField');
}

exports.symbolFields = function() {
    return setup(Symbol('leftField'), Symbol('rightField'));
}

exports.privateSymbolFields = function() {
    return setup(Symbol.private('leftField'), Symbol.private('rightField'));
}

exports.preExposedPrivateSymbolFields = function() {
    const membrane = setup(Symbol.private('leftField'), Symbol.private('rightField'));
    // Expose the fields before the tests.
    membrane.wrappedLeftSide.field;
    membrane.wrappedRightSide.field;
    return membrane;
}

exports.suite = function(setup, set, get) {
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
    });
};
