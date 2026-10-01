import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: false });
  // const allowedOrigins = new Set([
  //   'https://atm-crackers-site.on-forge.com',
  //   'https://atm-crackers-admin.on-forge.com',
  //   'http://localhost:3018',
  //   'http://localhost:3019',
  // ]);

  // app.enableCors({
  //   origin: (origin, callback) => {
  //     // Allow non-browser requests such as Swagger/curl, which have no Origin header.
  //     if (!origin || allowedOrigins.has(origin)) {
  //       callback(null, true);
  //       return;
  //     }

  //     callback(new Error('Origin not allowed by CORS'));
  //   },
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  //   credentials: false,
  // });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('ATM Crackers API')
    .setDescription(
      'API documentation for the ATM Crackers Online Ordering System',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the JWT access token',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3018;

  await app.listen(port);

  console.log(`ATM Crackers Backend running on port ${port}`);
}

void bootstrap();
