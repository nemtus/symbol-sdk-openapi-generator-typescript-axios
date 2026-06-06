import { describe, it, expect } from 'vitest';
import axios, { AxiosAdapter, AxiosError, AxiosResponse } from 'axios';
import { AccountRoutesApi, Configuration, NodeRoutesApi } from './index';

interface MockResponse {
  status: number;
  body?: unknown;
}

// Inject a custom axios adapter so the generated client can be exercised
// deterministically, without any network or live-node dependency. The adapter
// captures every request config and returns a canned response. A custom adapter is
// responsible for honouring `validateStatus` itself (axios's built-in http/xhr
// adapters do this via `settle`), so we reproduce that: non-2xx responses reject
// with an AxiosError exactly as they would against a real node. The instance is
// passed as the 3rd *RoutesApi constructor argument (the typescript-axios
// injection point).
function mockAxios(queue: MockResponse[]) {
  const calls: AxiosResponse['config'][] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const next = queue.shift() ?? { status: 200, body: {} };
    const response = {
      data: next.body ?? {},
      status: next.status,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse;
    if (config.validateStatus && !config.validateStatus(response.status)) {
      throw new AxiosError(`Request failed with status code ${response.status}`, AxiosError.ERR_BAD_REQUEST, config, undefined, response);
    }
    return response;
  };
  return { calls, instance: axios.create({ adapter }) };
}

describe('generated client behaviour (mocked axios adapter)', () => {
  it('exposes a successful response body on response.data', async () => {
    const { calls, instance } = mockAxios([{ status: 200, body: { version: 42, friendlyName: 'mock-node', roles: 3 } }]);
    const api = new NodeRoutesApi(new Configuration(), undefined, instance);

    const response = await api.getNodeInfo();

    expect(response.data.version).toBe(42);
    expect(response.data.friendlyName).toBe('mock-node');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/node/info');
    expect(String(calls[0].method).toLowerCase()).toBe('get');
  });

  it('builds the request path from path parameters', async () => {
    const { calls, instance } = mockAxios([
      { status: 200, body: { id: 'doc-1', account: { address: 'ADDRESS', activityBuckets: [], mosaics: [] } } },
    ]);
    const api = new AccountRoutesApi(new Configuration(), undefined, instance);

    const response = await api.getAccountInfo({ accountId: 'TARGET_ACCOUNT' });

    expect(calls[0].url).toContain('/accounts/TARGET_ACCOUNT');
    expect(response.data.account?.address).toBe('ADDRESS');
  });

  it('throws RequiredError when a required parameter is missing', async () => {
    const { instance } = mockAxios([]);
    const api = new AccountRoutesApi(new Configuration(), undefined, instance);

    // RequiredError is a low-level base.ts class that the axios barrel does not
    // re-export, so assert on its discriminant `name` rather than `instanceof`.
    await expect(api.getAccountInfo({} as never)).rejects.toMatchObject({ name: 'RequiredError' });
  });

  it('rejects with an AxiosError on a non-2xx status', async () => {
    const { instance } = mockAxios([{ status: 404, body: { code: 'ResourceNotFound' } }]);
    const api = new NodeRoutesApi(new Configuration(), undefined, instance);

    await expect(api.getNodeInfo()).rejects.toBeInstanceOf(AxiosError);
  });
});
