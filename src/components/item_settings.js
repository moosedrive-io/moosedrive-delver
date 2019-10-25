import rein from '@anderspitman/reinstate';
import h from 'hyperscript';


const ItemSettings = (data, renderState) => {

  const domCache = {
    perm: null,
    sharing: null,
    tags: null,
  };

  const dummyContent = h('span');
  let content = dummyContent;

  const dom = h('.item-settings',
    content,
  );

  function render() {
    switch (renderState.selected) {
      case 'permissions':

        if (!domCache.perm) {
          domCache.perm = h('.item-settings__permissions',
            PermissionsEdit(data.permissions)
          );
        }

        dom.replaceChild(domCache.perm, content);
        content = domCache.perm;
        break;

      case 'sharing':

        if (!domCache.sharing) {
          domCache.sharing = h('.item-settings__sharing',
            "Edit Sharing",
          );
        }

        dom.replaceChild(domCache.sharing, content);
        content = domCache.sharing;
        break;

      case 'tags':

        if (!domCache.tags) {
          domCache.tags = h('.item-settings__tags',
            "Edit Tags",
          );
        }

        dom.replaceChild(domCache.tags, content);
        content = domCache.tags
        break;

      default:
        dom.replaceChild(dummyContent, content);
        content = dummyContent;
        break;
    }
  }

  render();

  rein.onUpdated(renderState, 'selected', () => {
    render();
  });

  return dom;
};


const PermissionsEdit = (state) => {

  let viewerText = "";

  const viewers = state && state.viewers ? state.viewers : [];
  const editors = state && state.editors ? state.editors : [];

  function Viewer(state) {
    return h('.permissions-edit__viewers-list__viewer',
      state 
    );
  }

  const viewersDom = h('.permissions-edit__viewers-list__viewers',
    viewers.map((viewer) => {
      return Viewer(viewer);
    }),
  );

  if (viewers) {
    rein.onPush(viewers, (val) => {
      viewersDom.appendChild(Viewer(val));
    });
  }

  const dom = h('.permissions-edit',
    PublicViewSelector(state),
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
      editors.map((editor) => {
        return h('.permissions-edit__editors-list__editor',
          "editor",
        );
      }),
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
    "S"
  );

  const checkbox = h('input.public-view-selector__checkbox',
    {
      type: 'checkbox',
      onchange: (e) => {

        dom.dispatchEvent(new CustomEvent('selected', {
          bubbles: true,
          detail: {
            checked: e.target.checked,
          },
        }));
      },
    },
  );

  const dom = h('.public-view-selector',
    "Public view?",
    checkbox,
    s,
  );

  updatePublicView();


  rein.onUpdated(state, 'publicView', () => {
    updatePublicView();
  });

  function updatePublicView() {
    if (state.publicView) {
      s.style.display = 'inline';
      checkbox.checked = true;
    }
    else {
      s.style.display = 'none';
      checkbox.checked = false;
    }
  }

  return dom;
};


export {
  ItemSettings,
};
