import { DeleteButton, OpenExternalButton } from './buttons.js';
import m from 'mithril';
import { getType as getMime } from 'mime';

import rein from 'rein-state';
import h from 'hyperscript';


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
              key,
              state: vnode.attrs.state.children[key],
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
  let path;

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
      path = vnode.attrs.path.concat([name]);
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
              m(Directory,
                {
                  state: vnode.attrs.state,
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
              },
            },
            m('i.btn.item__btn.fas.fa-user-friends'),
          ),
          m('span.item__tags-btn',
            {
              title: "Tags",
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
              state: vnode.attrs.state,
              item: vnode.attrs.data,
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
            vnode.attrs.item.permissions ?
              m(PermissionsEditAdapter,
                {
                  state: vnode.attrs.state,
                  permissions: vnode.attrs.item.permissions,
                },
              )
            :
            null,
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


const PermissionsEditAdapter = () => {
  return {

    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: (vnode) => {
      vnode.dom.appendChild(PermissionsEdit(vnode.attrs.state));
    },

    view: (vnode) => {
      return m('.public-view-selector-adapter');
    }
  };
};

const PermissionsEdit = (state) => {

  let viewerText = "";

  const permissions = state.permissions;
  const viewers = state.permissions.viewers;
  const editors = state.permissions.editors;

  function Viewer(state) {
    return h('.permissions-edit__viewers-list__viewer',
      state 
    );
  }

  const viewersDom = h('.permissions-edit__viewers-list__viewers',
    viewers ? viewers.map((viewer) => {
      return Viewer(viewer);
    }) : null,
  );

  if (viewers) {
    rein.onPush(viewers, (val) => {
      viewersDom.appendChild(Viewer(val));
    });
  }

  const dom = h('.permissions-edit',
    PublicViewSelector(permissions),
    h('.permissions-edit__viewers-list',
      "Viewers:",
      viewersDom,
      h('div',
        h('i.fas.fa-plus-circle',
          {
            onclick: (e) => {
              dom.dispatchEvent(new CustomEvent('add-viewer', {
                bubbles: true,
                detail: {
                  viewerId: viewerText,
                },
              }));
            },
          }
        ),
        h('input',
          {
            type: 'text',
            onkeyup: (e) => {
              viewerText = e.target.value;
            },
          },
        ),
      ),
    ),
    h('.permissions-edit__editors-list',
      "Editors:",
      editors ?
        editors.map((editor) => {
          return h('.permissions-edit__editors-list__editor',
            "editor",
          );
        })
      :
      null
    ),
  );


  dom.addEventListener('selected', (e) => {

    e.stopPropagation();

    const detail = {
      value: e.detail.checked,
      recursive: true,
    };

    dom.dispatchEvent(new CustomEvent('set-public-view', {
      bubbles: true,
      detail,
    }));
  });

  return dom;
};


const PublicViewSelector = (state) => {

  const s = h('span.s', 
    {
      style: `display: ${state.publicView ? 'inline' : 'none'};`,
    },
    "S"
  );

  const dom = h('.public-view-selector',
    "Public view?",
    h('input.public-view-selector__checkbox',
      {
        type: 'checkbox',
        checked: state.publicView,
        onchange: (e) => {

          dom.dispatchEvent(new CustomEvent('selected', {
            bubbles: true,
            detail: {
              checked: e.target.checked,
            },
          }));
        },
      },
    ),
    s,
  );

  rein.onUpdated(state, 'publicView', (val) => {
    s.style.display = val ? 'inline' : 'none';
  });

  return dom;
};


export {
  Directory,
};
