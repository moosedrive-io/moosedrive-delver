import { ClientBuilder } from 'remofs-client';
import { decodeObject } from 'omnistreams';
import { ChoiceButton } from './components/buttons.js';
import { Directory } from './components/directory.js';


const State = {
  fs: null,
  curDir: null,
  curPath: null,
  remoAddr: window.location.origin,
};

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
        producer.request(1);

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

        if (update.meta === null) {
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
    });
  },

  view: function() {
    if (!State.curDir) {
      return null;
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
          m(Directory, {
            curPath: State.curPath,
            remoAddr: State.remoAddr,
            items: State.curDir.children,
            clicked: (key) => {
              console.log(State.curDir);
              const target = State.curDir.children[key];
              if (target.type === 'dir') {
                State.curPath.push(key);
                State.curDir = target;
              }
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
          }),
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
          //m('i.dirnav__btn.dirnav__back.fas.fa-arrow-left', {
          //    onclick: () => {
          //      vnode.attrs.onBack();
          //    },
          //  }
          //),
          //m('i.dirnav__btn.dirnav__forward.fas.fa-arrow-right', {
          //    onclick: () => {
          //      vnode.attrs.onForward();
          //    },
          //  }
          //),
        ),
        m(BreadcrumbPath, { pathList }),
        m('span.pure-u.dirnav__btn.dirnav__upload',
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


function Login() {

  let email = "";

  return {
    view: function() {
      return m('main',
        m('h1', "Login"),
        m('p', "Enter your email address to get an access key"),
        m('input', {
          type: 'text',
          onkeyup: function(e) {
            email = e.target.value;
          },
          //value: "tapitman11@gmail.com",
        },
        ),
        m('button', {
            onclick: function() {
              console.log(email);

              m.request({
                url: State.remoAddr + '/login',
                method: 'POST',
                withCredentials: true,
                data: {
                  email,
                },
                deserialize: (data) => data,
              })
              .then(function(response) {
                console.log(response);
                m.route.set('/enterkey');
              })
              .catch((e) => {
                console.error(e);
              });
            },
          },
          "Submit"
        ),
      );
    }
  }
}

const EnterKey = () => {

  let key = "";

  return {
    view: (vnode) => {
      return m('main',
        m('h1', "Complete Login"),
        m('p', "Check your email for a key and enter it here"),
        m('input', {
          type: 'text',
          onchange: function(e) {
            key = e.target.value;
          },
        },
        ),
        m('button', {
            onclick: function() {
              console.log(key);

              m.request({
                url: State.remoAddr + '/login',
                method: 'POST',
                withCredentials: true,
                data: {
                  key,
                },
                deserialize: (data) => data,
              })
              .then(function(response) {
                console.log(response);
                m.route.set('/home');
              })
              .catch((e) => {
                console.error(e);
              });
            },
          },
          "Submit"
        ),
      );
    },
  };
};

const Data = {
  view: function() {
    return m('h1',
      "Hi there data",
    );
  }
};

const root = document.getElementById('root');
m.route(root, '/',{
  '/': Home,
  '/login': Login,
  '/enterkey': EnterKey,
  '/data': Data,
});
