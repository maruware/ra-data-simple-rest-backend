import Koa from 'koa'
import Router from 'koa-router'

import { Model, Document } from 'mongoose'

declare module 'koa' {
  interface Request extends Koa.BaseRequest {
    body?: any
  }
}

export const GET_LIST = 'GET_LIST'
export const GET_ONE = 'GET_ONE'
export const CREATE = 'CREATE'
export const UPDATE = 'UPDATE'
export const DELETE = 'DELETE'

const ACTION_TO_FUNC: {
  [action: string]: (
    router: Router,
    model: Model<any>,
    toJson: (doc: Document) => Promise<any>
  ) => void
} = {
  [GET_LIST]: getList,
  [GET_ONE]: getOne,
  [CREATE]: create,
  [UPDATE]: update,
  [DELETE]: delete_
}

function toJsonDefault(doc: Document) {
  const o = doc.toObject()
  delete o._id
  delete o.__v
  return {
    id: doc._id,
    ...o
  }
}

function rest<D extends Document, M extends Model<D>>(
  prefix: string,
  model: M,
  actions?: string[],
  toJson?: (doc: D) => Promise<any>
) {
  if (!actions) {
    actions = Object.keys(ACTION_TO_FUNC)
  }
  if (!toJson) {
    toJson = toJsonDefault
  }

  const router = new Router({ prefix })

  actions.forEach(action => {
    ACTION_TO_FUNC[action](router, model, toJson)
  })

  return router
}

function getList<D extends Document, M extends Model<D>>(
  router: Router,
  model: M,
  toJson: (doc: D) => Promise<any>
) {
  router.get('/', async ctx => {
    let { sort, range, filter } = ctx.query
    if (sort) {
      const a = JSON.parse(sort)
      sort = { [a[0]]: a[1] === 'ASC' ? 1 : -1 }
    }
    let skip = 0
    let limit = 100
    if (range) {
      const a = JSON.parse(range)
      skip = a[0]
      limit = a[1] - skip
    }

    filter = filter ? JSON.parse(filter) : {}
    if ('id' in filter) {
      filter._id = filter.id
      delete filter.id
    }
    const items = await model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec()
    const total = await model.count(filter)

    ctx.set('Content-Range', `${skip}-${skip + limit}/${total}`)
    ctx.body = await Promise.all(items.map(item => toJson(item)))
  })
}

function getOne<D extends Document, M extends Model<D>>(
  router: Router,
  model: M,
  toJson: (doc: D) => Promise<any>
) {
  router.get('/:id', async ctx => {
    const { id } = ctx.params
    const item = await model.findOne({ _id: id })
    if (!item) {
      ctx.throw(404, { error: 'Not fould' })
    }
    ctx.body = await toJson(item)
  })
}

function create<D extends Document, M extends Model<D>>(
  router: Router,
  model: M,
  toJson: (doc: D) => Promise<any>
) {
  router.post('/', async ctx => {
    const data = ctx.request.body
    const item = await model.create(data)
    ctx.status = 201
    ctx.body = await toJson(item)
  })
}

function update<D extends Document, M extends Model<D>>(
  router: Router,
  model: M,
  toJson: (doc: D) => Promise<any>
) {
  router.put('/:id', async ctx => {
    const { id } = ctx.params
    const data = ctx.request.body
    console.log('data', data)
    const item = await model.findOne({ _id: id })
    if (!item) {
      ctx.throw(404, { error: 'Not fould' })
    }
    item.set(data)
    await item.save()
    ctx.body = await toJson(item)
  })
}

function delete_<D extends Document, M extends Model<D>>(
  router: Router,
  model: M
) {
  router.delete('/:id', async ctx => {
    const { id } = ctx.params
    await model.deleteOne({ _id: id })
    ctx.body = { id }
  })
}

export default rest
