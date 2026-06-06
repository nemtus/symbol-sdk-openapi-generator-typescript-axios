import { describe, test, expect } from 'vitest';

const symbolSdk = require('@nemtus/symbol-sdk-openapi-generator-typescript-axios');
const { assertNodeInfo } = require('../../../_shared/fixtures.cjs');

describe('getNodeInfo', () => {
  test('should return valid node information', async () => {
    // Arrange (axios works natively in Node — no node-fetch injection needed)
    const configurationParameters = {
      basePath: 'https://symbol-main-1.nemtus.com:3001',
    };
    const configuration = new symbolSdk.Configuration(configurationParameters);
    const nodeRoutesApi = new symbolSdk.NodeRoutesApi(configuration);

    // Act
    const response = await nodeRoutesApi.getNodeInfo();

    // Assert (shared fixture; volatile fields relaxed there)
    assertNodeInfo(expect, response.data);
  });
});
