const { Auth } = require('kiss-my-auth');
const { RemoBuilder } = require('remofs');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const koaStatic = require('koa-static');

const app = new Koa();
const router = new Router();

const auth = new Auth();

const remo = new RemoBuilder()
  .auth(auth)
  .build();

router.get('/', ctx => {
  ctx.body = "Da root";
});

router.get('/fs/*', async ctx => {
  const token = ctx.query.key;
  let path = ctx.request.url.split('?')[0];
  path = path.slice(4);
  const result = await remo.get(token, path);
  ctx.body = JSON.stringify(result);
});

router.post('/login', async ctx => {
  console.log(ctx.request.body);
  const token = await auth.createAndSendToken(ctx.request.body);
  console.log(token);
  ctx.body = JSON.stringify({
    token,
  });
});

app
  .use(koaStatic('client'))
  .use(bodyParser({
    enableTypes: ['json'],
  }))
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(9001);
