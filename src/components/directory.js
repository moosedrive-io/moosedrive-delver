import m from 'mithril';
import h from 'hyperscript';
import rein from 'rein-state';
import { OpenExternalButton, DownloadButton, IconButton } from './buttons.js';
import { Preview } from './preview.js';
import { ItemSettings } from './item_settings.js';
import { TextFileEditor } from './text_editor.js';
import { getType as getMime } from 'mime';


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
      
      const fileInput = InvisibleFileInput(path);
      vnode.dom.appendChild(fileInput);
      
      const folderInput = InvisibleFolderInput(path);
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

      vnode.dom.addEventListener('choose-upload-file', (e) => {
        
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
      const itemControls = ItemControls(vnode.attrs.item, vnode.attrs.url);
      vnode.dom.appendChild(itemControls);
    },

    view: (vnode) => {
      return m('.item-controls-mithril');
    }
  };
};


const ItemControls = (item, url) => {
  const dom = document.createElement('div');
  dom.classList.add('item-controls');

  let content = null;

  const header = document.createElement('div');
  header.classList.add('item-controls__header');
  dom.appendChild(header);

  if (item.type === 'dir') {

    const addFileButton = IconButton(['fas', 'fa-plus']);
    addFileButton.addEventListener('click', (e) => {
      if (content) {
        dom.removeChild(content);
        content = null;
      }

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
        dom.removeChild(content);
        content = null;
      });
      dom.appendChild(content);
    });
    header.appendChild(addFileButton);
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
    if (content) {
      dom.removeChild(content);
      content = null;
    }

    content = h('.upload-chooser',
      h('button',
        {
          onclick: (e) => {
            dom.dispatchEvent(new CustomEvent('choose-upload-file', {
              bubbles: true,
            }));
            dom.removeChild(content);
            content = null;
          }
        },
        "File",
      ),
      h('button',
        {
          onclick: (e) => {
            dom.dispatchEvent(new CustomEvent('choose-upload-folder', {
              bubbles: true,
            }));
            dom.removeChild(content);
            content = null;
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
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    fileInput.dispatchEvent(new CustomEvent('upload-file', {
      bubbles: true,
      detail: {
        path,
        file,
      },
    }));
  });
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
  folderInput.addEventListener('change', (e) => {
    console.log(e.target.files);
    //const file = e.target.files[0];
    //vnode.dom.dispatchEvent(new CustomEvent('upload-file', {
    //  bubbles: true,
    //  detail: {
    //    path,
    //    file,
    //  },
    //}));
  });
  return folderInput;
};

export {
  DirectoryAdapter,
};
