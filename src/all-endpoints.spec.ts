import { describe, it, expect } from 'vitest';
import axios, { AxiosAdapter, AxiosResponse } from 'axios';
import * as sdk from './index';
import { Configuration } from './index';

// A permissive stand-in usable as any request-parameter shape (string / number /
// array / nested DTO) so every generated method can build its request without
// throwing before the HTTP call. It stringifies to 'DUMMY', is a no-op when called,
// yields an empty list for array operations, and returns itself for any property.
// (JSON.stringify is safe: its `toJSON` resolves to a function, which serializes to
// `undefined` rather than recursing.)
const anyParam: any = new Proxy(function () {}, {
  get(_target, prop) {
    if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') return () => 'DUMMY';
    if (prop === Symbol.iterator) return function* () {};
    if (prop === 'then') return undefined; // never look like a thenable
    if (prop === 'length') return 0;
    if (['map', 'filter', 'forEach', 'slice'].includes(prop as string)) return () => [];
    return anyParam;
  },
  apply: () => anyParam,
});

// Capture the requests dispatched through the injected axios instance without
// hitting the network.
function mockAxios() {
  const calls: AxiosResponse['config'][] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse;
  };
  return { calls, instance: axios.create({ adapter }) };
}

// axios lowercases the request method before the adapter sees it.
const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'];

type ApiCtor = new (
  configuration?: Configuration,
  basePath?: string,
  axiosInstance?: ReturnType<typeof axios.create>,
) => Record<string, (...args: unknown[]) => Promise<unknown>>;

const apiClasses = Object.entries(sdk).filter(([name, value]) => name.endsWith('RoutesApi') && typeof value === 'function') as unknown as [
  string,
  ApiCtor,
][];

describe('every generated API method issues a well-formed request (mocked axios adapter)', () => {
  it('discovers every RoutesApi class exported by the package', () => {
    expect(apiClasses.length).toBe(17);
  });

  for (const [className, ApiClass] of apiClasses) {
    const methods = Object.getOwnPropertyNames(ApiClass.prototype).filter(
      (name) => name !== 'constructor' && typeof (ApiClass.prototype as Record<string, unknown>)[name] === 'function',
    );

    it(`${className} exposes at least one endpoint method`, () => {
      expect(methods.length).toBeGreaterThan(0);
    });

    for (const method of methods) {
      it(`${className}.${method} builds a single well-formed request`, async () => {
        const { calls, instance } = mockAxios();
        const api = new ApiClass(new Configuration(), undefined, instance);

        // Methods with a required request-parameter object have arity >= 1; methods
        // whose parameters are all optional default `requestParameters` to `{}`
        // (arity 0) and take only the optional AxiosRequestConfig.
        const args = (ApiClass.prototype as Record<string, (...a: unknown[]) => unknown>)[method].length >= 1 ? [anyParam] : [];
        try {
          await api[method](...args);
        } catch {
          // The empty mock body may not satisfy a response model; we only assert on
          // the request, which axios builds and dispatches before any parsing.
        }

        expect(calls).toHaveLength(1);
        expect(calls[0].url).toMatch(/^https?:\/\/[^ ]+/);
        expect(HTTP_METHODS).toContain(String(calls[0].method).toLowerCase());
      });
    }
  }
});
