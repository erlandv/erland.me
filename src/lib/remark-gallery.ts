import { visit } from 'unist-util-visit';

// Convert remark-gallery plugin to TypeScript with minimal typing to avoid
// adding new type dependencies. Keep behavior identical to the original.
export default function remarkGallery(): (tree: any) => void {
  return (tree: any) => {
    visit(
      tree,
      (node: any) =>
        node.type === 'containerDirective' && node.name === 'gallery',
      (node: any) => {
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = {
          className: ['content-image-grid'],
        };

        const nextChildren: any[] = [];

        for (const child of node.children || []) {
          if (child.type === 'text' && !(child.value ?? '').trim()) {
            continue;
          }

          if (child.type !== 'paragraph') {
            nextChildren.push(child);
            continue;
          }

          const images =
            child.children?.filter((n: any) => n.type === 'image') ?? [];
          if (images.length === 0) {
            nextChildren.push(child);
            continue;
          }

          for (const image of images) {
            const caption: string = image.title || '';
            // Ensure title removed from image; cast to any to satisfy typing
            (image as any).title = null;

            const figureNode = {
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
                        children: [{ type: 'text', value: caption }],
                      },
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
export function remarkFigure(): (tree: any) => void {
  return (tree: any) => {
    visit(
      tree,
      (node: any) => node.type === 'paragraph',
      (node: any) => {
        // Cek apakah paragraph hanya berisi satu image (abaikan whitespace)
        const children = (node.children || []).filter(
          (c: any) => !(c.type === 'text' && !(c.value || '').trim())
        );
        if (children.length === 1 && (children[0] as any).type === 'image') {
          const image: any = children[0];
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
                children: [{ type: 'text', value: caption }],
              },
            ];
          }
        }
      }
    );
  };
}
