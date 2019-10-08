import { ClientBuilder } from 'moosedrive-api-client';
import { decodeObject } from 'omnistreams';
import {
  DeleteButton, UploadButton, UploadButtonNew, NewFolderButton
} from './components/buttons.js';
import { DirectoryAdapter, ItemContentMithril } from './components/directory.js';
import m from 'mithril';
import rein from 'rein-state';


const ITEM_TYPE_DIR = 'dir';
const ITEM_TYPE_FILE = 'file';


const State = {
};

let reinstate;


function handleManfsUpdate(message, reinstate) {

  const update = JSON.parse(message);

  console.log(update);

  let curPath = reinstate.root;
  let parentItem;

  function newObj(path) {
    const obj = {};

    let cur = obj;
    for (const part of path) {
      cur[part] = {};
      cur = cur[part];
    }

    return obj;
  }

  const path = parsePath(update.path);

  while (path.length > 1) {
    const part = path[0];

    // TODO: broken
    //if (!curPath[part]) {
    //  curPath[part] = rein.fromObject(newObj(path.slice(1)));
    //}

    parentItem = curPath;
    curPath = curPath.children[part];
    path.shift();
  }

  const key = path[path.length - 1]; 

  // TODO: need to make sure we're merging properly. If a folder is updated, we
  // shouldn't just replace it in reinstate, because it's nested state might
  // still be valid

  //if (data.action.type === 'update') {
  //  curPath[key] = data.action.value;
  //}
  //else if (data.action.type === 'append') {
  //  curPath[key].push(data.action.viewerId);
  //}
  if (update.type === 'create') {
    curPath.children[key] = update.meta;
  }
  else if (update.type === 'delete') {
    delete curPath.children[key];
  }

  m.redraw();
}

const Home = () => {

  const appState = rein.fromObject({
    path: [],
    remoAddr: window.location.origin,
  });

  let checkedItems = {};
  
  return {
    oninit: function() {

      const cookies = parseCookies();

      const key = cookies.key;

      let secure;
      let port;
      if (window.location.protocol === 'https:') {
        secure = true;
        port = 443;
      }
      else {
        secure = false;
        port = 9001;
      }

      (async () => {
        State.client = await new ClientBuilder()
          .authKey(key)
          .port(port)
          .secure(secure)
          .build();

        reinstate = await State.client.getReinstate();

        State.client.onReinUpdate(() => {
          m.redraw();
        });

        const manfs = new EventSource('/manfs?subscribe=true');

        manfs.addEventListener('message', (e) => {
          const message = JSON.parse(e.data);
          console.log("message", message);
        });

        manfs.addEventListener('create', (e) => {
          handleManfsUpdate(e.data, reinstate);
        });

        manfs.addEventListener('delete', (e) => {
          handleManfsUpdate(e.data, reinstate);
        });

        manfs.addEventListener('update', (e) => {
          handleManfsUpdate(e.data, reinstate);
        });


        //const metaStream = await State.client.getMetaStream('/');

        //metaStream.onData((data) => {
        //  console.log(data);
        //  metaStream.request(1);
        //});
        //metaStream.request(10);

      })();
    },

    oncreate: (vnode) => {

      vnode.dom.addEventListener('set-public-view', (e) => {
        State.client.setPublicView(buildPathStr(e.detail.path), e.detail.value, e.detail.recursive);
      });

      vnode.dom.addEventListener('add-viewer', (e) => {
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

      vnode.dom.addEventListener('upload-text-file', (e) => {
        const path = e.detail.path;
        const pathStr = encodePath(path);
        State.client.storeTextFile(pathStr, e.detail.text);
      });

      vnode.dom.addEventListener('item-check-changed', (e) => {

        const path = e.detail.path;
        const pathStr = encodePath(path);

        if (e.detail.checked === true) {
          checkedItems[pathStr] = e.detail.item
        }
        else {
          delete checkedItems[pathStr];
        }

        const controlBarMithril = vnode.dom.querySelector('.control-bar-mithril');
        controlBarMithril.replaceChild(ControlBar(checkedItems), controlBarMithril.firstChild);
      });

      vnode.dom.addEventListener('delete-selected', (e) => {

        const paths = Object.keys(checkedItems);

        paths.forEach((path) => {
          State.client.delete(path);
        });

        checkedItems = {};
      });

      vnode.dom.addEventListener('create-folder', async (e) => {
        const result = await State.client.createFolder(encodePath(e.detail.path));
      });

    },

    view: function() {

      if (!reinstate) {
        return m('main');
      }

      return m('main',
        m('.main',
          m('.main__control-bar',
            m(ControlBarMithril(checkedItems), {
            }),
          ),
          m('.main__directory',
            m(ItemContentMithril,
            //m(DirectoryAdapter,
              {
                path: [],
                //data: reinstate.root.children,
                data: reinstate.root,
                remoAddr: appState.remoAddr,
              },
            ),
          ),
        ),
      );
    }
  };
};


const ControlBarMithril = (checkedItems) => {

  return {
    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: (vnode) => {
      vnode.dom.appendChild(ControlBar(checkedItems));
    },

    view: (vnode) => {
      return m('.control-bar-mithril');
    }
  };
};

const ControlBar = (checkedItems) => {

  const dom = document.createElement('div');
  dom.classList.add('control-bar');

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('control-bar__buttons');
  dom.appendChild(buttonContainer);

  let editBox = null;

  const keys = Object.keys(checkedItems);
  const numItems = keys.length;

  if (numItems > 0) {
    const deleteButton = DeleteButton();
    deleteButton.addEventListener('click', (e) => {
      if (editBox === null) {
        editBox = document.createElement('div');
        editBox.classList.add('control-bar__confirm-delete');
        dom.appendChild(editBox);

        async function onConfirm() {

          dom.dispatchEvent(new CustomEvent('delete-selected', {
            bubbles: true,
          }));

          dom.removeChild(editBox);
          editBox = null;
        }

        function onCancel() {
          dom.removeChild(editBox);
          editBox = null;
        }

        const paths = Object.keys(checkedItems);
        editBox.appendChild(ConfirmInput(`Delete ${paths.length} items?`, onConfirm, onCancel));
      }
    });
    buttonContainer.appendChild(deleteButton);
  }

  return dom;
};


const ConfirmInput = (prompt, onConfirm, onCancel) => {
  const dom = document.createElement('div');
  dom.classList.add('confirm-input');
  const promptEl = document.createElement('div');
  promptEl.innerText = prompt;
  dom.appendChild(promptEl);

  const confirmButton = document.createElement('button');
  confirmButton.innerText = 'Confirm';
  confirmButton.addEventListener('click', onConfirm);
  dom.appendChild(confirmButton);

  const cancelButton = document.createElement('button');
  cancelButton.innerText = 'Cancel';
  cancelButton.addEventListener('click', onCancel);
  dom.appendChild(cancelButton);

  return dom;
};

// TODO: pretty sure this should be replaced with encodePath
function buildPathStr(path) {
  return '/' + path.join('/');
}


function encodePath(path) {
  return path.length === 1 ? '/' + path[0] : '/' + path.join('/');
}

function parsePath(rawPath) {
  if (rawPath[0] !== '/') {
    throw new Error("path must start with '/'");
  }

  if (rawPath === '/') {
    return [];
  }

  // chop off leading /
  const path = rawPath.split('/').slice(1);
  return path;
}

function parseCookies() {
  const cookieMap = {};
  document.cookie
    .split(';')
    .map(c => c.trim())
    .map(c => c.split('='))
    .forEach(c => {
      cookieMap[c[0]] = c[1];
    });
  return cookieMap;
}

const root = document.getElementById('root');
m.route(root, '/',{
  '/': Home,
});
