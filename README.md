# symbol-sdk-openapi-generator-typescript-axios

Symbol SDK for TypeScript with OpenAPI Generator typescript-axios

## For package users

### Install

```bash
npm install @nemtus/symbol-sdk-openapi-generator-typescript-axios
```

### Usage

```typescript
// Todo: Add usage sample here.
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
