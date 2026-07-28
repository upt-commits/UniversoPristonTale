import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // O Agente se comunica na porta 3001 conforme especificado no UPT Network Architecture
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
