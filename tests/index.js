const helpers = require('./__helpers');

describe('Membranes', () => {
  describe('Closure based access', () => {
    const set = (Side, base, value) => {
      Side.set(base, value);
    };
    const get = (Side, base) => {
      return Side.get(base);
    };

    describe('string fields', () => {
      helpers.suite(helpers.stringFields, set, get);
    });

    describe('public symbol fields', () => {
      helpers.suite(helpers.symbolFields, set, get);
    });

    describe('private symbol fields', () => {
      helpers.suite(helpers.privateSymbolFields, set, get);
    });
  });

  describe('Reified key based access', () => {
    const set = (Side, base, value) => {
      base[Side.field] = value;
    };
    const get = (Side, base) => {
      return base[Side.field];
    };

    describe('string fields', () => {
      helpers.suite(helpers.stringFields, set, get);
    });

    describe('public symbol fields', () => {
      helpers.suite(helpers.symbolFields, set, get);
    });

    describe('private symbol fields', () => {
      helpers.suite(helpers.privateSymbolFields, set, get);
    });

    describe('private symbol fields (pre exposed)', () => {
      helpers.suite(helpers.preExposedPrivateSymbolFields, set, get);
    });
  });
});
