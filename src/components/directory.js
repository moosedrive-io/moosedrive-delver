import m from 'mithril';
import h from 'hyperscript';
import rein from 'rein-state';
import { OpenExternalButton, NewFolderButton, DownloadButton, IconButton } from './buttons.js';
import { Preview } from './preview.js';
import { ItemSettings } from './item_settings.js';
import { TextFileEditor } from './text_editor.js';
import { getType as getMime } from 'mime';
import Uppie from 'uppie';


const DirectoryAdapter = () => {

  return {
    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: (vnode) => {
      vnode.dom.appendChild(ReinDirectory(vnode.attrs.path, vnode.attrs.data, vnode.attrs.appState));
    },

    view: (vnode) => {
      return m('.directory-adapter');
    }
  };
};


const ReinDirectory = (path, data, renderState) => {
  // this is used to achieve a "natural sort". see
  // https://stackoverflow.com/a/38641281/943814
  const naturalSorter = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
  });

  let sortedNames = Object.keys(data).sort(naturalSorter.compare);

  //const Item = (name) => {
  //  return h('.item', name);
  //};

  const itemsElem = h('.directory__items',
    sortedNames.map((name) => {
      return ItemMithrilAdapter(path.concat([name]), data[name], renderState);
    }),
  );

  const dom = h('.directory',
    h('.directory__separator',
      path.length > 0 ? '/' + path.join('/') + '/' : '/',
    ),
    itemsElem,
    h('.directory__separator',
      path.length > 1 ? '/' + path.slice(0, -1).join('/') + '/' : '/',
    ),
  );

  rein.onAdd(data, (name) => {

    // TODO: could do a binary insertion to be more efficient, rather than
    // resorting the whole list
    sortedNames = Object.keys(data).sort(naturalSorter.compare);

    const index = sortedNames.indexOf(name);

    if (index > -1) {
      itemsElem.insertBefore(ItemMithrilAdapter(path.concat([name]), data[name], renderState), itemsElem.childNodes[index]);
    }
    else {
      throw new Error("Directory DOM insert fail");
    }
  });

  rein.onDelete(data, (name) => {

    const index = sortedNames.indexOf(name);
    sortedNames.splice(index, 1);
    itemsElem.removeChild(itemsElem.childNodes[index]);
  });

  return dom;
};


const ItemMithrilAdapter = (path, data, appState) => {

  const dom = h('.item-mithril-adapter');

  const name = path[path.length - 1];

  function Wrapper() {
    return {
      view: (vnode) => {
        return m(Item,
          {
            state: data,
            appState,
            path,
            remoAddr: appState.remoAddr,
            name,
            data,
            onDelete: () => {
              dom.dispatchEvent(new CustomEvent('delete-item', {
                bubbles: true,
                detail: {
                  path,
                },
              }));
            },
          }
        )
      },
    };
  }

  m.mount(dom, Wrapper);

  return dom;
};

const Item = () => {

  let state = 'minimized';
  let settingsSelected = null;
  let path;

  const renderState = rein.fromObject({
    settings: {
      selected: false,
    },
  });

  return {

    oncreate: (vnode) => {

      const uppie = new Uppie();

      const handleFiles = async (e, formData, filenames) => {
        for (const param of formData) {
          const file = param[1];

          const filenameParts = file.name.split('/');
          const dir = [...path, ...filenameParts.slice(0, -1)];
          const filename = filenameParts[filenameParts.length - 1];
          vnode.dom.dispatchEvent(new CustomEvent('upload-file', {
            bubbles: true,
            detail: {
              path,
              file,
            },
          }));
        }
      };

      const fileInput = InvisibleFileInput(path);
      uppie(fileInput, handleFiles);
      vnode.dom.appendChild(fileInput);
      
      const folderInput = InvisibleFolderInput(path);
      uppie(folderInput, handleFiles);
      vnode.dom.appendChild(folderInput);


      vnode.dom.addEventListener('set-public-view', (e) => {
        // modify the event in place
        if (e.detail.path === undefined) {
          e.detail.path = path;
        }
      });

      vnode.dom.addEventListener('add-viewer', (e) => {
        if (e.detail.path === undefined) {
          e.detail.path = path;
        }
      });

      vnode.dom.addEventListener('upload-text-file', (e) => {
        if (e.detail.path === undefined) {
          e.detail.path = [...path, e.detail.filename];
        }
      });

      vnode.dom.addEventListener('exit', (e) => {
        state = 'minimized';
        m.redraw();
        e.stopPropagation();
      });

      vnode.dom.addEventListener('permissions-selected', (e) => {
        settingsSelected = settingsSelected === 'permissions' ? null : 'permissions';
        renderState.settings.selected = renderState.settings.selected === 'permissions' ? null : 'permissions';
        e.stopPropagation();
      });

      vnode.dom.addEventListener('tags-selected', (e) => {
        renderState.settings.selected = renderState.settings.selected === 'tags' ? null : 'tags';
        e.stopPropagation();
      });

      vnode.dom.addEventListener('choose-upload-files', (e) => {
        
        fileInput.click();
        e.stopPropagation();
      });

      vnode.dom.addEventListener('choose-upload-folder', (e) => {
        folderInput.click();
        e.stopPropagation();
      });
    },

    view: (vnode) => {

      const name = vnode.attrs.name;
      const type = vnode.attrs.data.type;
      path = vnode.attrs.path;
      const pathStr = path.join('/')
      const url = encodeURI(vnode.attrs.remoAddr + '/' + pathStr);
      const item = vnode.attrs.data;

      let icon;
      if (type === 'file') {
        icon = 'i.fas.fa-file';
      }
      else {
        icon = 'i.fas.fa-folder';
      }

      const headerClasses = '.item__header' + (state === 'expanded' ? '.item__header--expanded' : '');

      return m('.item',
        m(headerClasses,
          { 
            onclick: (e) => {
              state = state === 'minimized' ? 'expanded' : 'minimized';
            },
          },
          m('input.item__checkbox', 
            {
              type: 'checkbox',
              onclick: (e) => {
                e.stopPropagation();
              },
              onchange: (e) => {
                vnode.dom.dispatchEvent(new CustomEvent('item-check-changed', {
                  bubbles: true,
                  detail: {
                    path,
                    checked: e.target.checked,
                    item,
                  },
                }));
              },
            }),
          m(icon),
          m('span.item__name', name),
          m('span.item__public-icon',
            item.permissions && item.permissions.publicView ?
            m('i.fas.fa-eye',
              {
                title: "Publicly visible",
              }
            )
            :
            null
          ),
        ),
        state === 'expanded' ? m(ItemControlsMithril,
          {
            item,
            url,
            path: vnode.attrs.path,
          }
        )
        :
        null,
        m('.item__settings',
          m(ItemSettingsAdapter,
            {
              data: vnode.attrs.state,
              renderState: renderState.settings,
            },
          ),
        ),
        m(Preview,
          {
            state,
            type,
            name,
            url,
            path: vnode.attrs.path,
            data: vnode.attrs.state.children,
            appState: vnode.attrs.appState,
          },
        ),
      );
    },
  };
};

const ItemControlsMithril = () => {
  return {
    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: (vnode) => {
      const itemControls = ItemControls(vnode.attrs.item, vnode.attrs.url, vnode.attrs.path);
      vnode.dom.appendChild(itemControls);
    },

    view: (vnode) => {
      return m('.item-controls-mithril');
    }
  };
};


const ItemControls = (item, url, path) => {
  const dom = document.createElement('div');
  dom.classList.add('item-controls');

  let content = null;

  const header = document.createElement('div');
  header.classList.add('item-controls__header');
  dom.appendChild(header);

    function clearContent() {
      if (content) {
        dom.removeChild(content);
        content = null;
      }
    }

  if (item.type === 'dir') {

    const addFileButton = IconButton(['fas', 'fa-plus']);
    addFileButton.addEventListener('click', (e) => {

      clearContent();

      content = TextFileEditor();
      content.addEventListener('save', (e) => {
        if (!e.detail.filename) {
          alert("Must provide filename");
        }
        else {
          dom.dispatchEvent(new CustomEvent('upload-text-file', {
            bubbles: true,
            detail: e.detail,
          }));
        }
      });
      content.addEventListener('exit', (e) => {
        clearContent();
      });
      dom.appendChild(content);
    });
    header.appendChild(addFileButton);

    const newFolderButton = NewFolderButton();
    newFolderButton.addEventListener('click', (e) => {
      clearContent();

      function submit(name) {
        dom.dispatchEvent(new CustomEvent('create-folder', {
          bubbles: true,
          detail: {
            path: [...path, name],
          },
        }));

        clearContent();
      }

      const cancel = clearContent;

      content = NewFolderNameInput('/', submit, cancel);
      dom.appendChild(content);
    });
    header.appendChild(newFolderButton);
  }
  else if (item.type === 'file') {
    const openExternalButton = OpenExternalButton(url);
    header.appendChild(openExternalButton);
  }

  const tagsButton = IconButton(['btn', 'item__btn', 'fas', 'fa-tags']);
  tagsButton.setAttribute('title', "Tags");
  tagsButton.addEventListener('click', (e) => {
    dom.dispatchEvent(new CustomEvent('tags-selected', {
      bubbles: true,
    }));
  });
  header.appendChild(tagsButton);

  const permButton = IconButton(['btn', 'item__btn', 'fas', 'fa-user-friends']);
  permButton.addEventListener('click', (e) => {
    dom.dispatchEvent(new CustomEvent('permissions-selected', {
      bubbles: true,
    }));
  });
  header.appendChild(permButton);

  const uploadButton = IconButton(['fas', 'fa-cloud-upload-alt']);
  uploadButton.addEventListener('click', (e) => {
    clearContent();

    content = h('.upload-chooser',
      h('button',
        {
          onclick: (e) => {
            dom.dispatchEvent(new CustomEvent('choose-upload-files', {
              bubbles: true,
            }));
            clearContent();
          }
        },
        "File(s)",
      ),
      h('button',
        {
          onclick: (e) => {
            dom.dispatchEvent(new CustomEvent('choose-upload-folder', {
              bubbles: true,
            }));
            clearContent();
          }
        },
        "Folder",
      ),
    );
    dom.appendChild(content);
  });
  header.appendChild(uploadButton);

  const downloadLink = DownloadButton(item.type, url);
  header.appendChild(downloadLink);

  return dom;
};


const ItemSettingsAdapter = () => {
  return {
    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: (vnode) => {
      vnode.dom.appendChild(ItemSettings(vnode.attrs.data, vnode.attrs.renderState));
    },

    view: (vnode) => {
      return m('.item-settings-adapter');
    }
  };
};


const InvisibleFileInput = (path) => {
  const fileInput = document.createElement('input');
  fileInput.classList.add('upload-button__input');
  fileInput.setAttribute('type', 'file');
  fileInput.setAttribute('multiple', true);
  return fileInput;
};


const InvisibleFolderInput = (path) => {
  const folderInput = document.createElement('input');
  folderInput.classList.add('upload-button__input');
  folderInput.setAttribute('type', 'file');
  folderInput.setAttribute('directory', true);
  folderInput.setAttribute('webkitdirectory', true);
  folderInput.setAttribute('mozdirectory', true);
  return folderInput;
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

export {
  DirectoryAdapter,
};
