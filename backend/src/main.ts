import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'];
  app.enableCors({ origin: allowedOrigins, credentials: true });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
