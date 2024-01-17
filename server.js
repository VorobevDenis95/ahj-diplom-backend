const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaStatic = require('koa-static');
const WS = require('ws');
const Router = require('koa-router');
const path = require('path');
const uuid = require('uuid');
const cors = require('@koa/cors');
const utils = require('./utils');


const public = path.join(__dirname, '/public');

const app= new Koa();

app.use(koaStatic(public));

app.use(cors({
  origin(ctx) {
    return ctx.get('Origin') || '*';
  },
  credentials: true,
  allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Acces-Control-Allow-Origin', 'Content-Type', 'Authorization', 'Accept'],
}));

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

let pin = {};

const router = new Router();

// все сообщения
router.get('/messages/all', async(ctx) => {
  ctx.response.body = messages;
})

// избранные
router.get('/messages/favorites', async(ctx) => {
  ctx.response.body = messages.filter(el => el.favorites === true);
})

// закрепленное сообщение
router.get('/messages/pin/message', async(ctx) => {
  ctx.response.body = pin;
})

// закрепленние сообщения
router.post('/messages/pin/message', async(ctx) => {
  const id = ctx.request.body;
  const element = messages.find(el => el.id === id);
  if (element.pin) {
    element.pin = false;
    pin = {};
  } else {
    element.pin = true;
    pin = element;
  }
  console.log(pin);
  ctx.response.status = 200;
})



// количество сообщений
router.get('/messages/length', async(ctx) => {
  ctx.response.body = messages.length;
})
// сообщения lazy-load
router.post('/messages/all', async(ctx) => {
  const lengthListBack = messages.length;
  console.log(ctx.request.body);
  const lengthListFront = ctx.request.body;
  let step = lengthListBack - lengthListFront < 10 ? lengthListBack - lengthListFront : 10;
  const length = lengthListBack - step - lengthListFront;
  const newList = structuredClone(messages).slice(length, lengthListBack - lengthListFront);
  console.log('list');

  ctx.response.body = JSON.stringify(newList);
})

// поиск сообщений 
router.post('/messages/search', async(ctx) => {
  const str = ctx.request.body;
  const searchMessages = [];
  messages.map(msg => {
    if (msg.text.toLowerCase().includes(str)) {
      searchMessages.push(msg);
    }
  })

  ctx.response.body = JSON.stringify(searchMessages);
})

// создание сообщения
router.post('/messages/createMessage', async(ctx) => {
  const files = Object.values(ctx.request.files);
  const links = ctx.request.body.message !== undefined ? utils.linkGenerator(ctx.request.body.message) : null;
  console.log(ctx.request.body.message === undefined);
  console.log('сообщение');
  // if (ctx.request.body.message) {
  //   const links = utils.linkGenerator(ctx.request.body.message);
  // }
   
  const message = {
    id: uuid.v4(),
    text: ctx.request.body.message || '',
    files: [],
    links: links || null,
    favorites: false,
    pin: false,
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
