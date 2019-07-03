import { ClientBuilder } from 'remofs-client';
import { decodeObject } from 'omnistreams';
import { ChoiceButton } from './components/buttons.js';
import { Directory } from './components/directory.js';
import m from 'mithril';
import rein from 'rein-state';


const State = {
  fs: null,
  curDir: null,
  curPath: null,
  remoAddr: window.location.origin,
};

let reinstate;

const Home = {
  oninit: function() {

    console.log(State);

    // TODO: do proper cookie parsing
    const key = document.cookie.split('=')[1];

    (async () => {
      State.client = await new ClientBuilder()
        .authKey(key)
        .secure(false)
        .build();

      const producer = await State.client.getMetaStream('/');

      producer.onData((data) => {
        // TODO: might need to tune this number. If it's too low and there are
        // a lot of events the sending side can get an exception for trying to
        // send more than requested.
        producer.request(10);

        const update = decodeObject(data);

        console.log("meta update");
        console.log(update);

        const path = update.path.split('/').slice(1);
        console.log(path);

        const filename = path[path.length - 1];

        let curDir = State.fs;

        for (const next of path.slice(0, path.length - 1)) {
          curDir = curDir.children[next];
          console.log(curDir);
        }

        // TODO: checking for unauthorized here is a hack. Should at least use
        // a code and probably do something cleaner in general.
        if (update.meta === null || update.meta === 'unauthorized') {
          delete curDir.children[filename];
        }
        else {
          curDir.children[filename] = update.meta;
        }

        m.redraw();
      });

      producer.request(1);
    })();

    m.request({
      url: State.remoAddr + '?ignoreIndex=true',
      withCredentials: true,
    })
    .then(function(res) {
      if (res === null) {
        m.route.set('/login');
      }

      console.log(res);
      State.fs = res;
      State.curDir = res;
      State.curPath = [];

      reinstate = rein.fromObject(res);
    });
  },



  oncreate: (vnode) => {

    vnode.dom.addEventListener('set-public-view', (e) => {
      console.log('setpvpvpv', e.detail);
      State.client.setPublicView(buildPathStr(e.detail.path), e.detail.value, e.detail.recursive);
    });
  },

  view: function() {
    if (!State.curDir) {
      return m('main');
    }

    return m('main',
      m('.pure-g',
        m('.left-panel.pure-u-1-4'),
        m('.center-panel.pure-u-1-2',
          m(DirNav, {
            pathList: State.curPath,
            onUp: () => {
              State.curPath.pop();
              State.curDir = State.fs;

              for (const part of State.curPath) {
                State.curDir = State.curDir.children[part];
              }
            },
            onBack: () => {
              console.log("back");
            },
            onForward: () => {
              console.log("forward");
            },
          }),
          m('.main__directory',
            m(Directory, {
              state: reinstate,
              path: State.curPath,
              remoAddr: State.remoAddr,
              items: State.curDir.children,
              clicked: (key) => {
                console.log(State.curDir);
                //const target = State.curDir.children[key];
                //if (target.type === 'dir') {
                //  State.curPath.push(key);
                //  State.curDir = target;
                //}
              },
              onDeleteItem: async (key) => {
                console.log("delete", key);
                const target = State.curDir.children[key];
                const path = '/' + (State.curPath.length === 0 ?
                  key :
                  State.curPath.join('/') + '/' + key);
                console.log(path, target);
                try {
                  const result = await State.client.delete(path);
                  console.log(result);
                }
                catch (e) {
                  console.error("Failed to delete:", path, e);
                }
              },
              addViewer: async (path, viewerId) => {
                console.log("add it", path, viewerId);
                State.client.addViewer(buildPathStr(path), viewerId);
              },
            }),
          ),
        ),
        m('.right-panel.pure-u-1-4'),
      ),
    );
  }
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
                console.log(file);

                let path;
                if (State.curPath.length === 0) {
                  path = '/' + file.name
                }
                else {
                  path = '/' + State.curPath.join('/') + '/' + file.name
                }

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
