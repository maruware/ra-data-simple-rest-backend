import Koa, { Middleware } from 'koa'
import Router from 'koa-router'
import jwt from 'jsonwebtoken'

declare module 'koa' {
  interface Request extends Koa.BaseRequest {
    body: any
  }
}

export interface AdminUser {
  username: string
  password: string
}

interface BuildOptions {
  expiresIn: string
}
export const buildAuth = (
  jwtSecret: string,
  admins: AdminUser[],
  options: BuildOptions = { expiresIn: '2d' }
) => {
  const router = new Router()

  router.post('/', async ctx => {
    if (!ctx.request.body || !ctx.request.body.username) {
      ctx.throw(400)
    }
    const { username, password } = ctx.request.body

    const admin = admins.find(
      a => a.username === username && a.password === password
    )
    if (!admin) {
      ctx.throw(401, { error: 'Unauthorized' })
    }

    ctx.body = {
      token: jwt.sign({ username: admin.username }, jwtSecret, {
        expiresIn: options.expiresIn
      })
    }
  })

  router.get('/verify', async ctx => {
    const token = ctx.req.headers.authorization
    if (verifyJwt(token)) {
      ctx.body = 'ok'
    } else {
      ctx.throw(401, 'Unauthorized')
    }
  })

  const verifyJwt = (token: string) => {
    try {
      const decoded: any = jwt.verify(token, jwtSecret)
      const admin = admins.find(a => a.username === decoded.username)

      return Boolean(admin)
    } catch (e) {
      return false
    }
  }

  const middleware: Middleware = async (ctx, next) => {
    const token = ctx.req.headers.authorization
    if (verifyJwt(token)) {
      await next()
    } else {
      ctx.throw(401, 'Unauthorized')
    }
  }

  return { router, middleware }
}
