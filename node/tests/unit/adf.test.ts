/**
 * Unit tests for ADF (Atlassian Document Format) utilities
 */

import { describe, it, expect } from 'vitest';
import {
  textToADF,
  markdownToADF,
  adfToText,
  emptyADF,
  isEmptyADF,
} from '../../src/utils/adf.js';

describe('ADF Utilities', () => {
  describe('textToADF', () => {
    it('should convert simple text to ADF', () => {
      const adf = textToADF('Hello world');

      expect(adf.version).toBe(1);
      expect(adf.type).toBe('doc');
      expect(adf.content).toHaveLength(1);
      expect(adf.content[0]?.type).toBe('paragraph');
      expect(adf.content[0]?.content?.[0]?.text).toBe('Hello world');
    });

    it('should handle multiple paragraphs', () => {
      const adf = textToADF('Paragraph 1\n\nParagraph 2');

      expect(adf.content).toHaveLength(2);
      expect(adf.content[0]?.content?.[0]?.text).toBe('Paragraph 1');
      expect(adf.content[1]?.content?.[0]?.text).toBe('Paragraph 2');
    });

    it('should return empty ADF for empty string', () => {
      const adf = textToADF('');

      expect(adf.content).toHaveLength(0);
    });

    it('should trim whitespace', () => {
      const adf = textToADF('  Hello  ');

      expect(adf.content[0]?.content?.[0]?.text).toBe('Hello');
    });
  });

  describe('markdownToADF', () => {
    it('should convert markdown heading', () => {
      const adf = markdownToADF('# Heading');

      expect(adf.content[0]?.type).toBe('heading');
      expect(adf.content[0]?.attrs?.level).toBe(1);
    });

    it('should convert bullet list', () => {
      const adf = markdownToADF('- Item 1\n- Item 2');

      expect(adf.content[0]?.type).toBe('bulletList');
      expect(adf.content[0]?.content).toHaveLength(2);
    });

    it('should convert ordered list', () => {
      const adf = markdownToADF('1. First\n2. Second');

      expect(adf.content[0]?.type).toBe('orderedList');
      expect(adf.content[0]?.content).toHaveLength(2);
    });

    it('should convert paragraph', () => {
      const adf = markdownToADF('Simple paragraph');

      expect(adf.content[0]?.type).toBe('paragraph');
    });

    it('should return empty ADF for empty markdown', () => {
      const adf = markdownToADF('');

      expect(adf.content).toHaveLength(0);
    });
  });

  describe('adfToText', () => {
    it('should convert paragraph to text', () => {
      const adf = textToADF('Hello world');
      const text = adfToText(adf);

      expect(text).toBe('Hello world');
    });

    it('should convert multiple paragraphs to text', () => {
      const adf = textToADF('Paragraph 1\n\nParagraph 2');
      const text = adfToText(adf);

      expect(text).toContain('Paragraph 1');
      expect(text).toContain('Paragraph 2');
    });

    it('should handle empty ADF', () => {
      const adf = emptyADF();
      const text = adfToText(adf);

      expect(text).toBe('');
    });

    it('should handle nested structures', () => {
      const adf = {
        version: 1 as const,
        type: 'doc' as const,
        content: [
          {
            type: 'paragraph' as const,
            content: [
              {
                type: 'text' as const,
                text: 'Test',
              },
            ],
          },
        ],
      };

      const text = adfToText(adf);
      expect(text).toBe('Test');
    });
  });

  describe('emptyADF', () => {
    it('should create empty ADF document', () => {
      const adf = emptyADF();

      expect(adf.version).toBe(1);
      expect(adf.type).toBe('doc');
      expect(adf.content).toEqual([]);
    });
  });

  describe('isEmptyADF', () => {
    it('should return true for undefined', () => {
      expect(isEmptyADF(undefined)).toBe(true);
    });

    it('should return true for empty content', () => {
      const adf = emptyADF();
      expect(isEmptyADF(adf)).toBe(true);
    });

    it('should return false for non-empty content', () => {
      const adf = textToADF('Content');
      expect(isEmptyADF(adf)).toBe(false);
    });
  });
});
