function DeleteButton() {
  return {
    view: (vnode) => {
      return m(ChoiceButton,
        {
          iconClasses: '.fas.fa-times',
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

export {
  ChoiceButton,
  DeleteButton
};
