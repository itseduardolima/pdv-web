import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  UPLOAD_MAX_BYTES,
  type ConfirmedUpload,
  type CreateUploadInput,
  type UploadContentType,
  type UploadTicket,
} from '@pdv/shared'
import { DomainError } from '../../common/errors/domain.error'
import { StorageClient } from './storage.client'

const PRESIGN_TTL_SECONDS = 5 * 60
const EXTENSION: Record<UploadContentType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const invalidUpload = (message: string) => new DomainError('INVALID_UPLOAD', message, 400)

// Upload por URL assinada (08-seguranca § 6): a API nunca recebe bytes; só
// emite a permissão (tipo fixo, tamanho máximo, chave gerada aqui) e depois
// confere o que chegou no bucket.
@Injectable()
export class StorageService {
  constructor(private readonly storage: StorageClient) {}

  async createUpload(tenantId: string, input: CreateUploadInput): Promise<UploadTicket> {
    const key = `tenants/${tenantId}/${input.kind}/${randomUUID()}.${EXTENSION[input.contentType]}`
    const presigned = await this.storage.presignPost(key, input.contentType, UPLOAD_MAX_BYTES, PRESIGN_TTL_SECONDS)
    return { key, uploadUrl: presigned.url, fields: presigned.fields, publicUrl: this.storage.publicUrl(key) }
  }

  // Valida o objeto real (tamanho e magic bytes); se não bater, apaga e falha.
  async confirmUpload(tenantId: string, key: string): Promise<ConfirmedUpload> {
    if (!key.startsWith(`tenants/${tenantId}/`)) throw invalidUpload('Arquivo não pertence a esta loja.')

    const head = await this.storage.head(key)
    if (!head) throw invalidUpload('Arquivo não foi enviado.')

    const declared = extensionContentType(key)
    const detected = detectImageType(await this.storage.readLeadingBytes(key, 12))
    if (head.sizeBytes > UPLOAD_MAX_BYTES || !declared || detected !== declared) {
      await this.storage.delete(key)
      throw invalidUpload('O arquivo enviado não é uma imagem JPEG, PNG ou WebP válida.')
    }
    return { url: this.storage.publicUrl(key) }
  }
}

function extensionContentType(key: string): UploadContentType | null {
  const extension = key.split('.').pop()
  const entry = Object.entries(EXTENSION).find(([, ext]) => ext === extension)
  return entry ? (entry[0] as UploadContentType) : null
}

// Assinaturas: JPEG FF D8 FF; PNG 89 50 4E 47 0D 0A 1A 0A; WebP "RIFF"...."WEBP".
export function detectImageType(bytes: Uint8Array): UploadContentType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length >= 8 && png.every((byte, index) => bytes[index] === byte)) return 'image/png'
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}
