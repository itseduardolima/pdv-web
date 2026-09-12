import { StorageClient } from './storage.client'
import { detectImageType, StorageService } from './storage.service'

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
const SCRIPT = new Uint8Array(Buffer.from('<script>alert'))

function makeService(overrides: Partial<Record<keyof StorageClient, jest.Mock>> = {}) {
  const client = {
    presignPost: jest.fn().mockResolvedValue({ url: 'http://minio/pdv-media', fields: { key: 'x', 'Content-Type': 'image/png' } }),
    head: jest.fn().mockResolvedValue({ sizeBytes: 1000, contentType: 'image/png' }),
    readLeadingBytes: jest.fn().mockResolvedValue(PNG),
    delete: jest.fn().mockResolvedValue(undefined),
    publicUrl: jest.fn((key: string) => `http://localhost:9000/pdv-media/${key}`),
    ...overrides,
  }
  return { service: new StorageService(client as unknown as StorageClient), client }
}

describe('detectImageType', () => {
  it.each([
    ['jpeg', JPEG, 'image/jpeg'],
    ['png', PNG, 'image/png'],
    ['webp', WEBP, 'image/webp'],
    ['script', SCRIPT, null],
    ['empty', new Uint8Array(), null],
  ])('detects %s', (_label, bytes, expected) => {
    expect(detectImageType(bytes)).toBe(expected)
  })
})

describe('StorageService', () => {
  describe('createUpload', () => {
    it('generates a tenant-scoped key with a server-side uuid and the extension of the declared type', async () => {
      const { service, client } = makeService()
      const ticket = await service.createUpload('t1', { kind: 'product', contentType: 'image/png', sizeBytes: 1000 })
      expect(ticket.key).toMatch(/^tenants\/t1\/product\/[0-9a-f-]{36}\.png$/)
      expect(client.presignPost).toHaveBeenCalledWith(ticket.key, 'image/png', 5 * 1024 * 1024, 300)
      expect(ticket.uploadUrl).toBe('http://minio/pdv-media')
      expect(ticket.publicUrl).toBe(`http://localhost:9000/pdv-media/${ticket.key}`)
    })
  })

  describe('confirmUpload', () => {
    const key = 'tenants/t1/product/abc.png'

    it('returns the public url when the object exists and the magic bytes match', async () => {
      const { service, client } = makeService()
      await expect(service.confirmUpload('t1', key)).resolves.toEqual({ url: `http://localhost:9000/pdv-media/${key}` })
      expect(client.delete).not.toHaveBeenCalled()
    })

    it('refuses a key from another tenant without touching storage', async () => {
      const { service, client } = makeService()
      await expect(service.confirmUpload('t2', key)).rejects.toMatchObject({ code: 'INVALID_UPLOAD', statusCode: 400 })
      expect(client.head).not.toHaveBeenCalled()
    })

    it('fails when nothing was uploaded', async () => {
      const { service } = makeService({ head: jest.fn().mockResolvedValue(null) })
      await expect(service.confirmUpload('t1', key)).rejects.toMatchObject({ code: 'INVALID_UPLOAD' })
    })

    it('deletes the object and fails when the bytes are not the declared image type', async () => {
      const { service, client } = makeService({ readLeadingBytes: jest.fn().mockResolvedValue(SCRIPT) })
      await expect(service.confirmUpload('t1', key)).rejects.toMatchObject({ code: 'INVALID_UPLOAD' })
      expect(client.delete).toHaveBeenCalledWith(key)
    })

    it('deletes the object when a jpeg was uploaded under a .png key', async () => {
      const { service, client } = makeService({ readLeadingBytes: jest.fn().mockResolvedValue(JPEG) })
      await expect(service.confirmUpload('t1', key)).rejects.toMatchObject({ code: 'INVALID_UPLOAD' })
      expect(client.delete).toHaveBeenCalledWith(key)
    })

    it('deletes the object when it exceeds the size limit', async () => {
      const { service, client } = makeService({ head: jest.fn().mockResolvedValue({ sizeBytes: 6 * 1024 * 1024, contentType: 'image/png' }) })
      await expect(service.confirmUpload('t1', key)).rejects.toMatchObject({ code: 'INVALID_UPLOAD' })
      expect(client.delete).toHaveBeenCalledWith(key)
    })
  })
})
