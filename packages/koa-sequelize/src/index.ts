import Koa from 'koa'
import Router from 'koa-router'

import {
  Model,
  WhereOptions,
  OrderItem,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions
} from 'sequelize'

declare module 'koa' {
  interface Request extends Koa.BaseRequest {
    body: any
  }
}

type ACTION_TYPE = 'GET_LIST' | 'GET_ONE' | 'CREATE' | 'UPDATE' | 'DELETE'

export const GET_LIST: ACTION_TYPE = 'GET_LIST'
export const GET_ONE: ACTION_TYPE = 'GET_ONE'
export const CREATE: ACTION_TYPE = 'CREATE'
export const UPDATE: ACTION_TYPE = 'UPDATE'
export const DELETE: ACTION_TYPE = 'DELETE'

const ACTION_TO_FUNC = {
  [GET_LIST]: getList,
  [GET_ONE]: getOne,
  [CREATE]: create,
  [UPDATE]: update,
  [DELETE]: delete_
}

interface QueryOptions {
  GET_LIST?: FindOptions
  GET_ONE?: FindOptions
  CREATE?: CreateOptions
  UPDATE?: UpdateOptions
  DELETE?: DestroyOptions
}

async function toJsonDefault<M extends Model>(instance: M) {
  return instance.toJSON()
}

function rest<M extends Model>(
  prefix: string,
  model: { new (): M } & typeof Model,
  actions?: Array<string>,
  toJson?: (instance: M) => Promise<any>,
  queryOptions?: QueryOptions
) {
  if (!actions) {
    actions = Object.keys(ACTION_TO_FUNC)
  }
  if (!toJson) {
    toJson = toJsonDefault
  }

  const router = new Router({ prefix })

  actions.forEach(action => {
    const options = queryOptions && queryOptions[action]
    ACTION_TO_FUNC[action](router, model, toJson, options)
  })

  return router
}

function getList<M extends Model>(
  router: Router,
  model: { new (): M } & typeof Model,
  toJson: (instance: M) => Promise<any>,
  findOptions?: FindOptions
) {
  router.get('/', async ctx => {
    let { sort, range, filter } = ctx.query
    let order: OrderItem = null
    if (sort) {
      order = JSON.parse(sort)
    }
    let offset = 0
    let limit = 100
    if (range) {
      const a = JSON.parse(range)
      offset = a[0]
      limit = a[1] - offset
    }

    const where: WhereOptions = filter ? JSON.parse(filter) : {}
    const items: M[] = await model.findAll({
      where,
      offset,
      limit,
      order: [order],
      ...findOptions
    })
    const total: number = await model.count(filter)

    ctx.set('Content-Range', `${offset}-${offset + limit}/${total}`)
    ctx.body = await Promise.all(items.map(item => toJson(item)))
  })
}

function getOne<M extends Model>(
  router: Router,
  model: { new (): M } & typeof Model,
  toJson: (instance: M) => Promise<any>,
  findOptions?: FindOptions
) {
  router.get('/:id', async ctx => {
    const { id } = ctx.params
    const item = await model.findByPk(id, findOptions)
    if (!item) {
      ctx.throw(404, { error: 'Not fould' })
      return
    }
    ctx.body = await toJson(item)
  })
}

function create<M extends Model>(
  router: Router,
  model: { new (): M } & typeof Model,
  toJson: (instance: M) => Promise<any>,
  createOptions?: CreateOptions
) {
  router.post('/', async ctx => {
    const data = ctx.request.body
    const item = await model.create(data, createOptions)

    ctx.status = 201
    ctx.body = await toJson(item)
  })
}

function update<M extends Model>(
  router: Router,
  model: { new (): M } & typeof Model,
  toJson: (instance: M) => Promise<any>,
  updateOptions?: UpdateOptions
) {
  router.put('/:id', async ctx => {
    const { id } = ctx.params
    const data = ctx.request.body
    const item = await model.findByPk(id)
    if (!item) {
      ctx.throw(404, { error: 'Not fould' })
      return
    }
    await item.update(data, updateOptions)
    ctx.body = await toJson(item)
  })
}

function delete_<M extends Model>(
  router: Router,
  model: { new (): M } & typeof Model,
  destroyOptions?: DestroyOptions
) {
  router.delete('/:id', async ctx => {
    const { id } = ctx.params
    await model.destroy({ where: { id }, ...destroyOptions })
    ctx.body = { id }
  })
}

export default rest
