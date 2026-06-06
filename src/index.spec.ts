import { describe, it, expect } from 'vitest';
import * as exports from './index';
import * as api from './api';

describe('index exports', () => {
  it('re-exports every runtime member of ./api from the package root', () => {
    // Guards against the barrel dropping a re-export and auto-covers future
    // additions (new models/classes/enums). Interfaces are type-only (erased at
    // runtime) so they never appear here.
    const keys = Object.keys(api);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect((exports as Record<string, unknown>)[key]).toBe((api as Record<string, unknown>)[key]);
    }
  });

  // Existence is covered by the `typeof === 'function'` checks below (a missing
  // constructor would fail those too), so plain `toBeDefined()` enumerations are
  // intentionally omitted to avoid duplication.

  it('should export all *RoutesApi classes as constructors', () => {
    for (const name of [
      'AccountRoutesApi',
      'BlockRoutesApi',
      'ChainRoutesApi',
      'FinalizationRoutesApi',
      'HashLockRoutesApi',
      'MetadataRoutesApi',
      'MosaicRoutesApi',
      'MultisigRoutesApi',
      'NamespaceRoutesApi',
      'NetworkRoutesApi',
      'NodeRoutesApi',
      'ReceiptRoutesApi',
      'RestrictionAccountRoutesApi',
      'RestrictionMosaicRoutesApi',
      'SecretLockRoutesApi',
      'TransactionRoutesApi',
      'TransactionStatusRoutesApi',
    ]) {
      expect(typeof (exports as Record<string, unknown>)[name]).toBe('function');
    }
  });

  it('exports the Configuration runtime class', () => {
    expect(typeof exports.Configuration).toBe('function');
    expect(new exports.Configuration()).toBeInstanceOf(exports.Configuration);
  });

  it('exports the generated Factory / Fp / AxiosParamCreator helpers per route group', () => {
    // typescript-axios emits a functional layer alongside each *RoutesApi class.
    expect(typeof exports.NodeRoutesApiFactory).toBe('function');
    expect(typeof exports.NodeRoutesApiFp).toBe('function');
    expect(typeof exports.NodeRoutesApiAxiosParamCreator).toBe('function');
  });

  it('exports the COLLECTION_FORMATS-independent BASE_PATH-free surface needed by consumers', () => {
    // The axios variant intentionally does not re-export the low-level base.ts
    // internals (BASE_PATH / BaseAPI / RequiredError); consumers interact through
    // the *RoutesApi classes + Configuration, which are asserted above. This test
    // documents that contract so an accidental future change is noticed.
    expect((exports as Record<string, unknown>).BaseAPI).toBeUndefined();
    expect((exports as Record<string, unknown>).RequiredError).toBeUndefined();
  });
});
