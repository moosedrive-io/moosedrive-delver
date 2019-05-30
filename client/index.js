const State = {
  token: null,
  fs: null,
  remoAddr: 'http://localhost:9001',
};

const Home = {
  oninit: function() {
    State.token = localStorage.getItem('token');

    console.log(State);

    if (State.token === null) {
      m.route.set('/login');
    }

    m.request({
      url: State.remoAddr + '/dir1',
      headers: {
        'Authorization': 'Bearer ' + State.token,
      },
    })
    .then(function(res) {
      State.fs = res;
    });
  },

  view: function() {
    if (!State.fs) {
      return null;
    }

    return m('main',
      m('.pure-g',
        m('.left-panel.pure-u-1-4'),
        m('.center-panel.pure-u-1-2',
          m(BreadcrumbPath, { pathList: ['dir1', 'dir2', 'dir3'] }),
          m(Directory, { items: State.fs }),
        ),
        m('.right-panel.pure-u-1-4'),
      ),
    );
  }
};

const BreadcrumbPath = () => {
  return {
    view: (vnode) => m('.breadcrumb-path.pure-g',
      vnode.attrs.pathList.map((elem) => {
        return m('span.pure-u-1-3', "Braecrumbs");
      }),
    ),
  };
};

const Directory = () => {
  return {
    view: (vnode) => m('.directory',
      vnode.attrs.items.map((item) => {
        return m('.pure-g',
          m('.pure-u-1',
            m(Item, { item })
          ),
        );
      })
    ),
  };
};

const Item = () => {
  return {
    view: (vnode) => m('.item',
      m('.item__name',
        vnode.attrs.item.name,
      )
    ),
  }
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
                url: '/login',
                method: 'POST',
                data: {
                  email,
                },
              })
              .then(function(response) {
                localStorage.setItem('token', response.token);
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
