# Koa Mongoose

Build API for React admin simple rest client in a project using Koa and Mongoose.

## Install

```
yarn add @ra-data-simple-rest-backend/koa-mongoose
```

## Usage

```ts
import Koa from 'koa'
import koaBody from 'koa-body'

import { User } from './models'

const app = new Koa()
app.use(koaBody())

const router = rest('/users', User, [CREATE, GET_LIST, GET_ONE, UPDATE, DELETE ])
app.use(router.routes()).use(router.allowedMethods())
```
