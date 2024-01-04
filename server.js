const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaStatic = require('koa-static');
const WS = require('ws');
const Router = require('koa-router');
const path = require('path');
const uuid = require('uuid');

const utils = require('./utils');


const public = path.join(__dirname, '/public');

const app= new Koa();

app.use(koaStatic(public));

app.use(koaBody({
    urlencoded: true,
    multipart: true,
    text: true,
    json: true,
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});


let messages = [];

const router = new Router();

// все сообщения
router.get('/messages/all', async(ctx) => {
  ctx.response.body = messages;
})

// все сообщения lazy-load
router.post('/messages/all', async(ctx) => {
  const start = messages.length - ctx.request.body.quantity;

  const newList = structuredClone(messages).slice((newList.length - quantity), -10);
})

// создание сообщения
router.post('/messages/createMessage', async(ctx) => {
  const files = Object.values(ctx.request.files);

  const links = utils.linkGenerator(ctx.request.body.message); 
  
  const message = {
    id: uuid.v4(),
    text: ctx.request.body.message || '',
    files: [],
    links: links,
    favorites: false,
    data: new Date(),
  }

  console.log(typeof message.data);

  if (files) {
    files.forEach(item => {
      const public = path.join(__dirname, '/public');
      const upload = public + '/';

      fs.copyFileSync(item.filepath, upload + item.originalFilename);
      // const src = path.join(__dirname, `/${item.originalFilename}`);
      console.log(item);
      const name = item.originalFilename;
      const src = `/${item.originalFilename}`;
      const type = utils.replaceType(item.mimetype);
      message.files.push({name: name, src: src, type: type});  
    })
  }

  messages.push(message);

  // const { name } = ctx.request.body;

  ctx.response.set('Access-Control-Allow-Origin', '*');

  // messages.push({ name, phone });

  ctx.response.body = JSON.stringify(message);

  
})

// удаление сообщения
router.delete('/messages:id', async(ctx) => {
  const { id } = ctx.params;

  ctx.response.set('Access-Control-Allow-Origin', '*');

  if (messages.every(msg => msg.id !== id)) {
    ctx.response.status = 400;
    ctx.response.body = {status: "message doen't exusr"};

    return;
  }

  messages = messages.filter(msg => msg.id !== id);
  ctx.response.body = {status: "OK"};

})

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 3000;
const server = http.createServer(app.callback());


server.listen(port);
