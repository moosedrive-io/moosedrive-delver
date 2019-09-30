import m from 'mithril';
import { getType as getMime } from 'mime';
import { DirectoryAdapter } from './directory.js';
import { TextFileEditor } from './text_editor.js';


const Preview = (path, data, remoAddr) => {
  const dom = document.createElement('div');
  dom.classList.add('preview');

  function Wrapper() {
      return {
        view: (vnode) => {
          return m(PreviewMithril,
            {
              state: 'expanded',
              path,
              data,
              remoAddr,
            }
          )
        },
      };
    }

  m.mount(dom, Wrapper);
  return dom;
};

const PreviewMithril = () => {
  return {
    oncreate: (vnode) => {

      vnode.dom.addEventListener('save', (e) => {
        e.stopPropagation();

        vnode.dom.dispatchEvent(new CustomEvent('upload-text-file', {
          bubbles: true,
          detail: {
            path: vnode.attrs.path,
            filename: vnode.attrs.path[vnode.attrs.path.length - 1],
            text: e.detail.text,
          },
        }));
      });
    },

    view: (vnode) => {

      let previewContent = null;

      const pathStr = vnode.attrs.path.join('/');
      const url = encodeURI(vnode.attrs.remoAddr + '/' + pathStr);

      switch (vnode.attrs.state) {
        case 'minimized':
          previewContent = null;
          break;
        case 'expanded': {

          const mime = getMime(vnode.attrs.path[vnode.attrs.path.length - 1]);

          if (vnode.attrs.data.type === 'file') {

            if (mime && mime.startsWith('image/')) {
              previewContent = m('.item__preview__image__container',
                m('img.item__preview__image',
                  {
                    src: url,
                  },
                ),
              );
            }
            // default to assuming text
            else {
              previewContent = m('.item__preview__text',
                m(TextPreview,
                  {
                    url,
                    path: vnode.attrs.path,
                  },
                ),
              );
            }
          }
          else {
            previewContent = m('.item__preview__content__directory',
              m(DirectoryAdapter,
                {
                  path: vnode.attrs.path,
                  data: vnode.attrs.data.children,
                  remoAddr: vnode.attrs.remoAddr,
                },
              ),
            );
          }

          

          break;
        }
        default:
          throw new Error("Invalid state: " + state);
          break;
      }

      return m('.item__preview',
        m('.item__preview__content',
          previewContent,
        ),
      );
    },
  };
};


const TextPreview = () => {

  let text = "";

  return {
    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: async (vnode) => {

      text = await m.request({
        url: vnode.attrs.url,
        withCredentials: true,
        responseType: 'text',
      });

      vnode.dom.appendChild(TextFileEditor({
        initialText: text,
        editFilename: false,
      }));
    },

    view: (vnode) => {
      return m('.text-preview');
    },
  };
};

export {
  Preview,
  PreviewMithril
};
