import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RouteGuide } from './grpc-test/grpc-test.controller';
import { GrpcTestService } from './grpc-test/grpc-test.service';
import { MathService } from './math.service';

@Module({
  imports: [],
  controllers: [AppController,RouteGuide],
  providers: [MathService,GrpcTestService],
})
export class AppModule {}
