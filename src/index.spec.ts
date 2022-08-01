import { helloWorld } from '.';

describe('helloWorld', () => {
  it('should return Hello World Alice', () => {
    expect.hasAssertions();
    expect(helloWorld('Alice')).toBe('Hello World Alice');
  });
});
