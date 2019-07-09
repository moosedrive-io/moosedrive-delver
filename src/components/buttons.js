import m from 'mithril';


function DeleteButton() {
  return {
    view: (vnode) => {
      return m(ChoiceButton,
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

function ChoiceButton() {

  let state = 'unselected';

  return {
    view: (vnode) => {
      return m('span.btn.choice-btn',
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
        m('span.choice-btn__confirm',
          {
            onclick: (e) => {
              e.stopPropagation();
              e.preventDefault();
            }
          },
          vnode.attrs.promptText,
          m('button.choice-btn__option1-btn',
            {
              onclick: (e) => {
                vnode.attrs.onOption1();
                state = 'unselected';
              }
            },
            vnode.attrs.option1Text,
          ),
          vnode.attrs.option2Text ?
            m('button.choice-btn__option2-btn',
              {
                onclick: (e) => {
                  vnode.attrs.onOption2();
                  state = 'unselected';
                }
              },
              vnode.attrs.option2Text
          )
          :
          null
          ,
          m('button.choice-btn__cancel-btn',
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


export {
  ChoiceButton,
  DeleteButton,
  OpenExternalButton,
  UploadButton,
};
