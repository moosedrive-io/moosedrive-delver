import { ClientBuilder } from 'remofs-client';


const State = {
  fs: null,
  curDir: null,
  curPath: null,
  remoAddr: window.location.origin,
};

const Home = {
  oninit: function() {

    console.log(State);

    // TODO: do proper cookie parsing
    const key = document.cookie.split('=')[1];

    (async () => {
      State.client = await new ClientBuilder()
        .authKey(key)
        .secure(false)
        .build();
    })();

    m.request({
      url: State.remoAddr + '?ignoreIndex=true',
			withCredentials: true,
    })
    .then(function(res) {
			if (res === null) {
				m.route.set('/login');
			}

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
          m(DirNav, {
						pathList: State.curPath,
						onUp: () => {
							State.curPath.pop();
              State.curDir = State.fs;

              for (const part of State.curPath) {
                State.curDir = State.curDir.children[part];
              }
						},
						onBack: () => {
							console.log("back");
						},
						onForward: () => {
							console.log("forward");
						},
						onUpload: () => {
							console.log("upload");
						},
					}),
          m(Directory, {
            items: State.curDir.children,
            clicked: (key) => {
              console.log(State.curDir);
              const target = State.curDir.children[key];
              if (target.type === 'dir') {
                State.curPath.push(key);
                State.curDir = target;
              }
            },
          }),
        ),
        m('.right-panel.pure-u-1-4'),
      ),
    );
  }
};

const DirNav = () => {
	return {
		view: (vnode) => {

			const pathList = vnode.attrs.pathList;

			return m('.dirnav.pure-g',
        m('span.pure-u',
				  m('i.dirnav__btn.dirnav__up.fas.fa-arrow-up', {
				  		onclick: () => {
								vnode.attrs.onUp();
				  		},
				  	}
				  ),
				  m('i.dirnav__btn.dirnav__back.fas.fa-arrow-left', {
				  		onclick: () => {
								vnode.attrs.onBack();
				  		},
				  	}
				  ),
				  m('i.dirnav__btn.dirnav__forward.fas.fa-arrow-right', {
				  		onclick: () => {
								vnode.attrs.onForward();
				  		},
				  	}
				  ),
				),
				m(BreadcrumbPath, { pathList }),
        m('span.pure-u.dirnav__btn.dirnav__upload',
				  m('i.fas.fa-cloud-upload-alt', {
				  		onclick: () => {
								vnode.attrs.onUpload();
				  		},
				  	}
				  ),
          m('input', {
            type: 'file',
            onchange: (e) => {
              const file = e.target.files[0];
              console.log(file);
              const path = '/' + State.curPath.join('/') + file.name
              State.client.uploadFile(path, file);
            },
          },
          "Do it")
				),
			);
		}
	};
};

const BreadcrumbPath = () => {
  return {
    view: (vnode) => m('span.breadcrumb-path.pure-u',
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
};

const Item = () => {
  return {
    view: (vnode) => {
		  const name = vnode.attrs.name;
			const type = vnode.attrs.data.type;
      const path = State.curPath.concat([name]).join('/');
      const url = encodeURI(State.remoAddr + '/' + path);

      if (type === 'file') {
				return m('a.file', { href: url, target: '_blank' },
				  m('.item',
            m('i.fas.fa-file'),
						m('span.item__name', name),
            //m('i.item__download_btn.fas.fa-download',
            //  {
            //    onclick: (e) => {
            //      vnode.attrs.ondownload();
            //      e.preventDefault();
            //    },
            //  }
            //),
            m('a.file',
              {
                href: url + '?download=true',
                onclick: (e) => {
                  vnode.attrs.ondownload();
                },
              },
              m('i.item__download_btn.fas.fa-download'),
            ),
					),
				);
			}
			else {
				return m('.item',
          m('i.fas.fa-folder'),
					m('span.item__name', name),
          m('a.file',
            { 
              href: url + '?download=true',
              onclick: (e) => {
                e.stopPropagation();
              },
            },
            m('i.item__download_btn.fas.fa-download'),
          ),
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
								deserialize: (data) => data,
              })
              .then(function(response) {
								console.log(response);
                m.route.set('/enterkey');
              })
							.catch((e) => {
							  console.error(e);
							});
            },
          },
          "Submit"
        ),
      );
    }
  }
}

const EnterKey = () => {

	let key = "";

	return {
		view: (vnode) => {
		  return m('main',
        m('h1', "Complete Login"),
        m('p', "Check your email for a key and enter it here"),
        m('input', {
          type: 'text',
          onchange: function(e) {
            key = e.target.value;
          },
        },
        ),
        m('button', {
            onclick: function() {
              console.log(key);

              m.request({
                url: State.remoAddr + '/login',
                method: 'POST',
								withCredentials: true,
                data: {
                  key,
                },
								deserialize: (data) => data,
              })
              .then(function(response) {
								console.log(response);
                m.route.set('/home');
              })
							.catch((e) => {
							  console.error(e);
							});
            },
          },
          "Submit"
        ),
      );
		},
	};
};

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
  '/enterkey': EnterKey,
  '/data': Data,
});
