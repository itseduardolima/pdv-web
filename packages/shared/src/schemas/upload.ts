import { z } from 'zod'

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024

export const uploadKindSchema = z.enum(['product', 'operator', 'tenant-logo'])
export type UploadKind = z.infer<typeof uploadKindSchema>

export const uploadContentTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp'], {
  errorMap: () => ({ message: 'Envie uma imagem JPEG, PNG ou WebP' }),
})
export type UploadContentType = z.infer<typeof uploadContentTypeSchema>

export const createUploadSchema = z.object({
  kind: uploadKindSchema,
  contentType: uploadContentTypeSchema,
  sizeBytes: z
    .number({ invalid_type_error: 'Tamanho inválido' })
    .int()
    .positive('Arquivo vazio')
    .max(UPLOAD_MAX_BYTES, 'A imagem deve ter no máximo 5 MB'),
})
export type CreateUploadInput = z.infer<typeof createUploadSchema>

// Presigned POST: o browser envia `fields` + o arquivo como multipart para `uploadUrl`.
export const uploadTicketSchema = z.object({
  key: z.string(),
  uploadUrl: z.string().url(),
  fields: z.record(z.string()),
  publicUrl: z.string().url(),
})
export type UploadTicket = z.infer<typeof uploadTicketSchema>

export const confirmUploadSchema = z.object({ key: z.string().min(1) })
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>

export const confirmedUploadSchema = z.object({ url: z.string().url() })
export type ConfirmedUpload = z.infer<typeof confirmedUploadSchema>
