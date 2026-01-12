/**
 * Unit tests for shared utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  formatCurrency,
  formatNumber,
  formatDuration,
  extractHashtags,
  extractMentions,
  buildUtmParams,
  appendUtmToUrl,
  calculatePercentChange,
  truncate,
  chunk,
} from '../utils';

describe('generateSlug', () => {
  it('should convert text to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Hello! World?')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('Hello    World')).toBe('hello-world');
  });

  it('should trim leading/trailing hyphens', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });
});

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
  });

  it('should format EUR correctly', () => {
    expect(formatCurrency(99.99, 'EUR')).toBe('€99.99');
  });

  it('should handle whole numbers', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00');
  });
});

describe('formatNumber', () => {
  it('should format thousands with K', () => {
    expect(formatNumber(1500)).toBe('1.5K');
  });

  it('should format millions with M', () => {
    expect(formatNumber(1500000)).toBe('1.5M');
  });

  it('should format billions with B', () => {
    expect(formatNumber(1500000000)).toBe('1.5B');
  });

  it('should not format small numbers', () => {
    expect(formatNumber(500)).toBe('500');
  });
});

describe('formatDuration', () => {
  it('should format seconds to mm:ss', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('should format hours to hh:mm:ss', () => {
    expect(formatDuration(3665)).toBe('1:01:05');
  });

  it('should handle zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('extractHashtags', () => {
  it('should extract hashtags from text', () => {
    expect(extractHashtags('Hello #world #test')).toEqual(['world', 'test']);
  });

  it('should return empty array if no hashtags', () => {
    expect(extractHashtags('Hello world')).toEqual([]);
  });

  it('should lowercase hashtags', () => {
    expect(extractHashtags('#HELLO #World')).toEqual(['hello', 'world']);
  });
});

describe('extractMentions', () => {
  it('should extract mentions from text', () => {
    expect(extractMentions('Hello @user @another')).toEqual(['user', 'another']);
  });

  it('should return empty array if no mentions', () => {
    expect(extractMentions('Hello world')).toEqual([]);
  });
});

describe('buildUtmParams', () => {
  it('should build UTM query string', () => {
    const result = buildUtmParams({
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'spring2024',
    });
    expect(result).toBe('utm_source=google&utm_medium=cpc&utm_campaign=spring2024');
  });

  it('should skip undefined params', () => {
    const result = buildUtmParams({
      utmSource: 'google',
      utmMedium: undefined,
      utmCampaign: 'spring2024',
    });
    expect(result).toBe('utm_source=google&utm_campaign=spring2024');
  });
});

describe('appendUtmToUrl', () => {
  it('should append UTM to URL without query string', () => {
    const result = appendUtmToUrl('https://example.com/page', {
      utmSource: 'test',
    });
    expect(result).toBe('https://example.com/page?utm_source=test');
  });

  it('should append UTM to URL with existing query string', () => {
    const result = appendUtmToUrl('https://example.com/page?foo=bar', {
      utmSource: 'test',
    });
    expect(result).toBe('https://example.com/page?foo=bar&utm_source=test');
  });

  it('should return original URL if no UTM params', () => {
    const result = appendUtmToUrl('https://example.com/page', {});
    expect(result).toBe('https://example.com/page');
  });
});

describe('calculatePercentChange', () => {
  it('should calculate positive change', () => {
    expect(calculatePercentChange(150, 100)).toBe(50);
  });

  it('should calculate negative change', () => {
    expect(calculatePercentChange(50, 100)).toBe(-50);
  });

  it('should handle zero previous value', () => {
    expect(calculatePercentChange(100, 0)).toBe(100);
  });

  it('should handle both zero values', () => {
    expect(calculatePercentChange(0, 0)).toBe(0);
  });
});

describe('truncate', () => {
  it('should truncate long text', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('should not truncate short text', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle empty array', () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it('should handle chunk size larger than array', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });
});
