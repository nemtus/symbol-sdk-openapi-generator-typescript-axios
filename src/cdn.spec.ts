import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as indexExports from './index';

describe('cdn exports', () => {
  let originalWindow: any;

  beforeEach(() => {
    // Save original window object
    originalWindow = global.window;
    // Create mock window object
    global.window = {} as any;
    // Reset modules
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original window object
    if (originalWindow !== undefined) {
      global.window = originalWindow;
    } else {
      // @ts-expect-error window is non-optional on the global type; deleting it is intentional in this test
      delete global.window;
    }
  });

  it('should attach symbolSdkOpenAPIGeneratorTypeScriptAxios to window object', async () => {
    // Import cdn module which should attach to window
    await import('./cdn');

    expect((window as any).symbolSdkOpenAPIGeneratorTypeScriptAxios).toBeDefined();
  });

  it('should export all *RoutesApi classes as constructors through window object', async () => {
    await import('./cdn');

    const sdk = (window as any).symbolSdkOpenAPIGeneratorTypeScriptAxios;

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
      expect(typeof sdk[name]).toBe('function');
    }
  });

  it('should export the Configuration runtime class and Factory/Fp helpers through window object', async () => {
    await import('./cdn');

    const sdk = (window as any).symbolSdkOpenAPIGeneratorTypeScriptAxios;

    expect(typeof sdk.Configuration).toBe('function');
    expect(new sdk.Configuration()).toBeInstanceOf(sdk.Configuration);
    expect(typeof sdk.NodeRoutesApiFactory).toBe('function');
    expect(typeof sdk.NodeRoutesApiFp).toBe('function');
    expect(typeof sdk.NodeRoutesApiAxiosParamCreator).toBe('function');
  });

  it('should export the same content as index module', async () => {
    // Import cdn module
    await import('./cdn');
    const cdnExports = (window as any).symbolSdkOpenAPIGeneratorTypeScriptAxios;

    // Check that cdn exports match index exports. This auto-covers future
    // additions: any new runtime export of ./index must also be exposed through
    // the CDN bundle. (Values aren't compared by identity because beforeEach calls
    // vi.resetModules(), so the dynamically imported module is a separate instance.)
    expect(Object.keys(cdnExports).sort()).toEqual(Object.keys(indexExports).sort());
  });
});
