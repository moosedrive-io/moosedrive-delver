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

      let content;

      switch (state) {
        case 'compact':
          content = null;
          break;
        case 'expanded':
          if (type === 'file') {
            content = m('div',
              "file"
            );
          }
          else {
            content = m(Directory,
              {
                path: vnode.attrs.path.concat(name),
                remoAddr: vnode.attrs.remoAddr,
                items: vnode.attrs.data.children,
                clicked: (key) => {
                  console.log("es worky");
                },
              },
            );
          }
          break;
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
                //vnode.attrs.ondownload();
              },
            },
            m('i.btn.item__download_btn.fas.fa-download'),
          ),
          openExternalButton,
        ),
        content,
      );
    },
  };
};

export {
  Directory,
};
