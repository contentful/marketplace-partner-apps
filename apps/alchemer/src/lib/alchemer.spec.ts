import { parseSavedSurvey, safeAlchemerUrl } from './alchemer';

describe('safeAlchemerUrl', () => {
  it('accepts https share and editor links on every Alchemer region', () => {
    for (const url of [
      'https://survey.alchemer.com/s3/1234567/customer-satisfaction',
      'https://app.alchemer.com/projects/editor?id=1234567',
      'https://survey.alchemer.eu/s3/1234567/x',
      'https://app.alchemer-ca.com/projects/editor?id=1',
      'https://survey.au.alchemer.com/s3/1234567/x',
    ]) {
      expect(safeAlchemerUrl(url)).toBe(url);
    }
  });

  it('rejects javascript:, http:, other hosts and look-alike hosts', () => {
    for (const url of [
      'javascript:alert(1)',
      'http://survey.alchemer.com/s3/1234567/x',
      'https://attacker.example/alchemer.com',
      // Suffix matching must be on a dot boundary, or this would pass.
      'https://notalchemer.com/s3/1',
      'https://alchemer.com.attacker.example/',
      'not a url',
      '',
    ]) {
      expect(safeAlchemerUrl(url)).toBeUndefined();
    }
  });

  it('rejects non-string values', () => {
    expect(safeAlchemerUrl(undefined)).toBeUndefined();
    expect(safeAlchemerUrl({ href: 'https://survey.alchemer.com/' })).toBeUndefined();
  });
});

describe('parseSavedSurvey', () => {
  it('returns undefined for values that are not a survey descriptor', () => {
    for (const raw of [undefined, null, 'text', 42, [], {}, { surveyId: 1 }, { title: 'x' }]) {
      expect(parseSavedSurvey(raw)).toBeUndefined();
    }
  });

  it('fills missing optional fields so the card never crashes on them', () => {
    expect(parseSavedSurvey({ surveyId: '1', title: 'Only the basics' })).toEqual({
      surveyId: '1',
      title: 'Only the basics',
      status: 'unknown',
      url: '',
      editUrl: '',
      modifiedOn: undefined,
      savedAt: '',
    });
  });

  it('passes url and editUrl through unvalidated for the renderer to check', () => {
    const parsed = parseSavedSurvey({ surveyId: '1', title: 't', url: 'javascript:1' });
    expect(parsed?.url).toBe('javascript:1');
  });
});
