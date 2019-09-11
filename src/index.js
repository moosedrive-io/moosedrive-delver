import { ClientBuilder } from 'remoose-client';
import { decodeObject } from 'omnistreams';
import {
  DeleteButton, UploadButton, UploadButtonNew, NewFolderButton
} from './components/buttons.js';
import { DirectoryAdapter } from './components/directory.js';
import m from 'mithril';
import rein from 'rein-state';


const ITEM_TYPE_DIR = 'dir';
const ITEM_TYPE_FILE = 'file';


const State = {
};

let reinstate;

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

  if (numItems === 1) {
    const pathStr = keys[0];
    const item = checkedItems[pathStr];

    if (item.type === ITEM_TYPE_DIR) {
      
      buttonContainer.appendChild(NewFolderButton());

      buttonContainer.addEventListener('new-folder-button-click', (e) => {

        if (editBox === null) {
          editBox = document.createElement('div');
          editBox.classList.add('control-bar__folder-name-input');
          dom.appendChild(editBox);

          async function submitName(name) {
            const folderPath = pathStr + '/' + name;
            const result = await State.client.createFolder(folderPath);
            dom.removeChild(editBox);
            editBox = null;
          }

          function cancel() {
            dom.removeChild(editBox);
            editBox = null;
          }

          editBox.appendChild(NewFolderNameInput(pathStr, submitName, cancel));
        }
      });
    }
    else {
      dom.innerText = 'file';
    }
  }

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


const NewFolderNameInput = (parentPath, onSubmit, onCancel) => {
  const dom = document.createElement('div');
  dom.classList.add('new-folder-name-input');
  const prompt = document.createElement('div');
  prompt.innerText = `Creating new folder in ${parentPath}/`;
  dom.appendChild(prompt);
  dom.appendChild(NameInput(onSubmit, onCancel));
  return dom;
};

const NameInput = (onSubmit, onCancel) => {
  const nameInput = document.createElement('div');
  nameInput.classList.add('name-input');

  const promptText = document.createElement('div');
  promptText.innerText = "Enter name:";
  nameInput.appendChild(promptText);

  let text = "";

  const namerText = document.createElement('input');
  namerText.setAttribute('type', 'text');
  namerText.addEventListener('keyup', (e) => {
    text = e.target.value;
  });
  nameInput.appendChild(namerText);

  const submitButton = document.createElement('button');
  submitButton.innerText = "Submit";
  submitButton.addEventListener('click', (e) => {
    if (text.length > 0) {
      onSubmit(text);
    }
    else {
      alert("must enter a name to submit");
    }
  });
  nameInput.appendChild(submitButton);

  const cancelButton = document.createElement('button');
  cancelButton.innerText = "Cancel";
  cancelButton.addEventListener('click', (e) => {
    onCancel();
  });
  nameInput.appendChild(cancelButton);

  return nameInput;
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
