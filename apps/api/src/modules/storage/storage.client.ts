import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

export interface PresignedPost {
  url: string
  fields: Record<string, string>
}

export interface ObjectHead {
  sizeBytes: number
  contentType: string | null
}

// Única classe que fala com o S3/MinIO. O StorageService (regras) é testado
// com esta classe mockada.
@Injectable()
export class StorageClient implements OnModuleInit {
  private readonly logger = new Logger(StorageClient.name)
  private readonly s3: S3Client
  readonly bucket: string
  readonly publicBaseUrl: string

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('STORAGE_BUCKET', 'pdv-media')
    this.publicBaseUrl = config
      .get<string>('STORAGE_PUBLIC_URL', `http://localhost:9000/${this.bucket}`)
      .replace(/\/$/, '')
    this.s3 = new S3Client({
      endpoint: config.get<string>('STORAGE_ENDPOINT', 'http://localhost:9000'),
      region: config.get<string>('STORAGE_REGION', 'us-east-1'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>('STORAGE_ACCESS_KEY'),
        secretAccessKey: config.getOrThrow<string>('STORAGE_SECRET_KEY'),
      },
    })
  }

  // Garante bucket com leitura pública (as fotos são servidas direto do MinIO).
  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }))
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }))
      this.logger.log(`Bucket "${this.bucket}" created`)
    }
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    }
    await this.s3
      .send(new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: JSON.stringify(policy) }))
      .catch((error: unknown) => {
        this.logger.warn(`Could not set public-read policy on "${this.bucket}": ${String(error)}`)
      })
  }

  presignPost(key: string, contentType: string, maxBytes: number, expiresInSeconds: number): Promise<PresignedPost> {
    return createPresignedPost(this.s3, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 1, maxBytes],
        ['eq', '$Content-Type', contentType],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: expiresInSeconds,
    })
  }

  async head(key: string): Promise<ObjectHead | null> {
    try {
      const result = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return { sizeBytes: result.ContentLength ?? 0, contentType: result.ContentType ?? null }
    } catch {
      return null
    }
  }

  async readLeadingBytes(key: string, length: number): Promise<Uint8Array> {
    const result = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: `bytes=0-${length - 1}` }),
    )
    const bytes = await result.Body?.transformToByteArray()
    return bytes ?? new Uint8Array()
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`
  }
}
