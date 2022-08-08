import { Configuration, ConfigurationParameters, NodeInfoDTO, NodeRoutesApi } from '@nemtus/symbol-sdk-openapi-generator-typescript-axios';
import { AxiosResponse } from 'axios';

(async () => {
  const configurationParameters: ConfigurationParameters = {
    basePath: 'http://symbol-sakura-16.next-web-technology.com:3000',
  };
  const configuration: Configuration = new Configuration(configurationParameters);
  const nodeRoutesApi: NodeRoutesApi = new NodeRoutesApi(configuration);
  const response: AxiosResponse<NodeInfoDTO, any> = await nodeRoutesApi.getNodeInfo();
  const dto: NodeInfoDTO = response.data;
  console.log(response.status); // Example: 200
  console.log(response.statusText); // Example: "OK"
  console.dir(dto, { depth: null });
  // Example:
  /*
  {
    version: 16777987,
    publicKey: 'B86304B01045894ED9250B3DCD6313DC2EC0DD529B4E864EA376A2F341D3CFD4',
    networkGenerationHashSeed: '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6',
    roles: 3,
    port: 7900,
    networkIdentifier: 104,
    host: 'symbol-sakura-16.next-web-technology.com',
    friendlyName: 'next-web-technology',
    nodePublicKey: '9545F928A1B2FB4AC944BC1EC2F01FB84A503F6449B6BE3451B3F7A0F06B5BCF'
  }
  */
})();
