# symbol-sdk-openapi-generator-typescript-axios

Symbol SDK for TypeScript with OpenAPI Generator typescript-axios

## For package users

### Install

```bash
npm install @nemtus/symbol-sdk-openapi-generator-typescript-axios
```

### Usage

```typescript
import { Configuration, ConfigurationParameters, NodeInfoDTO, NodeRoutesApi } from '@nemtus/symbol-sdk-openapi-generator-typescript-axios';

const configurationParameters: ConfigurationParameters = {
  basePath: 'https://symbol-sakura-16.next-web-technology.com:3001',
};
const configuration: Configuration = new Configuration(configurationParameters);
const nodeRoutesApi: NodeRoutesApi = new NodeRoutesApi(configuration);
const response = await nodeRoutesApi.getNodeInfo();
const nodeInfoDTO: NodeInfoDTO = response.data;
console.log(response.status); // Example: 200
console.log(response.statusText); // Example: 'OK'
console.dir(nodeInfoDTO, { depth: null });
/* Example: 
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
```

## For Developers

### 1. Build openapi3.yml

If necessary update git submodule of `symbol-openapi`.

```bash
cd symbol-openapi
npm install
npm run build
```

Use symbol-openapi/_build/openapi3.yml to generate REST API client code.

### 2. Generate REST API Client Code

```bash
cd ..
npm install
npm run openapi:set:version
npm run openapi:generate
npm run build
```

Then, REST API client code will be generated in `src/api`.
Do not edit `src/api` manually.
