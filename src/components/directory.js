import m from 'mithril';
import h from 'hyperscript';
import rein from 'rein-state';
import { ItemMithrilAdapter } from './item.js';


const DirectoryAdapter = () => {

  return {
    onbeforeupdate: (vnode) => {
      // mithril should ignore this component
      return false;
    },

    oncreate: (vnode) => {
      vnode.dom.appendChild(ReinDirectory(vnode.attrs.path, vnode.attrs.data, vnode.attrs.remoAddr));
    },

    view: (vnode) => {
      return m('.directory-adapter');
    }
  };
};

// this is used to achieve a "natural sort". see
// https://stackoverflow.com/a/38641281/943814
const naturalSorter = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
});

function genSortedItems(data) {
  return Object.keys(data)
    .sort(naturalSorter.compare)
    .map(name => ({
      name,
      state: makeItemState(),
    }));
}

function makeItemState() {
  return rein.fromObject({
    settings: {
      selected: false,
    },
    visualState: 'minimized',
  });
}

function newItem(path, data, item, remoAddr) {
  const wrapper = h('.directory__items__item');
  const itemElem = ItemMithrilAdapter(path.concat([item.name]), data[item.name], item.state, remoAddr);
  wrapper.appendChild(itemElem);

  rein.onUpdated(data, item.name, () => {
    const oldElem = wrapper.childNodes[0];
    const newElem = ItemMithrilAdapter(path.concat([item.name]), data[item.name], item.state, remoAddr);
    wrapper.replaceChild(newElem, oldElem);
  });

  return wrapper;
}


const ReinDirectory = (path, data, remoAddr) => {

  let sortedItems = genSortedItems(data);

  const itemsElem = h('.directory__items',
    sortedItems.map((item) => newItem(path, data, item, remoAddr)),
  );

  const dom = h('.directory',
    h('.directory__separator',
      path.length > 0 ? '/' + path.join('/') + '/' : '/',
    ),
    itemsElem,
    h('.directory__separator',
      path.length > 1 ? '/' + path.slice(0, -1).join('/') + '/' : '/',
    ),
  );

  rein.onAdd(data, (name) => {

    // TODO: could do a binary insertion to be more efficient, rather than
    // resorting the whole list
    const sortedNames = Object.keys(data).sort(naturalSorter.compare);

    let index = sortedNames.indexOf(name);

    if (index > -1) {
      sortedItems = sortedItems.slice(0, index)
        .concat([{ name, state: makeItemState() }])
        .concat(sortedItems.slice(index));

      const item = sortedItems[index];

      itemsElem.insertBefore(
        newItem(path, data, item, remoAddr),
        itemsElem.childNodes[index]);
    }
    else {
      throw new Error("Directory DOM insert fail");
    }
  });

  rein.onDelete(data, (name) => {

    let index = -1;
    for (let i = 0; i < sortedItems.length; i++) {
      if (sortedItems[i].name === name) {
        index = i;
      }
    }
    sortedItems.splice(index, 1);
    itemsElem.removeChild(itemsElem.childNodes[index]);
  });

  return dom;
};


export {
  DirectoryAdapter,
};
