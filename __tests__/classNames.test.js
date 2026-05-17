import { classNames } from '../pages/tracker';

describe('classNames utility', () => {
  it('joins multiple class strings', () => {
    expect(classNames('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(classNames('foo', null, undefined, false, '', 'bar')).toBe('foo bar');
  });

  it('returns empty string when all values are falsy', () => {
    expect(classNames(null, undefined, false, '')).toBe('');
  });

  it('handles a single class', () => {
    expect(classNames('only')).toBe('only');
  });

  it('handles no arguments', () => {
    expect(classNames()).toBe('');
  });
});
