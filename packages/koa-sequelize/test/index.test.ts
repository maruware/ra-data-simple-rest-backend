import { User } from './sequelize/user'
import { sequelize } from './sequelize/connection'

import rest, { CREATE, GET_LIST, GET_ONE, UPDATE, DELETE } from '../index'
import Koa from 'koa'
import koaBody from 'koa-body'
import request from 'supertest'

const setupServer = () => {
  const app = new Koa()
  app.use(koaBody())
  return app
}

describe('User Test', () => {
  beforeAll(async () => {
    await sequelize.sync()
    await User.truncate()
  })
  it('basic', async () => {
    const app = setupServer()

    const router = rest('/users', User, [CREATE, GET_LIST, GET_ONE, UPDATE, DELETE ])    
    app.use(router.routes()).use(router.allowedMethods())
    const server = app.callback()

    // post
    let res = await request(server).post('/users').send({name: 'takashi'})
    expect(res.status).toBe(201)
    expect(res.body.id).not.toBeNull()

    await request(server).post('/users').send({name: 'kaori'})
    await request(server).post('/users').send({name: 'bob'})
    await request(server).post('/users').send({name: 'steven'})

    // get
    res = await request(server).get('/users').query({
      sort: JSON.stringify(['name', 'ASC']),
      range: JSON.stringify([0, 2])
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const users = res.body
    console.log(users)
    expect(users[0].name).toBe('bob')
    expect(users[1].name).toBe('kaori')
  })
})
