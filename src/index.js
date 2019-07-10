import { ClientBuilder } from 'remofs-client';
import { decodeObject } from 'omnistreams';
import { UploadButton } from './components/buttons.js';
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
          //.port(443)
          //.secure(true)
          .port(9001)
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

      vnode.dom.addEventListener('upload-file', (e) => {
        const path = [...e.detail.path, e.detail.file.name];
        const pathStr = encodePath(path);
        State.client.uploadFile(pathStr, e.detail.file);
      });
    },

    view: function() {

      if (!reinstate) {
        return m('main');
      }

      return m('main',
        m('.main',
          m('.main__dirnav',
            m(DirNav, {
              pathList: [],
              onUp: () => {
              },
              onBack: () => {
              },
              onForward: () => {
              },
            }),
          ),
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
      );
    }
  };
};

const DirNav = () => {
  return {
    view: (vnode) => {

      const pathList = vnode.attrs.pathList;

      return m('.dirnav',
        m('span',
          m('i.dirnav__btn.dirnav__up.fas.fa-arrow-up', {
              onclick: () => {
                vnode.attrs.onUp();
              },
            }
          ),
        ),
        m(BreadcrumbPath, { pathList }),
        m('span.dirnav__btn.dirnav__upload',
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


const BreadcrumbPath = () => {
  return {
    view: (vnode) => m('span.breadcrumb-path',
      m('span', '/'),
      vnode.attrs.pathList.map((elem) => {
        return m('span', elem + '/');
      }),
    ),
  };
};


function buildPathStr(path) {
  return '/' + path.join('/');
}


function encodePath(path) {
  return path.length === 1 ? '/' + path[0] : '/' + path.join('/');
}

const root = document.getElementById('root');
m.route(root, '/',{
  '/': Home,
});
