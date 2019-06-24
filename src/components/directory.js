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
      Object.keys(vnode.attrs.items).sort(sorter.compare).map((key) => {
        return m('.pure-g',
          m('.pure-u-1', {
              onclick: () => {
                vnode.attrs.clicked(key);
              },
            },
            m(Item, {
              curPath: vnode.attrs.curPath,
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
      })
    ),
  };
}

const Item = () => {

  let state = 'compact';

  return {
    view: (vnode) => {
      const name = vnode.attrs.name;
      const type = vnode.attrs.data.type;
      const path = vnode.attrs.curPath.concat([name]).join('/');
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
          content = m('div',
            "Hi there"
          );
          break;
        default:
          throw new Error("Invalid state: " + state);
          break;
      }

      return m('.item',
        m('.item__header',
          { 
            onclick: (e) => {
              if (type === 'file') {
                state = state === 'compact' ? 'expanded' : 'compact';
              }
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

      //if (type === 'file') {
      //  return m('a.file',
      //    { 
      //      href: url,
      //      target: '_blank',
      //      onclick: (e) => {
      //        //e.preventDefault();
      //      },
      //    },
      //    m('.item',
      //      m('i.fas.fa-file'),
      //      m('span.item__name', name),
      //      m(DeleteButton,
      //        {
      //          onDelete: () => {
      //            vnode.attrs.onDelete();
      //          },
      //        }
      //      ),
      //      m('a.file',
      //        {
      //          href: url + '?download=true',
      //          onclick: (e) => {
      //            //vnode.attrs.ondownload();
      //          },
      //        },
      //        m('i.btn.item__download_btn.fas.fa-download'),
      //      ),
      //    ),
      //  );
      //}
      //else {
      //  return m('.item',
      //    m('i.fas.fa-folder'),
      //    m('span.item__name', name),
      //    m(DeleteButton,
      //      {
      //        onDelete: () => {
      //          vnode.attrs.onDelete();
      //        },
      //      }
      //    ),
      //    m('a.file',
      //      { 
      //        href: url + '?download=true',
      //        onclick: (e) => {
      //          e.stopPropagation();
      //        },
      //      },
      //      m('i.btn.item__download_btn.fas.fa-download'),
      //    ),
      //  );
      //}
    },
  };
};

export {
  Directory,
};
