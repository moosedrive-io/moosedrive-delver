import m from 'mithril';
import { getType as getMime } from 'mime';
import { DirectoryAdapter } from './directory.js';


const Preview = () => {
  return {
    oncreate: (vnode) => {
      vnode.dom.addEventListener('save', (e) => {
        e.stopPropagation();

        vnode.dom.dispatchEvent(new CustomEvent('upload-text-file', {
          bubbles: true,
          detail: {
            path: vnode.attrs.path,
            filename: vnode.attrs.name,
            text: e.detail.text,
          },
        }));
      });
    },

    view: (vnode) => {

      let previewContent = null;

      switch (vnode.attrs.state) {
        case 'compact':
          previewContent = null;
          break;
        case 'expanded': {


          const mime = getMime(vnode.attrs.name);


          if (vnode.attrs.type === 'file') {

            if (mime && mime.startsWith('image/')) {
              previewContent = m('.item__preview__image__container',
                m('img.item__preview__image',
                  {
                    src: vnode.attrs.url,
                  },
                ),
              );
            }
            // default to assuming text
            else {
              previewContent = m('.item__preview__text',
                m(TextPreview,
                  {
                    url: vnode.attrs.url,
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
                  data: vnode.attrs.data,
                  appState: vnode.attrs.appState,
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
  let responseText = "";

  return {
    oninit: async (vnode) => {
      responseText = await m.request({
        url: vnode.attrs.url,
        withCredentials: true,
        responseType: 'text',
      });

      text = responseText;
    },

    view: (vnode) => {
      return m('.div',
        m('button',
          {
            onclick: () => {
              vnode.dom.dispatchEvent(new CustomEvent('save', {
                bubbles: true,
                detail: {
                  path: vnode.attrs.path,
                  text,
                },
              }));
            },
          },
          "Save"
        ), 
        //m('button',
        //  {
        //    onclick: () => {
        //      text = responseText;
        //    },
        //  },
        //  "Reset"
        //),
        m('textarea.text-preview__textarea',
          {
            spellcheck: false,
            oninput: (e) => {
              text = e.target.value;
            },
          },
          text,
        ),
      );
    },
  };
};
export { Preview };
