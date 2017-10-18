import { Scene } from './scene';
import { Rocket } from './rocket';
import { Point2D } from './classes';

let width = window.innerWidth;
let height = window.innerHeight;
let min_side = Math.min(width, height);

function setUp(scene: Scene){
  let big_obstacle = scene.addElement(
    'circle',
    {
      'cx': width / 2,
      'cy': min_side / 2,
      'radius': min_side / 10
    }
  );
  let big_obstacle_center = big_obstacle.get2DCenter();
  let big_obstacle_radius = big_obstacle.getRadius();

  let destination_radius = big_obstacle_radius / 5;
  let destination = scene.addElement(
    'circle',
    {
      'cx': big_obstacle_center.x + big_obstacle_radius + destination_radius,
      'cy': big_obstacle_center.y - big_obstacle_radius + destination_radius,
      'radius': destination_radius
    }
  );

  let origin_radius = big_obstacle_radius / 7;
  let origin = scene.addElement(
    'circle',
    {
      'cx': big_obstacle_center.x - big_obstacle_radius * 2 - origin_radius,
      'cy': big_obstacle_center.y - big_obstacle_radius * 2 - origin_radius,
      'radius': origin_radius
    }
  );

  scene.origin = origin;
  scene.destination = destination;

  scene.obstacles = [
    big_obstacle,
    origin
  ]

  scene.render(10);
  scene.startActivity(
    10
  );
  scene.startRockets(
    50
  );
}

let scene = new Scene(
  width,
  height,
  setUp
)
