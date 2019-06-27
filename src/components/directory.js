import { DeleteButton, OpenExternalButton } from './buttons.js';
import m from 'mithril';
import { getType as getMime } from 'mime';


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
              addViewer: (path, viewerId) => {
                vnode.attrs.addViewer([key].concat(path), viewerId);
              },
              setPublicView: (path, value) => {
                vnode.attrs.setPublicView([key].concat(path), value);
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

          const mime = getMime(name);

          if (type === 'file') {

            if (mime.startsWith('text/') || mime === 'application/javascript') {
              previewContent = m('.item__preview__text',
                m(TextPreview,
                  {
                    url,
                  },
                ),
              );
            }
            else if (mime.startsWith('image/')) {
              previewContent = m('.item__preview__image__container',
                m('img.item__preview__image',
                  {
                    src: url,
                  },
                ),
              );
            }
            else {
              previewContent = "Hi there";
            }
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
                  addViewer: (path, viewerId) => {
                    vnode.attrs.addViewer(path, viewerId);
                  },
                  setPublicView: (path, value) => {
                    vnode.attrs.setPublicView(path, value);
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
              item: vnode.attrs.data,
              selected: settingsSelected,
              addViewer: (viewerId) => {
                vnode.attrs.addViewer([], viewerId);
              },
              setPublicView: (value) => {
                vnode.attrs.setPublicView([], value);
              },
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
            m(PermissionsEdit,
              {
                permissions: vnode.attrs.item.permissions,
                addViewer: vnode.attrs.addViewer,
                setPublicView: vnode.attrs.setPublicView,
              },
            ),
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


const TextPreview = () => {

  let text = "";

  return {
    oninit: async (vnode) => {
      console.log(vnode.attrs.url);
      const responseText = await m.request({
        url: vnode.attrs.url,
        withCredentials: true,
        responseType: 'text',
      });

      text = responseText;
    },

    view: (vnode) => {
      return m('textarea.text-preview',
        text,
      );
    },
  };
};


const PermissionsEdit = () => {

  let viewerText = "";

  return {
    view: (vnode) => {

      const permissions = vnode.attrs.permissions ? vnode.attrs.permissions : {};
      const viewers = permissions.viewers;
      const editors = permissions.editors;

      return m('.permissions-edit',
        m(PublicViewSelector,
          {
            setSelected: vnode.attrs.setPublicView,
          }
        ),
        m('.permissions-edit__viewers-list',
          "Viewers:",
          viewers ?
            viewers.map((viewer) => {
              return m('.permissions-edit__viewers-list__viewer',
                viewer
              );
            })
          :
          null,
          m('div',
            m('i.fas.fa-plus-circle',
              {
                onclick: (e) => {
                  vnode.attrs.addViewer(viewerText);
                },
              }
            ),
            m('input',
              {
                type: 'text',
                onkeyup: (e) => {
                  viewerText = e.target.value;
                },
              },
            ),
          ),
        ),
        m('.permissions-edit__editors-list',
          "Editors:",
          editors ?
            editors.map((editor) => {
              return m('.permissions-edit__editors-list__editor',
                "editor",
              );
            })
          :
          null
        ),
      );
    },
  };
};


const PublicViewSelector = () => {
  return {
    view: (vnode) => {
      return m('.public-view-selector',
        "Public view?",
        m('input.public-view-selector__checkbox',
          {
            type: 'checkbox',
            onchange: (e) => {
              vnode.attrs.setSelected(e.target.checked);
            },
          },
        ),
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
