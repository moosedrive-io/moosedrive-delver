const State = {
  fs: null,
  curDir: null,
  curPath: null,
  remoAddr: 'http://localhost:9001',
};

const Home = {
  oninit: function() {

    console.log(State);

    m.request({
      url: State.remoAddr + '/' + '?fullTree',
			withCredentials: true,
    })
    .then(function(res) {
      console.log(res);
      State.fs = res;
      State.curDir = res;
      State.curPath = [];
    });
  },

  view: function() {
    if (!State.curDir) {
      return null;
    }

    return m('main',
      m('.pure-g',
        m('.left-panel.pure-u-1-4'),
        m('.center-panel.pure-u-1-2',
          m(BreadcrumbPath, { pathList: State.curPath }),
          m(Directory, {
            items: State.curDir.children,
            clicked: (key) => {
              if (key === '..') {
                State.curPath.pop();
                State.curDir = State.fs;

                for (const part of State.curPath) {
                  State.curDir = State.curDir.children[part];
                }
              }
              else {
                console.log(State.curDir);
                const target = State.curDir.children[key];
                if (target.type === 'dir') {
                  State.curPath.push(key);
                  State.curDir = State.curDir.children[key];
                }
                else if (target.type === 'file') {
                  //const path = State.curPath.concat([key]).join('/');
                  //console.log("FILE", path);
                  //const url = encodeURI(State.remoAddr + '/' + path);
                  //console.log(url);
                  //m.request({
                  //  url,
                  //  headers: {
                  //    'Authorization': 'Bearer ' + State.token,
                  //  },
                  //  deserialize: function(value) {return value},
                  //})
                  //.then((contents) => {
                  //  console.log(contents);
                  //})
                  //.catch((e) => {
                  //  console.error(e);
                  //});
                }
              }
            },
          }),
        ),
        m('.right-panel.pure-u-1-4'),
      ),
    );
  }
};

const BreadcrumbPath = () => {
  return {
    view: (vnode) => m('.breadcrumb-path.pure-g',
      m('span.pure-u', '/'),
      vnode.attrs.pathList.map((elem) => {
        return m('span.pure-u', elem + '/');
      }),
    ),
  };
};

const Directory = () => {
  return {
    view: (vnode) => m('.directory',
      m('.pure-u-1', {
          onclick: () => {
            vnode.attrs.clicked('..');
          },
        },
        m(Item, {
          name: '..',
          data: {},
        }),
      ),
      Object.keys(vnode.attrs.items).map((key) => {
        return m('.pure-g',
          m('.pure-u-1', {
              onclick: () => {
                vnode.attrs.clicked(key);
              },
            },
            m(Item, {
              name: key,
              data: vnode.attrs.items[key],
            }),
          ),
        );
      })
    ),
  };
};

const Item = () => {
  return {
    view: (vnode) => {
		  const name = vnode.attrs.name;
			const type = vnode.attrs.data.type;
      const path = State.curPath.concat([name]).join('/');
      const url = encodeURI(State.remoAddr + '/' + path);

      if (type === 'file') {
				return m('.item',
				  m('a.file', { href: url, target: '_blank' },
					  name
					),
				);
			}
			else {
				return m('.item',
					m('.item__name', name)
				);
			}
		},
	};
};

function Login() {

  let email = "";

  return {
    view: function() {
      return m('main',
        m('h1', "Login"),
        m('p', "Enter your email address to get an access key"),
        m('input', {
          type: 'text',
          onkeyup: function(e) {
            email = e.target.value;
          },
          //value: "tapitman11@gmail.com",
        },
        ),
        m('button', {
            onclick: function() {
              console.log(email);

              m.request({
                url: State.remoAddr + '/login',
                method: 'POST',
								withCredentials: true,
                data: {
                  email,
                },
              })
              .then(function(response) {
								console.log(response);
                m.route.set('/home');
              });
            },
          },
          "Submit"
        ),
      );
    }
  }
}

const Data = {
  view: function() {
    return m('h1',
      "Hi there data",
    );
  }
};

const root = document.getElementById('root');
m.route(root, '/',{
  '/': Home,
  '/login': Login,
  '/data': Data,
});
