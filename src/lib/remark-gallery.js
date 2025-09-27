import { visit } from 'unist-util-visit';

export default function remarkGallery() {
  return tree => {
    visit(
      tree,
      node => node.type === 'containerDirective' && node.name === 'gallery',
      node => {
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = {
          className: ['content-image-grid'],
        };

        const nextChildren = [];

        for (const child of node.children || []) {
          if (child.type === 'text' && !child.value.trim()) {
            continue;
          }

          if (child.type !== 'paragraph') {
            nextChildren.push(child);
            continue;
          }

          const images = child.children?.filter(n => n.type === 'image') ?? [];
          if (images.length === 0) {
            nextChildren.push(child);
            continue;
          }

          for (const image of images) {
            const caption = image.title || '';
            image.title = null;

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
export function remarkFigure() {
  return tree => {
    visit(
      tree,
      node => node.type === 'paragraph',
      node => {
        // Cek apakah paragraph hanya berisi satu image
        if (node.children?.length === 1 && node.children[0].type === 'image') {
          const image = node.children[0];
          const caption = image.title;

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
