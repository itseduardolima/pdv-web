import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { SESSION_COOKIE } from './common/types/request'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.use(cookieParser())
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3000').split(','),
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PDV API')
    .setDescription(
      'Toda rota é escopada ao tenant resolvido pelo host. No "Try it out", o header ' +
        'x-tenant-host abaixo já vem preenchido com a loja de demonstração (seed). ' +
        'Rotas com cadeado usam o cookie pdv_session, que o próprio POST /auth/login seta neste navegador.',
    )
    .setVersion('0.0.0')
    .addGlobalParameters({
      name: 'x-tenant-host',
      in: 'header',
      required: true,
      description: 'Host da loja (<slug>.APP_BASE_DOMAIN ou domínio próprio)',
      schema: { type: 'string', default: `demo.${config.get<string>('APP_BASE_DOMAIN', 'app.localhost')}` },
    })
    .addCookieAuth(SESSION_COOKIE)
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  await app.listen(config.get<number>('PORT', 3001))
}

void bootstrap()
