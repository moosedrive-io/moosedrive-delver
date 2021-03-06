import {
  DeleteButton, UploadButton, UploadButtonNew, NewFolderButton
} from './components/buttons.js';
import { ItemContent } from './components/item.js';
import m from 'mithril';
import rein from '@anderspitman/reinstate';


const ITEM_TYPE_DIR = 'dir';
const ITEM_TYPE_FILE = 'file';


const State = {
};

let reinstate;


function handleManfsUpdate(message) {

  const update = JSON.parse(message);

  console.log(update);

  if (!reinstate) {
    reinstate = rein.fromObject({ root: update.meta });
  }

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

  //else if (data.action.type === 'append') {
  //  curPath[key].push(data.action.viewerId);
  //}
  if (update.type === 'create') {
    curPath.children[key] = update.meta;
  }
  else if (update.type === 'update') {
    curPath.children[key] = update.meta;
  }
  else if (update.type === 'delete') {
    delete curPath.children[key];
  }

  m.redraw();
}


function get(pathStr) {
  const path = parsePath(pathStr);

  let curPath = reinstate.root;

  while (path.length > 0) {
    const part = path[0];

    curPath = curPath.children[part];
    path.shift();
  }

  return curPath;
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

        const manfs = new EventSource('/manfs.json?events=true');

        manfs.addEventListener('message', (e) => {
          const message = JSON.parse(e.data);
          console.log("message", message);
        });

        manfs.addEventListener('create', (e) => {
          handleManfsUpdate(e.data);
        });

        manfs.addEventListener('delete', (e) => {
          handleManfsUpdate(e.data);
        });

        manfs.addEventListener('update', (e) => {
          handleManfsUpdate(e.data);
        });

      })();
    },

    oncreate: (vnode) => {

      vnode.dom.addEventListener('set-public-view', async (e) => {
        // TODO: re-implement setting recursively

        const pathStr = buildPathStr(e.detail.path);

        await fetch(pathStr + "/manfs.json", {
          method: 'PUT',
          body: JSON.stringify({
            permissions: {
              publicView: e.detail.value,
            },
          }),
          headers: {
            'Content-Type': 'application/json'
          },
        });
      });

      vnode.dom.addEventListener('add-viewer', (e) => {
        // TODO: implement in manfs
        //State.client.addViewer(buildPathStr(e.detail.path), e.detail.viewerId);
      });

      vnode.dom.addEventListener('upload-file', async (e) => {
        const path = [...e.detail.path, e.detail.file.name];
        const pathStr = encodePath(path);
        await fetch(pathStr, {
          method: 'PUT',
          body: e.detail.file,
        });
      });

      vnode.dom.addEventListener('upload-text-file', async (e) => {
        const path = e.detail.path;
        const pathStr = encodePath(path);
        await fetch(pathStr, {
          method: 'PUT',
          body: e.detail.text,
        });
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

        paths.forEach(async (path) => {
          await fetch(path, {
            method: 'DELETE',
          });
        });

        checkedItems = {};
      });

      vnode.dom.addEventListener('create-folder', async (e) => {
        await fetch(encodePath(e.detail.path) + "?dir=true", {
          method: 'PUT',
        });
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

const ItemContentMithril = () => {
  return {
    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: (vnode) => {
      vnode.dom.appendChild(ItemContent(vnode.attrs.path, vnode.attrs.data, vnode.attrs.remoAddr));
    },

    view: (vnode) => {
      return m('.item-content-mithril');
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
