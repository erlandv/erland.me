/**
 * Remark Plugin for Figure Transformation
 *
 * Converts standalone images with titles into semantic
 * `<figure>` + `<figcaption>` elements.
 *
 * **Markdown Input:**
 * ```markdown
 * ![Hero image](hero.jpg "This is the caption")
 * ```
 *
 * **HTML Output:**
 * ```html
 * <figure class="prose-figure">
 *   <img src="hero.jpg" alt="Hero image" />
 *   <figcaption>This is the caption</figcaption>
 * </figure>
 * ```
 */

import { visit } from 'unist-util-visit';
import type { Node, Parent } from 'unist';

interface ImageNode extends Node {
  type: 'image';
  title?: string | null;
  url?: string;
  alt?: string;
}

interface TextNode extends Node {
  type: 'text';
  value?: string;
}

interface ParagraphNode extends Parent {
  type: 'paragraph';
  children: Node[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

/**
 * Remark plugin to convert standalone images with titles into semantic figures
 *
 * Transforms paragraph nodes containing only a single image (with title) into
 * `<figure>` + `<figcaption>` structure for better semantics and styling.
 *
 * **Note:** Only processes paragraphs with exactly one image element (ignoring whitespace).
 * Images without titles are left unchanged.
 *
 * @returns Remark transformer function
 */
export default function remarkFigure(): (tree: Node) => void {
  return (tree: Node) => {
    visit(
      tree,
      (node: Node): node is ParagraphNode => node.type === 'paragraph',
      (node: ParagraphNode) => {
        // Check if paragraph contains only one image (ignoring whitespace)
        const children = (node.children || []).filter((c: Node) => {
          if (c.type === 'text') {
            const textNode = c as TextNode;
            return textNode.value && textNode.value.trim();
          }
          return true;
        });

        if (children.length === 1 && children[0].type === 'image') {
          const image = children[0] as ImageNode;
          const caption: string | null = image.title || null;

          // If title (caption) exists, convert to figure
          if (caption) {
            image.title = null; // Remove title from image

            node.data = {
              hName: 'figure',
              hProperties: {
                className: ['prose-figure'],
              },
            };

            node.children = [
              image,
              {
                type: 'paragraph',
                data: { hName: 'figcaption' },
                children: [{ type: 'text', value: caption } as TextNode],
              } as ParagraphNode,
            ];
          }
        }
      }
    );
  };
}
