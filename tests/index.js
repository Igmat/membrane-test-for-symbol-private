const helpers = require('./__helpers');

describe('Membranes', () => {
    describe('Closure based access', () => {
        const set = (Side, base, value) => {
            Side.set(base, value);
        };
        const get = (Side, base) => {
            return Side.get(base);
        };
        const existenceChecks = {
            has(Side, base) {
                return Side.has(base);
            },
            hasOwn(Side, base) {
                return Side.hasOwn(base);
            },
            hasIn(Side, base) {
                return Side.hasIn(base);
            }
        };

        describe('string fields', () => {
            helpers.suite(helpers.stringFields, set, get, existenceChecks);
        });

        describe('public symbol fields', () => {
            helpers.suite(helpers.symbolFields, set, get, existenceChecks);
        });

        describe('private symbol fields', () => {
            helpers.suite(helpers.privateSymbolFields, set, get, existenceChecks);
        });

        describe('private symbol fields (pre exposed)', () => {
            helpers.suite(helpers.preExposedPrivateSymbolFields, set, get, existenceChecks);
        });
    });

    describe('Reified key based access', () => {
        const set = (Side, base, value) => {
            base[Side.field] = value;
        };
        const get = (Side, base) => {
            return base[Side.field];
        };
        const existenceChecks = {
            has(Side, obj) {
                return Reflect.has(obj, Side.field);
            },
            hasOwn(Side, base) {
                return base.hasOwnProperty(Side.field);
            },
            hasIn(Side, obj) {
                return Side.field in obj;
            }
        };

        describe('string fields', () => {
            helpers.suite(helpers.stringFields, set, get, existenceChecks);
        });

        describe('public symbol fields', () => {
            helpers.suite(helpers.symbolFields, set, get, existenceChecks);
        });

        describe('private symbol fields', () => {
            helpers.suite(helpers.privateSymbolFields, set, get, existenceChecks);
        });

        describe('private symbol fields (pre exposed)', () => {
            helpers.suite(helpers.preExposedPrivateSymbolFields, set, get, existenceChecks);
        });
    });
});
