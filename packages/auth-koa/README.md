# Auth Koa

Router for authentication and Middleware for authorization.

## Install 

```
@ra-data-simple-rest-backend/auth-koa
```

## Usage

```ts
import Koa from 'koa'
import koaBody from 'koa-body'
import Router from 'koa-router'

import request from 'supertest'
import { buildAuth } from '@ra-data-simple-rest-backend/auth-koa'

const app = new Koa()
app.use(koaBody())

const admins = [{ username: 'takashi', password: 'my_password' }]
const auth = buildAuth('my secret', admins)

const router = new Router()
router.use('/auth', auth.router.routes(), auth.router.allowedMethods())

const apiRouter = new Router()
apiRouter.get('/sample', async ctx => {
    ctx.body = 'ok'
})
router.use(auth.middleware, apiRouter.routes(), apiRouter.allowedMethods())

app.use(router.routes()).use(router.allowedMethods())
```
