import { Observable} from 'rxjs';

export interface IGrpcService {
  getFeature(point: Point): Observable<any>,
  listFeatures(rectangle:  Rectangle): Observable<any>
  recordRoute(points: Observable<Point>) : Promise<RouteSummary>
  routeChat(routeNote: Observable<RouteNote>): Observable<any>
}

export interface Point {
  latitude: number;
  longitude :number;
}

export interface Feature {
  name: string;
  location :Point;
}

export interface Rectangle {
  lo: Point;
  hi: Point;
}

export interface RouteNote {
  location: Point;
  message: string;
}

export interface RouteSummary {
  // The number of points received.
  point_count: number;

  // The number of known features passed while traversing the route.
  feature_count: number;

  // The distance covered in metres.
  distance : number;

  // The duration of the traversal in seconds.
  elapsed_time : number;
}
