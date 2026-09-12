import { useMutation } from '@tanstack/react-query'
import { confirmedUploadSchema, uploadTicketSchema, type UploadKind } from '@pdv/shared'
import { ApiClientError, apiRequest } from '@/lib/api-client'

// Upload por URL assinada (08-seguranca § 6): a API emite a permissão, o
// browser envia o arquivo direto ao storage, a API confere o que chegou.
export function useUploadImage(kind: UploadKind) {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const ticket = await apiRequest('/uploads', {
        method: 'POST',
        body: { kind, contentType: file.type, sizeBytes: file.size },
        schema: uploadTicketSchema,
      })

      const form = new FormData()
      for (const [name, value] of Object.entries(ticket.fields)) form.append(name, value)
      form.append('file', file)
      const upload = await fetch(ticket.uploadUrl, { method: 'POST', body: form })
      if (!upload.ok) {
        throw new ApiClientError({
          statusCode: upload.status,
          code: 'UPLOAD_FAILED',
          message: 'Não foi possível enviar a imagem.',
        })
      }

      const confirmed = await apiRequest('/uploads/confirm', {
        method: 'POST',
        body: { key: ticket.key },
        schema: confirmedUploadSchema,
      })
      return confirmed.url
    },
  })
}
