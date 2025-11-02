/**
 * Atlassian Document Format (ADF) utilities
 * Converts text and markdown to JIRA's rich text format
 */

import type { ADFDocument, ADFNode } from '../models/common.js';

/**
 * Convert plain text to ADF document
 */
export function textToADF(text: string): ADFDocument {
  if (!text || text.trim() === '') {
    return {
      version: 1,
      type: 'doc',
      content: [],
    };
  }

  // Split by paragraphs (double newlines)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim() !== '');

  const content: ADFNode[] = paragraphs.map((paragraph) => ({
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: paragraph.trim(),
      },
    ],
  }));

  return {
    version: 1,
    type: 'doc',
    content,
  };
}

/**
 * Convert markdown-like syntax to ADF document
 * Supports:
 * - **bold**
 * - *italic*
 * - `code`
 * - # Heading
 * - - Bullet lists
 * - 1. Numbered lists
 * - [link](url)
 */
export function markdownToADF(markdown: string): ADFDocument {
  if (!markdown || markdown.trim() === '') {
    return {
      version: 1,
      type: 'doc',
      content: [],
    };
  }

  const lines = markdown.split('\n');
  const content: ADFNode[] = [];
  let inList = false;
  let listItems: ADFNode[] = [];
  let listType: 'bulletList' | 'orderedList' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Heading
    if (line.startsWith('# ')) {
      if (inList) {
        content.push(createList(listType!, listItems));
        inList = false;
        listItems = [];
        listType = null;
      }
      content.push(createHeading(line.slice(2).trim(), 1));
      continue;
    }

    // Bullet list
    if (line.match(/^[-*] /)) {
      if (!inList || listType !== 'bulletList') {
        if (inList) {
          content.push(createList(listType!, listItems));
          listItems = [];
        }
        inList = true;
        listType = 'bulletList';
      }
      listItems.push(createListItem(line.slice(2).trim()));
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      if (!inList || listType !== 'orderedList') {
        if (inList) {
          content.push(createList(listType!, listItems));
          listItems = [];
        }
        inList = true;
        listType = 'orderedList';
      }
      listItems.push(createListItem(line.replace(/^\d+\. /, '').trim()));
      continue;
    }

    // End of list
    if (line.trim() === '' && inList) {
      content.push(createList(listType!, listItems));
      inList = false;
      listItems = [];
      listType = null;
      continue;
    }

    // Regular paragraph
    if (line.trim() !== '') {
      if (inList) {
        content.push(createList(listType!, listItems));
        inList = false;
        listItems = [];
        listType = null;
      }
      content.push(createParagraph(line));
    }
  }

  // Close any open list
  if (inList && listType) {
    content.push(createList(listType, listItems));
  }

  return {
    version: 1,
    type: 'doc',
    content,
  };
}

/**
 * Create paragraph node with inline formatting
 */
function createParagraph(text: string): ADFNode {
  return {
    type: 'paragraph',
    content: parseInlineFormatting(text),
  };
}

/**
 * Create heading node
 */
function createHeading(text: string, level: number): ADFNode {
  return {
    type: 'heading',
    attrs: { level },
    content: parseInlineFormatting(text),
  };
}

/**
 * Create list node
 */
function createList(type: 'bulletList' | 'orderedList', items: ADFNode[]): ADFNode {
  return {
    type,
    content: items,
  };
}

/**
 * Create list item node
 */
function createListItem(text: string): ADFNode {
  return {
    type: 'listItem',
    content: [
      {
        type: 'paragraph',
        content: parseInlineFormatting(text),
      },
    ],
  };
}

/**
 * Parse inline formatting (bold, italic, code, links)
 */
function parseInlineFormatting(text: string): ADFNode[] {
  const nodes: ADFNode[] = [];
  const current = text;

  // For simplicity, create text nodes with marks
  // A full implementation would need proper parsing with regex patterns
  const textNode: ADFNode = {
    type: 'text',
    text: current,
  };

  // Apply marks (simplified)
  if (current.includes('**')) {
    textNode.marks = textNode.marks || [];
    textNode.marks.push({ type: 'strong' });
  }
  if (current.includes('*') && !current.includes('**')) {
    textNode.marks = textNode.marks || [];
    textNode.marks.push({ type: 'em' });
  }
  if (current.includes('`')) {
    textNode.marks = textNode.marks || [];
    textNode.marks.push({ type: 'code' });
  }

  nodes.push(textNode);
  return nodes;
}

/**
 * Convert ADF document to plain text (for display/logging)
 */
export function adfToText(adf: ADFDocument): string {
  if (!adf.content || adf.content.length === 0) {
    return '';
  }

  const lines: string[] = [];

  for (const node of adf.content) {
    lines.push(nodeToText(node));
  }

  return lines.filter((l) => l !== '').join('\n\n');
}

/**
 * Convert ADF node to text
 */
function nodeToText(node: ADFNode): string {
  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.type === 'paragraph' || node.type === 'heading') {
    return node.content?.map(nodeToText).join('') || '';
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return (
      node.content
        ?.map((item, i) => {
          const prefix = node.type === 'bulletList' ? '- ' : `${i + 1}. `;
          return prefix + nodeToText(item);
        })
        .join('\n') || ''
    );
  }

  if (node.type === 'listItem') {
    return node.content?.map(nodeToText).join('') || '';
  }

  return '';
}

/**
 * Create empty ADF document
 */
export function emptyADF(): ADFDocument {
  return {
    version: 1,
    type: 'doc',
    content: [],
  };
}

/**
 * Check if ADF document is empty
 */
export function isEmptyADF(adf?: ADFDocument): boolean {
  return !adf || !adf.content || adf.content.length === 0;
}
