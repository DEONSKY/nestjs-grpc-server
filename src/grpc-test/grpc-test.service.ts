import { Injectable, Inject, Logger, Body, Get, Post } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { resolve } from 'dns';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { Feature, IGrpcService, Point, Rectangle, RouteNote, RouteSummary } from './grpc.interface';
const fs = require('fs')
var _ = require('lodash');

@Injectable()
export class GrpcTestService {
  private logger = new Logger('GrpcTestService');
  private feature_list = [];
  private route_notes = {};

  onModuleInit() { 
    fs.readFile("src/grpc-test/route_guide_db.json", (err, data) => {
      if (err) throw err;
      this.feature_list = JSON.parse(data);
    })
  }

  checkFeature(point) {
    var feature;
    // Check if there is already a feature object for the given point
    for (var i = 0; i < this.feature_list.length; i++) {
      feature = this.feature_list[i];
      if (feature.location.latitude === point.latitude &&
          feature.location.longitude === point.longitude) {
        return feature;
      }
    }
    var name = '';
    feature = {
      name: name,
      location: point
    };
    return feature;
  }
  
  async getFeature( data: Point) {

    return this.checkFeature(data); // <-- to this
  }

  listFeatures(rectangle) {

    const stream =  new Subject<any>();
   
    this.streamList(rectangle,stream)
    this.logger.log("returning")
    //stream.complete()
    return stream.asObservable();
    
  }

  async streamList(rectangle,stream: Subject<any>){
    var lo = rectangle.lo;
    var hi = rectangle.hi;
    var left = _.min([lo.longitude, hi.longitude]);
    var right = _.max([lo.longitude, hi.longitude]);
    var top = _.max([lo.latitude, hi.latitude]);
    var bottom = _.min([lo.latitude, hi.latitude]);

    
    // For each feature, check if it is in the given bounding box
    for await(const feature of this.feature_list) {
      if (feature.name === '') {
        this.logger.log("returning in")
        stream.complete()
        return;
      }
      if (feature.location.longitude >= left &&
          feature.location.longitude <= right &&
          feature.location.latitude >= bottom &&
          feature.location.latitude <= top) {
            await this.sleep(100);
            this.logger.log("here")
            stream.next(feature);
      }
    };
    stream.complete()
    this.logger.log("finish")
  }

  routeRecord (requestStream, callback) {

    var point_count = 0;
    var feature_count = 0;
    var distance = 0;
    var previous = null;
    // Start a timer
    var start_time = process.hrtime();
    this.logger.log("hit")


    requestStream.on('data',(point) => {
      this.logger.log("here -222")
      point_count += 1;
      if (this.checkFeature(point).name !== '') {
        feature_count += 1;
      }
      /* For each point after the first, add the incremental distance from the
       * previous point to the total distance value */
      if (previous != null) {
        distance += this.getDistance(previous, point);
      }
      previous = point;
    });
    requestStream.on('end', () => {
      callback(null, {
        pointCount: point_count,
        featureCount: feature_count,
        // Cast the distance to an integer
        distance: distance|0,
        // End the timer
        elapsedTime: process.hrtime(start_time)[0]
      });
    });
  }

  async routeRecord2 (points: Observable<Point>) {

    var point_count = 0;
    var feature_count = 0;
    var distance = 0;
    var previous = null;
    // Start a timer
    var start_time = process.hrtime();

    

    const promise = new Promise((thisResolve, thisReject)=> {
      
      const onNext = point => {
        this.logger.log("here")
        point_count += 1;
        if (this.checkFeature(point).name !== '') {
          feature_count += 1;
        }
        /* For each point after the first, add the incremental distance from the
         * previous point to the total distance value */
        if (previous != null) {
          distance += this.getDistance(previous, point);
        }
        previous = point;
      };
      const onComplete = () => {
        thisResolve({
          pointCount: point_count,
          featureCount: feature_count,
          // Cast the distance to an integer
          distance: distance|0,
          // End the timer
          elapsedTime: process.hrtime(start_time)[0]
      })
        
      };
      
      points.subscribe({
        
        next:onNext,
        complete:onComplete
      });
    });



    return promise
  }

  pointKey(point) {
    return point.latitude + ' ' + point.longitude;
  }

  routeChat (call) {

    call.on('data', (note) => {
      this.logger.log(note)
      var key = this.pointKey(note.location);
      /* For each note sent, respond with all previous notes that correspond to
       * the same point */
      if (this.route_notes.hasOwnProperty(key)) {
        this.logger.log("call -- {}",note)
        _.each(this.route_notes[key], (note) => {
          call.write(note);
        });
      } else {
        this.route_notes[key] = [];
      }
      // Then add the new note to the list
      this.route_notes[key].push(JSON.parse(JSON.stringify(note)));
    });
    call.on('end', () => {
      call.end();
    });
  }

  getDistance(start, end) {
    var COORD_FACTOR = 1e7;
    function toRadians(num) {
      return num * Math.PI / 180;
    }
    var R = 6371000;  // earth radius in metres
    var lat1 = toRadians(start.latitude / COORD_FACTOR);
    var lat2 = toRadians(end.latitude / COORD_FACTOR);
    var lon1 = toRadians(start.longitude / COORD_FACTOR);
    var lon2 = toRadians(end.longitude / COORD_FACTOR);
  
    var deltalat = lat2-lat1;
    var deltalon = lon2-lon1;
    var a = Math.sin(deltalat/2) * Math.sin(deltalat/2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltalon/2) * Math.sin(deltalon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /*
  async getFeaturess( data: RectangleInput) {

    const res = this.grpcService.listFeatures(data)
    res.subscribe((v) => this.logger.log(`value: ${v.name}`));
    return res.pipe(toArray())
  }

  async recordRoutee( data: PointInput[]) {

    const upstream = new ReplaySubject<PointInput>();

    const ob = this.grpcService.recordRoute(upstream)

    for (const val of data){
      this.logger.log("Sending", val)
      await this.sleep(100)
      upstream.next(val)
    }
    upstream.complete()
    return ob
  }

  async routeChatt( data: RouteNote[]) {
    
    const upstream = new ReplaySubject<RouteNote>();
    
    let res:RouteNote[]=[];

    const ob = this.grpcService.routeChat(upstream)
    const sub = ob.subscribe((v) => {
      this.logger.log(`value: ${v.message}`)
      res.push(v)
    });
    //ob.subscribe((v) => console.log(`value: ${v.message}`));
    for(const val of data){
      console.log(`Sending: ${val.message}`);
      await this.sleep(1000)
      upstream.next(val);
    }
    
    //ob.subscribe(y=>console.log(y,new Date()))


    upstream.complete()
    return res
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
*/
}
