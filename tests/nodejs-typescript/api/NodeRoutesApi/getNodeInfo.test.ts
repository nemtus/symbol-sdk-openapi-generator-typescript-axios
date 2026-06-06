import { Configuration, ConfigurationParameters, NodeInfoDTO, NodeRoutesApi } from '@nemtus/symbol-sdk-openapi-generator-typescript-axios';
import { test, expect } from 'vitest';
import * as fixtures from '../../../_shared/fixtures.cjs';

test('getNodeInfo return valid response', async () => {
  // Arrange (axios works natively in Node — no node-fetch injection needed)
  const configurationParameters: ConfigurationParameters = {
    basePath: 'https://symbol-main-1.nemtus.com:3001',
  };
  const configuration: Configuration = new Configuration(configurationParameters);
  const nodeRoutesApi: NodeRoutesApi = new NodeRoutesApi(configuration);

  // Act
  let nodeInfoDTO: NodeInfoDTO;
  try {
    const response = await nodeRoutesApi.getNodeInfo();
    nodeInfoDTO = response.data;
  } catch (error) {
    throw new Error(`getNodeInfo failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Assert (shared fixture; volatile fields relaxed there)
  fixtures.assertNodeInfo(expect, nodeInfoDTO);
});
