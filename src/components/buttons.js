import m from 'mithril';


const IconButton = (iconClasses) => {
  const dom = document.createElement('span');
  dom.classList.add('icon-button');
  const icon = document.createElement('i');
  iconClasses.forEach(c => {
    icon.classList.add(c);
  });

  dom.appendChild(icon);

  console.log(dom);

  return dom;
};

const DeleteButton = () => {
  return IconButton(['fas', 'fa-times']);
};

function DeleteButtonMithril() {
  return {
    view: (vnode) => {
      return m(MultiOptionChooser,
        {
          iconClasses: '.fas.fa-times',
          hoverText: "Delete",
          promptText: "Really delete?",
          option1Text: "Yes",
          onOption1: () => {
            vnode.attrs.onDelete();
          },
          onOption2: () => {
          },
          onCancel: () => {
          },
        },
      );
    },
  };
}

function MultiOptionChooser() {

  let state = 'unselected';

  return {
    view: (vnode) => {
      return m('span.btn.multi-option-chooser',
        m('i' + vnode.attrs.iconClasses,
          { 
            title: vnode.attrs.hoverText,
            onclick: (e) => {
              state = 'confirm';
              e.stopPropagation();
              e.preventDefault();
            },
          },
        ),
        state === 'unselected' ?
        null
        :
        m('span.multi-option-chooser__confirm',
          {
            onclick: (e) => {
              e.stopPropagation();
              e.preventDefault();
            }
          },
          vnode.attrs.promptText,
          m('button.multi-option-chooser__option1-btn',
            {
              onclick: (e) => {
                vnode.attrs.onOption1();
                state = 'unselected';

                e.stopPropagation();
                e.preventDefault();
              }
            },
            vnode.attrs.option1Text,
          ),
          vnode.attrs.option2Text ?
            m('button.multi-option-chooser__option2-btn',
              {
                onclick: (e) => {
                  vnode.attrs.onOption2();
                  state = 'unselected';

                  console.log("oh it clicked");
                  e.stopPropagation();
                  e.preventDefault();
                }
              },
              vnode.attrs.option2Text
          )
          :
          null
          ,
          m('button.multi-option-chooser__cancel-btn',
            {
              onclick: (e) => {
                vnode.attrs.onCancel();
                state = 'unselected';
              }
            },
            "Cancel",
          ),
        ),
      );
    },
  };
}

function OpenExternalButton() {
  return {
    view: (vnode) => {
      return m('a.btn.open-external-btn',
        { 
          href: vnode.attrs.url,
          target: '_blank',
          //onclick: (e) => {
          //  //e.preventDefault();
          //},
        },
        m('i.fas.fa-external-link-alt'),
      );
    },
  };
}


function UploadButton() {

  let fileUploadElem;
  let folderUploadElem;

  return {
    oncreate: (vnode) => {
      fileUploadElem = vnode.dom.querySelector('#file-input');
      fileUploadElem.addEventListener('change', (e) => {
        vnode.attrs.onSelection(e);
      });
      fileUploadElem.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      folderUploadElem = vnode.dom.querySelector('#folder-input');
      folderUploadElem.addEventListener('change', (e) => {
        console.log(e);
        //vnode.attrs.onSelection(e);
      });
      folderUploadElem.addEventListener('click', (e) => {
        e.stopPropagation();
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
        m(MultiOptionChooser,
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


const UploadButtonNew = () => {
  const dom = document.createElement('span');

  const fileInput = document.createElement('input');
  fileInput.classList.add('upload-button__input');
  fileInput.setAttribute('type', 'file');
  fileInput.setAttribute('multiple', true);
  dom.appendChild(fileInput);

  const folderInput = document.createElement('input');
  folderInput.classList.add('upload-button__input');
  folderInput.setAttribute('type', 'file');
  folderInput.setAttribute('directory', true);
  folderInput.setAttribute('webkitdirectory', true);
  folderInput.setAttribute('mozdirectory', true);
  dom.appendChild(folderInput);

  const uploadIcon = document.createElement('i');
  uploadIcon.classList.add('btn', 'fas', 'fa-cloud-upload-alt');
  uploadIcon.addEventListener('click', (e) => {
    console.log("es clicky");
  });
  dom.appendChild(uploadIcon);

  return dom;
};


const NewFolderButton = () => {
  const dom = document.createElement('span');

  const icon = document.createElement('i');
  icon.classList.add('icon-button', 'fas', 'fa-folder-plus');
  icon.addEventListener('click', (e) => {
    dom.dispatchEvent(new CustomEvent('new-folder-button-click', {
      bubbles: true,
    }));
  });
  dom.appendChild(icon);

  return dom;
};


export {
  MultiOptionChooser,
  DeleteButton,
  DeleteButtonMithril,
  OpenExternalButton,
  UploadButton,
  UploadButtonNew,
  NewFolderButton,
};
