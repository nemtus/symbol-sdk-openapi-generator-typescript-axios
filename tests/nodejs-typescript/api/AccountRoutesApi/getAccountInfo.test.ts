import {
  AccountInfoDTO,
  AccountRoutesApi,
  AccountRoutesApiGetAccountInfoRequest,
  Configuration,
  ConfigurationParameters,
} from '@nemtus/symbol-sdk-openapi-generator-typescript-axios';
import { test, expect, describe } from 'vitest';
import * as fixtures from '../../../_shared/fixtures.cjs';

describe('getAccountInfo', () => {
  test('return valid response', async () => {
    // Arrange
    const configurationParameters: ConfigurationParameters = {
      basePath: 'https://symbol-main-1.nemtus.com:3001',
    };
    const configuration: Configuration = new Configuration(configurationParameters);
    const accountRoutesApi: AccountRoutesApi = new AccountRoutesApi(configuration);
    const requestParameters: AccountRoutesApiGetAccountInfoRequest = {
      accountId: 'NCSIOEWE2364XXP65426W3RUGBRYOAGR3KMMCIA',
    };

    // Act
    let accountInfoDTO: AccountInfoDTO;
    try {
      const response = await accountRoutesApi.getAccountInfo(requestParameters);
      accountInfoDTO = response.data;
    } catch (error) {
      throw new Error(`getAccountInfo failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }

    // Assert (shared fixture; volatile fields relaxed there)
    fixtures.assertAccountInfo(expect, accountInfoDTO);
  });
});
