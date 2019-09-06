import m from 'mithril';
import { getType as getMime } from 'mime';
import { DirectoryAdapter } from './directory.js';


const Preview = (state, type, name, url, vnode) => {

  let preview;

  switch (state) {
    case 'compact':
      preview = null;
      break;
    case 'expanded': {

      let previewContent;

      const mime = getMime(name);


      if (type === 'file') {

        if (mime === null) {
          // no-op
        }
        else if (mime.startsWith('image/')) {
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
              data: vnode.attrs.state.children,
              appState: vnode.attrs.appState,
            },
          ),
        );
      }

      preview = m('.item__preview',
        m('.item__preview__content',
          previewContent,
        ),
      );

      break;
    }
    default:
      throw new Error("Invalid state: " + state);
      break;
  }

  return preview;
};


const TextPreview = () => {

  let text = "";

  return {
    oninit: async (vnode) => {
      const responseText = await m.request({
        url: vnode.attrs.url,
        withCredentials: true,
        responseType: 'text',
      });

      text = responseText;
    },

    view: (vnode) => {
      return m('textarea.text-preview',
        text,
      );
    },
  };
};
export { Preview };
