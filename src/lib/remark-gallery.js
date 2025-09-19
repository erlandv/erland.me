import { visit } from 'unist-util-visit';

export default function remarkGallery() {
  return (tree) => {
    visit(
      tree,
      (node) => node.type === 'containerDirective' && node.name === 'gallery',
      (node) => {
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

         const images = child.children?.filter((n) => n.type === 'image') ?? [];
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
