import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { join } from 'path'; // <-- Add this

const logger = new Logger('Main');
const microserviceOptions = {
  // transport: Transport.REDIS,  <-- Change this
  transport: Transport.GRPC,  //  <-- to this
  options: {
    url: 'localhost:50051',                 
    package: 'routeguide', //                                 <-- add this
    protoPath: join(__dirname, '../src/grpc-test/route_guide.proto'), // <-- & this
  },
};

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, microserviceOptions);
  app.listen(() => {
    logger.log('Microservice is listening...');
  });
}
bootstrap();
