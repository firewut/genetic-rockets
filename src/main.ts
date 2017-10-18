import { Scene } from './scene';
import { Rocket } from './rocket';
import { Point2D } from './classes';

let width = window.innerWidth;
let height = window.innerHeight;
let min_side = Math.min(width, height);

function setUp(scene: Scene){
  let sun = scene.addElement(
    'circle',
    {
      'cx': width / 2,
      'cy': min_side / 2,
      'radius': min_side / 8
    }
  );
  let sun_center = sun.get2DCenter();
  let sun_radius = sun.getRadius();

  let destination_radius = sun_radius / 5;
  let destination = scene.addElement(
    'circle',
    {
      'cx': sun_center.x + sun_radius + destination_radius,
      'cy': sun_center.y + sun_radius + destination_radius,
      'radius': destination_radius
    }
  );

  let origin_radius = sun_radius / 3;
  let origin = scene.addElement(
    'circle',
    {
      'cx': sun_center.x - sun_radius - origin_radius,
      'cy': sun_center.y - sun_radius - origin_radius,
      'radius': origin_radius
    }
  );

  scene.origin = origin;
  scene.destination = destination;

  scene.render(50);
  scene.startActivity(
    50
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
