import { Controller, Logger } from '@nestjs/common';
import { IGrpcService, Point,Feature, Rectangle, RouteNote, RouteSummary } from './grpc.interface';
// import { MessagePattern } from '@nestjs/microservices'; <-- Change this
import { GrpcMethod, GrpcStreamCall, GrpcStreamMethod } from '@nestjs/microservices'; //     <-- to this
import { GrpcTestService } from './grpc-test.service';
import { Writable } from 'stream';
import { Observable } from 'rxjs';
import { Metadata, ServerDuplexStream } from 'grpc';


@Controller()
export class RouteGuide {
  private logger = new Logger('GrpcTestController');

  constructor(private grpcTestService: GrpcTestService) {}

  // @MessagePattern('add')                     <--  Change this
  @GrpcMethod() 
  getFeature(point: Point, metadata: any): Promise<Feature> { 
    this.logger.log('Adding ' + point.toString()); 
    return this.grpcTestService.getFeature(point) ; 
  }
  @GrpcMethod() 
  listFeatures(rectangle: Rectangle):Observable<any> { 
    this.logger.log('l ' + rectangle.toString()); 
    return this.grpcTestService.listFeatures(rectangle); 
  }
  @GrpcStreamCall() 
  recordRoute(requestStream: any, callback: (err: unknown, value: RouteSummary) => void){ 
    this.logger.log('l ' + requestStream.toString()); 
    return this.grpcTestService.routeRecord(requestStream,callback); 
  }
/*
  @GrpcStreamMethod() 
  recordRoute(points: Observable<Point>){ 
    this.logger.log('l ' + points.toString()); 
    return this.grpcTestService.routeRecord2(points); 
  }
*/
  @GrpcStreamCall()
  routeChat(call: Observable<RouteNote>){
    return this.grpcTestService.routeChat(call);
  }                                                
}
