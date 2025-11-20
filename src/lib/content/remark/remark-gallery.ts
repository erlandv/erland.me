/**
 * Remark Plugin for Gallery Transformation
 *
 * Transforms `:::gallery` container directives into `.content-image-grid` divs
 * with automatic figure/figcaption wrapping.
 *
 * **Usage in astro.config.ts:**
 * ```typescript
 * import remarkGallery from './src/lib/content/remark/remark-gallery';
 *
 * export default defineConfig({
 *   markdown: {
 *     remarkPlugins: [remarkGallery]
 *   }
 * });
 * ```
 *
 * **Markdown Example:**
 * ```markdown
 * :::gallery
 * ![Alt text](image1.jpg "Caption 1")
 * ![Alt text](image2.jpg "Caption 2")
 * :::
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

interface ContainerDirectiveNode extends Parent {
  type: 'containerDirective';
  name?: string;
  children: Node[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

/**
 * Remark plugin to transform `:::gallery` directives into image grids
 *
 * Processes container directives with name 'gallery' and transforms them into:
 * - Wrapper div with class `content-image-grid`
 * - Individual `<figure>` elements for each image with class `content-image-grid__item`
 * - `<figcaption>` elements from image titles
 *
 * **Markdown Input:**
 * ```markdown
 * :::gallery
 * ![Image 1](path/to/image1.jpg "Caption for image 1")
 * ![Image 2](path/to/image2.jpg "Caption for image 2")
 * :::
 * ```
 *
 * **HTML Output:**
 * ```html
 * <div class="content-image-grid">
 *   <figure class="content-image-grid__item">
 *     <img src="path/to/image1.jpg" alt="Image 1" />
 *     <figcaption>Caption for image 1</figcaption>
 *   </figure>
 *   <figure class="content-image-grid__item">
 *     <img src="path/to/image2.jpg" alt="Image 2" />
 *     <figcaption>Caption for image 2</figcaption>
 *   </figure>
 * </div>
 * ```
 *
 * @returns Remark transformer function
 */
export default function remarkGallery(): (tree: Node) => void {
  return (tree: Node) => {
    visit(
      tree,
      (node: Node): node is ContainerDirectiveNode =>
        node.type === 'containerDirective' &&
        (node as ContainerDirectiveNode).name === 'gallery',
      (node: ContainerDirectiveNode) => {
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = {
          className: ['content-image-grid'],
        };

        const nextChildren: Node[] = [];

        for (const child of node.children || []) {
          const textNode = child as TextNode;
          if (
            child.type === 'text' &&
            textNode.value &&
            !textNode.value.trim()
          ) {
            continue;
          }

          if (child.type !== 'paragraph') {
            nextChildren.push(child);
            continue;
          }

          const paragraphNode = child as ParagraphNode;
          const images = (paragraphNode.children || []).filter(
            (n: Node): n is ImageNode => n.type === 'image'
          );
          if (images.length === 0) {
            nextChildren.push(child);
            continue;
          }

          for (const image of images) {
            const caption: string = image.title || '';
            // Ensure title removed from image
            image.title = null;

            const figureNode: ParagraphNode = {
              type: 'paragraph',
              data: {
                hName: 'figure',
                hProperties: {
                  className: ['content-image-grid__item'],
                },
              },
              children: [
                image,
                ...(caption
                  ? [
                      {
                        type: 'paragraph',
                        data: { hName: 'figcaption' },
                        children: [
                          { type: 'text', value: caption } as TextNode,
                        ],
                      } as ParagraphNode,
                    ]
                  : []),
              ],
            };

            nextChildren.push(figureNode);
          }
        }

        node.children = nextChildren;
      }
    );
  };
}
