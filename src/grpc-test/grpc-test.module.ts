// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { RouteGuide } from './grpc-test.controller';
import { GrpcTestService } from './grpc-test.service';

@Module({
  providers: [
    GrpcTestService,
    RouteGuide,
  ],
})
export class GrpcTestModule {}