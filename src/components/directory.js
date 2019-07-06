import m from 'mithril';
import h from 'hyperscript';
import rein from 'rein-state';
import { DeleteButton, OpenExternalButton } from './buttons.js';
import { ItemSettings } from './item_settings.js';
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
    h('.directory__header',
      '/' + path.join('/'),
    ),
    itemsElem,
    h('.directory__spacer',
      //'/' + vnode.attrs.path.join('/'),
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
    itemsElem.childNodes[index].remove();
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

  let state = 'compact';
  let settingsSelected = null;
  let path;

  const renderState = rein.fromObject({
    settings: {
      selected: false,
    },
  });

  return {

    oncreate: (vnode) => {
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
    },

    view: (vnode) => {

      const name = vnode.attrs.name;
      const type = vnode.attrs.data.type;
      path = vnode.attrs.path;
      const pathStr = path.join('/')
      const url = encodeURI(vnode.attrs.remoAddr + '/' + pathStr);
      const item = vnode.attrs.data;

      let icon;
      let openExternalButton = null;
      if (type === 'file') {
        icon = 'i.fas.fa-file';
        openExternalButton = m('.item__header__open-external-btn',
          {
            title: "Open in tab",
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

            if (!mime || mime.startsWith('text/') || mime === 'application/javascript') {
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
              m(DirectoryAdapter,
                {
                  path: vnode.attrs.path,
                  data: vnode.attrs.state.children,
                  appState: vnode.attrs.appState,
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
          m(DeleteButton,
            {
              onDelete: () => {
                vnode.attrs.onDelete();
              },
            }
          ),
          m('a.file',
            {
              title: "Download",
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
              title: "Sharing is caring",
              onclick: (e) => {
                e.stopPropagation();
                settingsSelected = settingsSelected === 'permissions' ? null : 'permissions';
                renderState.settings.selected = renderState.settings.selected === 'permissions' ? null : 'permissions';
              },
            },
            m('i.btn.item__btn.fas.fa-user-friends'),
          ),
          m('span.item__tags-btn',
            {
              title: "Tags",
              onclick: (e) => {
                e.stopPropagation();
                renderState.settings.selected = renderState.settings.selected === 'tags' ? null : 'tags';
              },
            },
            m('i.btn.item__btn.fas.fa-tags'),
          ),
          openExternalButton,
        ),
        m('.item__settings',
          m(ItemSettingsAdapter,
            {
              data: vnode.attrs.state,
              renderState: renderState.settings,
            },
          ),
        ),
        preview,
      );
    },
  };
};


const TextPreview = () => {

  let text = "";

  return {
    oninit: async (vnode) => {
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


export {
  DirectoryAdapter,
};
