import type { Request, Response } from 'express'
import { ForbiddenError, NotFoundError } from '../errors/domain.error'
import { getTenantId, TenantResolver } from '../tenant-context'
import { TenantMiddleware } from './tenant.middleware'

function makeRequest(headers: Record<string, string>, hostname = 'localhost'): Request {
  return { header: (name: string) => headers[name.toLowerCase()], hostname } as unknown as Request
}

describe('TenantMiddleware', () => {
  const response = {} as Response

  it('calls next with TENANT_NOT_FOUND for an unknown host', async () => {
    const resolver: TenantResolver = { resolveByHost: jest.fn().mockResolvedValue(null) }
    const next = jest.fn()

    await new TenantMiddleware(resolver).use(makeRequest({ 'x-tenant-host': 'nope.app.localhost' }), response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0]?.[0] as NotFoundError
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.code).toBe('TENANT_NOT_FOUND')
  })

  it('runs next inside the tenant context using x-tenant-host', async () => {
    const resolver: TenantResolver = {
      resolveByHost: jest.fn().mockResolvedValue({ id: 'tenant_1', active: true }),
    }
    let seenTenantId: string | undefined
    const next = jest.fn(() => {
      seenTenantId = getTenantId()
    })

    await new TenantMiddleware(resolver).use(makeRequest({ 'x-tenant-host': 'Demo.App.Localhost' }), response, next)

    expect(resolver.resolveByHost).toHaveBeenCalledWith('demo.app.localhost')
    expect(seenTenantId).toBe('tenant_1')
  })

  it('falls back to the request hostname when x-tenant-host is absent', async () => {
    const resolver: TenantResolver = {
      resolveByHost: jest.fn().mockResolvedValue({ id: 'tenant_1', active: true }),
    }

    await new TenantMiddleware(resolver).use(makeRequest({}, 'demo.app.localhost'), response, jest.fn())

    expect(resolver.resolveByHost).toHaveBeenCalledWith('demo.app.localhost')
  })

  it('calls next with 403 TENANT_SUSPENDED for a suspended tenant (HU 13.7)', async () => {
    const resolver: TenantResolver = {
      resolveByHost: jest.fn().mockResolvedValue({ id: 'tenant_1', active: false }),
    }
    const next = jest.fn()

    await new TenantMiddleware(resolver).use(makeRequest({ 'x-tenant-host': 'suspensa.app.localhost' }), response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = next.mock.calls[0]?.[0] as ForbiddenError
    expect(error).toBeInstanceOf(ForbiddenError)
    expect(error.code).toBe('TENANT_SUSPENDED')
    expect(error.statusCode).toBe(403)
  })
})
