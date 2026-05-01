import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env['PORT'] || 3001;
  await app.listen(port);
  console.log(`agent-bridge API running on http://localhost:${port}`);
}

bootstrap();
