import { describe, it, expect } from 'vitest';
import { buildExportPayload, parseImportedConfig, validateImportedRules, mergeRules } from './utils';
import { type Rule } from './types/Rule';

const makeRule = (overrides: Partial<Rule> = {}): Rule => ({
  contentType: 'componentFlexible',
  contentTypeField: 'layout',
  condition: 'is equal',
  conditionValue: 'TextOnly',
  isForSameEntity: false,
  targetEntity: 'contentFlexible',
  targetEntityField: ['primaryImage'],
  ...overrides,
});

const contentTypes = [
  {
    sys: { id: 'componentFlexible' },
    name: 'Component: Flexible',
    fields: [{ id: 'layout' }, { id: 'appearance' }],
  },
  {
    sys: { id: 'contentFlexible' },
    name: 'Content: Flexible',
    fields: [{ id: 'primaryImage' }, { id: 'secondaryImage' }, { id: 'video' }],
  },
];

describe('buildExportPayload', () => {
  it('wraps rules in a rules array and strips runtime entryId', () => {
    const payload = buildExportPayload([makeRule({ entryId: 'abc123' })]);
    expect(Object.keys(payload)).toEqual(['rules']);
    expect(payload.rules).toHaveLength(1);
    expect(payload.rules[0]).not.toHaveProperty('entryId');
  });
});

describe('parseImportedConfig', () => {
  it('parses an object with a rules array', () => {
    const raw = JSON.stringify({ rules: [makeRule()] });
    expect(parseImportedConfig(raw)).toHaveLength(1);
  });

  it('parses a bare array of rules', () => {
    const raw = JSON.stringify([makeRule(), makeRule()]);
    expect(parseImportedConfig(raw)).toHaveLength(2);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseImportedConfig('{not json')).toThrow(/not valid JSON/i);
  });

  it('throws when there is no rules array', () => {
    expect(() => parseImportedConfig(JSON.stringify({ foo: 'bar' }))).toThrow(/expected an array/i);
  });
});

describe('validateImportedRules', () => {
  it('accepts rules referencing existing content types and fields', () => {
    const { validRules, invalidRules } = validateImportedRules([makeRule()], contentTypes);
    expect(validRules).toHaveLength(1);
    expect(invalidRules).toHaveLength(0);
  });

  it('rejects rules with a missing source content type', () => {
    const { validRules, invalidRules } = validateImportedRules([makeRule({ contentType: 'ghost' })], contentTypes);
    expect(validRules).toHaveLength(0);
    expect(invalidRules[0].reasons[0]).toMatch(/Content type "ghost" does not exist/);
  });

  it('rejects rules with a missing source field', () => {
    const { invalidRules } = validateImportedRules([makeRule({ contentTypeField: 'nope' })], contentTypes);
    expect(invalidRules[0].reasons[0]).toMatch(/Field "nope" does not exist/);
  });

  it('rejects rules with a missing target field', () => {
    const { invalidRules } = validateImportedRules([makeRule({ targetEntityField: ['primaryImage', 'ghostField'] })], contentTypes);
    expect(invalidRules[0].reasons[0]).toMatch(/"ghostField" do not exist/);
  });

  it('rejects malformed rules', () => {
    const { invalidRules } = validateImportedRules([{} as Rule], contentTypes);
    expect(invalidRules[0].reasons[0]).toMatch(/missing required properties/);
  });
});

describe('mergeRules', () => {
  it('adds non-duplicate rules', () => {
    const existing = [makeRule()];
    const incoming = [makeRule({ conditionValue: 'ImageOnly' })];
    expect(mergeRules(existing, incoming)).toHaveLength(2);
  });

  it('skips duplicate rules regardless of target field order', () => {
    const existing = [makeRule({ targetEntityField: ['primaryImage', 'video'] })];
    const incoming = [makeRule({ targetEntityField: ['video', 'primaryImage'] })];
    expect(mergeRules(existing, incoming)).toHaveLength(1);
  });
});
