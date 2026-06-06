import { describe, test, expect } from 'vitest';

const symbolSdk = require('@nemtus/symbol-sdk-openapi-generator-typescript-axios');
const { assertAccountInfo } = require('../../../_shared/fixtures.cjs');

describe('getAccountInfo', () => {
  test('should return valid account information', async () => {
    // Arrange
    const configurationParameters = {
      basePath: 'https://symbol-main-1.nemtus.com:3001',
    };
    const configuration = new symbolSdk.Configuration(configurationParameters);
    const accountRoutesApi = new symbolSdk.AccountRoutesApi(configuration);
    const requestParameters = {
      accountId: 'NCSIOEWE2364XXP65426W3RUGBRYOAGR3KMMCIA',
    };

    // Act
    let response;
    try {
      response = await accountRoutesApi.getAccountInfo(requestParameters);
    } catch (error) {
      throw new Error(`getAccountInfo failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Assert (shared fixture; volatile fields relaxed there)
    assertAccountInfo(expect, response.data);
  });
});
