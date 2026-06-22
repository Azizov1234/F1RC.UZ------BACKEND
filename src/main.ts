import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true
    })
  )
  const  config= new DocumentBuilder()
  .setTitle("F1RC.UZ API")
  .setDescription(
    "Only racers"
  )
  .setVersion('1.0')
  .addBearerAuth()
  .build()
  const  document= SwaggerModule.createDocument(app,config)

  SwaggerModule.setup("swagger", app, document, {
    swaggerOptions:{
      persistAuthorization:true
    }
  })
   const PORT = Number(process.env.PORT) || 3002;
  const HOST = process.env.HOST || '0.0.0.0';

  await app.listen(PORT, HOST);

  const swaggerHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Swagger hujjatlari: http://${swaggerHost}:${PORT}/swagger`);
}
bootstrap();
