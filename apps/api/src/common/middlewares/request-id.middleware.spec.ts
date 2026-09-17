import type { Request, Response } from 'express'
import { getRequestId } from '../request-context'
import { REQUEST_ID_HEADER, RequestIdMiddleware } from './request-id.middleware'

describe('RequestIdMiddleware', () => {
  it('sets the x-request-id header and runs next inside the request context', () => {
    const setHeader = jest.fn()
    const response = { setHeader } as unknown as Response
    let seenRequestId: string | undefined
    const next = jest.fn(() => {
      seenRequestId = getRequestId()
    })

    new RequestIdMiddleware().use({} as Request, response, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(seenRequestId).toBeDefined()
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, seenRequestId)
  })

  it('generates a different id per call', () => {
    const response = { setHeader: jest.fn() } as unknown as Response
    const ids: (string | undefined)[] = []
    const middleware = new RequestIdMiddleware()

    middleware.use({} as Request, response, () => ids.push(getRequestId()))
    middleware.use({} as Request, response, () => ids.push(getRequestId()))

    expect(ids[0]).toBeDefined()
    expect(ids[0]).not.toBe(ids[1])
  })

  it('getRequestId returns undefined outside any request context', () => {
    expect(getRequestId()).toBeUndefined()
  })
})
