import { ClientBuilder } from 'remofs-client';
import { decodeObject } from 'omnistreams';
import { ChoiceButton } from './components/buttons.js';
import { DirectoryAdapter } from './components/directory.js';
import m from 'mithril';
import rein from 'rein-state';


const State = {
};

let reinstate;

const Home = () => {

  const appState = rein.fromObject({
    path: [],
    remoAddr: window.location.origin,
  });
  
  return {
    oninit: function() {

      // TODO: do proper cookie parsing
      const key = document.cookie.split('=')[1];

      (async () => {
        State.client = await new ClientBuilder()
          .authKey(key)
          .secure(false)
          .build();

        reinstate = await State.client.getReinstate();

        State.client.onReinUpdate(() => {
          m.redraw();
        });
      })();
    },

    oncreate: (vnode) => {

      vnode.dom.addEventListener('set-public-view', (e) => {
        State.client.setPublicView(buildPathStr(e.detail.path), e.detail.value, e.detail.recursive);
      });

      vnode.dom.addEventListener('add-viewer', (e) => {
        console.log('add-viewer-event', e.detail);
        State.client.addViewer(buildPathStr(e.detail.path), e.detail.viewerId);
        //State.client.setPublicView(buildPathStr(e.detail.path), e.detail.value, e.detail.recursive);
      });

      vnode.dom.addEventListener('delete-item', async (e) => {

        const path = '/' + e.detail.path.join('/');

        try {
          const result = await State.client.delete(path);
        }
        catch (e) {
          console.error("Failed to delete:", path, e);
        }
      });
    },

    view: function() {

      if (!reinstate) {
        return m('main');
      }

      return m('main',
        m('.pure-g',
          m('.left-panel.pure-u-1-4'),
          m('.center-panel.pure-u-1-2',
            m(DirNav, {
              pathList: [],
              onUp: () => {
              },
              onBack: () => {
              },
              onForward: () => {
              },
            }),
            m('.main__directory',
              m(DirectoryAdapter,
                {
                  path: [],
                  data: reinstate.root.children,
                  appState,
                },
              ),
            ),
          ),
          m('.right-panel.pure-u-1-4'),
        ),
      );
    }
  };
};

const DirNav = () => {
  return {
    view: (vnode) => {

      const pathList = vnode.attrs.pathList;

      return m('.dirnav.pure-g',
        m('span.pure-u',
          m('i.dirnav__btn.dirnav__up.fas.fa-arrow-up', {
              onclick: () => {
                vnode.attrs.onUp();
              },
            }
          ),
        ),
        m(BreadcrumbPath, { pathList }),
        m('span.pure-u.dirnav__btn.dirnav__upload',
          {
            title: "Upload",
          },
          m(UploadButton,
            {
              onSelection: (e) => {

                const file = e.target.files[0];
                const path = '/' + file.name;

                State.client.uploadFile(path, file);
              },
            }
          ),
        ),
      );
    }
  };
};


function UploadButton() {

  let fileUploadElem;
  let folderUploadElem;

  return {
    oncreate: (vnode) => {
      fileUploadElem = vnode.dom.querySelector('#file-input');
      fileUploadElem.addEventListener('change', (e) => {
        vnode.attrs.onSelection(e);
      });

      folderUploadElem = vnode.dom.querySelector('#folder-input');
      folderUploadElem.addEventListener('change', (e) => {
        console.log(e);
        //vnode.attrs.onSelection(e);
      });
    },
    view: (vnode) => {
      return m('span.upload-btn',
        m('input.#file-input.upload-btn__input',
          {
            type: 'file',
            multiple: true,
          }
        ),
        m('input.#folder-input.upload-btn__input',
          {
            type: 'file',
            // TODO: which of the following 3 are actually necessary? It seems
            // to at least need webkitdirectory and mozdirectory in Firefox
            directory: true,
            webkitdirectory: true,
            mozdirectory: true,
          }
        ),
        m(ChoiceButton,
          {
            iconClasses: '.fas.fa-cloud-upload-alt',
            promptText: "Upload:",
            option1Text: "Folder",
            option2Text: "File(s)",
            onOption1: () => {
              console.log("folder");
              folderUploadElem.click();
            },
            onOption2: () => {
              console.log("files");
              fileUploadElem.click();
            },
            onCancel: () => {
            },
          }
        ),
      );
    },
  };
}

const BreadcrumbPath = () => {
  return {
    view: (vnode) => m('span.breadcrumb-path.pure-u',
      m('span.pure-u', '/'),
      vnode.attrs.pathList.map((elem) => {
        return m('span.pure-u', elem + '/');
      }),
    ),
  };
};


function buildPathStr(path) {
  return '/' + path.join('/');
}

const root = document.getElementById('root');
m.route(root, '/',{
  '/': Home,
});
