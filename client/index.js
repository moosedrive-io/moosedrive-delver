const State = {
  token: null,
  fs: null,
};

const Home = {
  oninit: function() {
    State.token = localStorage.getItem('token');

    if (State.token === null) {
      m.route.set('/login');
    }

    m.request({
      url: '/fs/dir1?key=' + State.token,
    })
    .then(function(res) {
      State.fs = res;
    });
  },

  view: function() {
    if (!State.fs) {
      return "Hi there";
    }

    return m('main',
      m('.pure-g',
        m('.left-panel.pure-u-1-4'),
        m('.center-panel.pure-u-1-2',
          State.fs.map((item) => {
            return m('.pure-g',
              m('.pure-u-1', item.name),
            );
          }),
        ),
        m('.right-panel.pure-u-1-4'),
      ),
    );
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
