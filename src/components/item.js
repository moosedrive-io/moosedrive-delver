import h from 'hyperscript';
import { OpenExternalButton, NewFolderButton, DownloadButton, IconButton } from './buttons.js';
import { Preview } from './preview.js';
import Uppie from 'uppie';
import { ItemSettings } from './item_settings.js';
import { TextFileEditor } from './text_editor.js';


const Item = (path, data, state, remoAddr) => {

  let settingsSelected = null;

  const dom = document.createElement('div');
  const renderState = state;

  const uppie = new Uppie();

  const handleFiles = async (e, formData, filenames) => {
    for (const param of formData) {
      const file = param[1];

      const filenameParts = file.name.split('/');
      const dir = [...path, ...filenameParts.slice(0, -1)];
      const filename = filenameParts[filenameParts.length - 1];
      dom.dispatchEvent(new CustomEvent('upload-file', {
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
  dom.appendChild(fileInput);
  
  const folderInput = InvisibleFolderInput(path);
  uppie(folderInput, handleFiles);
  dom.appendChild(folderInput);


  dom.addEventListener('set-public-view', (e) => {
    // modify the event in place
    if (e.detail.path === undefined) {
      e.detail.path = path;
    }
  });

  dom.addEventListener('add-viewer', (e) => {
    if (e.detail.path === undefined) {
      e.detail.path = path;
    }
  });

  dom.addEventListener('upload-text-file', (e) => {
    if (e.detail.path === undefined) {
      e.detail.path = [...path, e.detail.filename];
    }
  });

  dom.addEventListener('exit', (e) => {
    e.stopPropagation();
    renderState.visualState = 'minimized';
    render();
  });

  dom.addEventListener('permissions-selected', (e) => {
    settingsSelected = settingsSelected === 'permissions' ? null : 'permissions';
    renderState.settings.selected = renderState.settings.selected === 'permissions' ? null : 'permissions';
    e.stopPropagation();
  });

  dom.addEventListener('tags-selected', (e) => {
    renderState.settings.selected = renderState.settings.selected === 'tags' ? null : 'tags';
    e.stopPropagation();
  });

  dom.addEventListener('choose-upload-files', (e) => {
    
    fileInput.click();
    e.stopPropagation();
  });

  dom.addEventListener('choose-upload-folder', (e) => {
    folderInput.click();
    e.stopPropagation();
  });

  dom.addEventListener('item-header-clicked', (e) => {
    e.stopPropagation();
    render();
  });


  const type = data.type;
  const name = path[path.length - 1];
  const pathStr = path.join('/')
  const url = encodeURI(remoAddr + '/' + pathStr);
  const item = data;

  let icon;
  if (type === 'file') {
    icon = 'i.fas.fa-file';
  }
  else {
    icon = 'i.fas.fa-folder';
  }

  function render() {

    const headerClasses = '.item__header' + (renderState.visualState === 'expanded' ? '.item__header--expanded' : '');

    const content = h('.item',
      h(headerClasses,
        { 
          onclick: (e) => {
            renderState.visualState = renderState.visualState === 'minimized' ? 'expanded' : 'minimized';

            dom.dispatchEvent(new CustomEvent('item-header-clicked', {
              bubbles: true,
            }));
          },
        },
        h('input.item__checkbox', 
          {
            type: 'checkbox',
            onclick: (e) => {
              e.stopPropagation();
            },
            onchange: (e) => {
              dom.dispatchEvent(new CustomEvent('item-check-changed', {
                bubbles: true,
                detail: {
                  path,
                  checked: e.target.checked,
                  item,
                },
              }));
            },
          }),
        h(icon),
        h('span.item__name', name),
        h('span.item__public-icon',
          item.permissions && item.permissions.publicView ?
          h('i.fas.fa-eye',
            {
              title: "Publicly visible",
            }
          )
          :
          null
        ),
      ),
      //renderState.visualState === 'expanded' ? ItemControls(item, url, path)
      renderState.visualState === 'expanded' ? ItemContent(path, item, remoAddr)
      :
      null,
      h('.item__settings',
        ItemSettings(data, renderState.settings),
      ),
    );

    if (dom.childNodes[0]) {
      dom.replaceChild(content, dom.childNodes[0]);
    }
    else {
      dom.appendChild(content);
    }
  }

  render();

  return dom;
};


const ItemContent = (path, data, remoAddr) => {
  const dom = document.createElement('div');
  dom.classList.add('item-content');

  const pathStr = path.join('/')
  const url = encodeURI(remoAddr + '/' + pathStr);

  dom.appendChild(ItemControls(data, url, path));
  dom.appendChild(Preview(path, data, remoAddr));
  return dom;
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

  

  const downloadLink = DownloadButton(item.type, url);
  header.appendChild(downloadLink);

  return dom;
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
  Item,
  ItemContent,
};
