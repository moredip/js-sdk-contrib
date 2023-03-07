import {
  FlagNotFoundError,
  GeneralError,
  ResolutionDetails,
  StandardResolutionReasons,
  TypeMismatchError,
} from '@openfeature/js-sdk';
import { InMemoryProvider } from './in-memory-provider';

describe(InMemoryProvider, () => {
  let provider: InMemoryProvider;
  beforeEach(() => {
    const flags = {
      'a-string-flag': 'configured-value',
      'a-boolean-flag': true,
      'a-numeric-flag': 42,
    };
    provider = new InMemoryProvider(flags);
  });

  describe('boolean flags', () => {
    it('resolves to the configured value for a known flag', async () => {
      const resolution = await provider.resolveBooleanEvaluation('a-boolean-flag');
      verifyResolution(resolution, { expectedValue: true });
    });

    it('throws a TypeMismatchError when asked to resolve a non-boolean flag', async () => {
      const evaluation = provider.resolveBooleanEvaluation('a-string-flag');

      expect(evaluation).rejects.toThrow(TypeMismatchError);
    });

    it('throws when asked for an unrecognized flag', async () => {
      const evaluation = provider.resolveBooleanEvaluation('unknown-flag');
      expect(evaluation).rejects.toThrow(FlagNotFoundError);
    });
  });

  describe('string flags', () => {
    it('resolves to the configured value for a known flag', async () => {
      const resolution = await provider.resolveStringEvaluation('a-string-flag');
      verifyResolution(resolution, { expectedValue: 'configured-value' });
    });

    it('throws when asked for an unrecognized flag', async () => {
      const evaluation = provider.resolveStringEvaluation('unknown-string-flag');
      expect(evaluation).rejects.toThrow(FlagNotFoundError);
    });

    it('throws a TypeMismatchError when asked to resolve a non-string flag', async () => {
      const evaluation = provider.resolveStringEvaluation('a-boolean-flag');

      expect(evaluation).rejects.toThrow(TypeMismatchError);
    });
  });

  describe('numeric flags', () => {
    it('resolves to the configured value for a known flag', async () => {
      const resolution = await provider.resolveNumberEvaluation('a-numeric-flag');
      verifyResolution(resolution, { expectedValue: 42 });
    });

    it('throws when asked for an unrecognized flag', async () => {
      const evaluation = provider.resolveNumberEvaluation('unknown-string-flag');
      expect(evaluation).rejects.toThrow(FlagNotFoundError);
    });

    it('throws a TypeMismatchError when asked to resolve a non-string flag', async () => {
      const evaluation = provider.resolveNumberEvaluation('a-boolean-flag');

      expect(evaluation).rejects.toThrow(TypeMismatchError);
    });
  });

  describe('object flags', () => {
    it('is not currently supported, even if you try providing an object flag', async () => {
      const provider = new InMemoryProvider({
        'an-object-flag': { foo: 'bar' },
      } as any); // bypass type-safety to simulate a JS consumer

      const evaluation = provider.resolveObjectEvaluation('an-object-flag');
      expect(evaluation).rejects.toThrow(GeneralError);
    });
  });

  it('reflects changes in flag configuration', async () => {
    const provider = new InMemoryProvider({
      'some-flag': 'initial-value',
    });

    const firstResolution = await provider.resolveStringEvaluation('some-flag');
    verifyResolution(firstResolution, { expectedValue: 'initial-value' });

    provider.replaceConfiguration({
      'some-flag': 'updated-value',
    });

    const secondResolution = await provider.resolveStringEvaluation('some-flag');
    verifyResolution(secondResolution, { expectedValue: 'updated-value' });
  });
});

type VerifyResolutionParams<U> = {
  expectedValue: U;
};
function verifyResolution<U>(resolution: ResolutionDetails<U>, { expectedValue }: VerifyResolutionParams<U>) {
  expect(resolution.value).toBe(expectedValue);
  expect(resolution.reason).toBe(StandardResolutionReasons.STATIC);
  expect(resolution.errorCode).toBeUndefined();
}
