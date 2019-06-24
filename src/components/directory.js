import { DeleteButton, OpenExternalButton } from './buttons.js';


function Directory() {
  // this is used to achieve a "natural sort". see
  // https://stackoverflow.com/a/38641281/943814
  const sorter = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
  });

  return {
    view: (vnode) => m('.directory',
      m('.directory__header',
        '/' + vnode.attrs.path.join('/'),
      ),
      Object.keys(vnode.attrs.items).sort(sorter.compare).map((key) => {
        return m('.pure-g',
          m('.pure-u-1', {
              onclick: () => {
                vnode.attrs.clicked(key);
              },
            },
            m(Item, {
              path: vnode.attrs.path,
              remoAddr: vnode.attrs.remoAddr,
              name: key,
              data: vnode.attrs.items[key],
              onDelete: () => {
                vnode.attrs.onDeleteItem(key);
              },
              //ondownload: async () => {

              //  const path = '/' + State.curPath.concat([key]).join('/');
              //  const { result, producer } = await State.client.download(path);

              //  producer.onData((data) => {
              //    console.log("DATA", data.length);
              //    producer.request(1);
              //  });

              //  producer.request(10);
              //},
            }),
          ),
        );
      }),
      m('.directory__spacer',
        //'/' + vnode.attrs.path.join('/'),
      ),
    ),
  };
}

const Item = () => {

  let state = 'compact';
  let settingsSelected = null;

  return {
    view: (vnode) => {

      const name = vnode.attrs.name;
      const type = vnode.attrs.data.type;
      const path = vnode.attrs.path.concat([name]).join('/');
      const url = encodeURI(vnode.attrs.remoAddr + '/' + path);

      let icon;
      let openExternalButton = null;
      if (type === 'file') {
        icon = 'i.fas.fa-file';
        openExternalButton = m('.item__header__open-external-btn',
          {
            onclick: (e) => {
              e.stopPropagation();
            },
          },
          m(OpenExternalButton,
            {
              url,
            }
          ),
        );
      }
      else {
        icon = 'i.fas.fa-folder';
      }

      let preview;

      switch (state) {
        case 'compact':
          preview = null;
          break;
        case 'expanded': {

          let previewContent;

          if (type === 'file') {
            previewContent = m('div',
              "file"
            );
          }
          else {
            previewContent = m('.item__preview__content__directory',
              m(Directory,
                {
                  path: vnode.attrs.path.concat(name),
                  remoAddr: vnode.attrs.remoAddr,
                  items: vnode.attrs.data.children,
                  clicked: (key) => {
                  },
                },
              ),
            );
          }

          preview = m('.item__preview',
            m('.item__preview__content',
              previewContent,
            ),
          );

          break;
        }
        default:
          throw new Error("Invalid state: " + state);
          break;
      }

      return m('.item',
        m('.item__header',
          { 
            onclick: (e) => {
              state = state === 'compact' ? 'expanded' : 'compact';
            },
          },
          m(icon),
          m('span.item__name', name),
          m(DeleteButton,
            {
              onDelete: () => {
                vnode.attrs.onDelete();
              },
            }
          ),
          m('a.file',
            {
              href: url + '?download=true',
              onclick: (e) => {
                e.stopPropagation();
                //vnode.attrs.ondownload();
              },
            },
            m('i.btn.item__btn.fas.fa-download'),
          ),
          m('span.item__permissions-btn',
            {
              onclick: (e) => {
                e.stopPropagation();
                settingsSelected = settingsSelected === 'permissions' ? null : 'permissions';
              },
            },
            m('i.btn.item__btn.fas.fa-key'),
          ),
          m('span.item__tags-btn',
            {
              onclick: (e) => {
                e.stopPropagation();
                settingsSelected = settingsSelected === 'tags' ? null : 'tags';
              },
            },
            m('i.btn.item__btn.fas.fa-tags'),
          ),
          openExternalButton,
        ),
        m('.item__settings',
          m(Settings,
            {
              selected: settingsSelected,
            },
          ),
        ),
        preview,
      );
    },
  };
};


const Settings = () => {

  return {
    view : (vnode) => {

      const selected = vnode.attrs.selected;

      let content = null;

      switch (selected) {
        case 'permissions':
          content = m('.settings__permissions',
            "Edit Permissions",
          );
          break;
        case 'sharing':
          content = m('.settings__sharing',
            "Edit Sharing",
          );
          break;
        case 'tags':
          content = m('.settings__tags',
            "Edit Tags",
          );
          break;
      }

      return m('.settings',
        content
      );
    },
  };
};


//const PreviewHeader = () => {
//
//  let selected = 'preview';
//
//  return {
//    view: (vnode) => {
//      return m('.preview-header',
//        m('span.preview-header__preview-btn',
//          m(TabButton,
//            {
//              text: 'Preview',
//              selected: selected === 'preview',
//              onSelected: () => {
//                selected = 'preview';
//              },
//            },
//          ),
//        ),
//        m('span.preview-header__sharing-btn',
//          m(TabButton,
//            {
//              text: 'Sharing',
//              selected: selected === 'sharing',
//              onSelected: () => {
//                selected = 'sharing';
//              },
//            },
//          ),
//        ),
//      );
//    },
//  };
//};
//
//
//const TabButton = () => {
//  return {
//    view: (vnode) => {
//
//      const selectedClassStr = vnode.attrs.selected ? '.tab-btn--selected' : '';
//
//      return m('button.tab-btn' + selectedClassStr,
//        {
//          onclick: (e) => {
//            vnode.attrs.onSelected();
//          },
//        },
//        vnode.attrs.text,
//      );
//    },
//  };
//};

export {
  Directory,
};
