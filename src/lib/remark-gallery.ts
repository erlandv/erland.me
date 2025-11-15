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

// Convert remark-gallery plugin to TypeScript with proper typing
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

// Plugin untuk mengkonversi markdown image dengan title menjadi figure/figcaption
export function remarkFigure(): (tree: Node) => void {
  return (tree: Node) => {
    visit(
      tree,
      (node: Node): node is ParagraphNode => node.type === 'paragraph',
      (node: ParagraphNode) => {
        // Cek apakah paragraph hanya berisi satu image (abaikan whitespace)
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

          // Jika ada title (caption), konversi menjadi figure
          if (caption) {
            image.title = null; // Hapus title dari image

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
