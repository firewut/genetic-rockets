import { Scene } from './scene';
import { Rocket } from './rocket';
import { Point2D } from './classes';

let width = window.innerWidth;
let height = window.innerHeight;
let min_side = Math.min(width, height);

function setUp(scene: Scene){
  let destination_radius = min_side / 25;
  let destination = scene.addElement(
    'circle',
    {
      'cx': width / 2,
      'cy': min_side / 10,
      'radius': destination_radius
    }
  );

  let destination_path = destination.get2DPath();
  let origin_radius = min_side / 30;
  let origin = scene.addElement(
    'circle',
    {
      'cx': destination_path[0].x,
      'cy': destination_path[0].y + min_side / 4,
      'radius': origin_radius
    }
  );

  scene.render(100);
  scene.startActivity(
    100,
    25,
    origin,
    destination
  );
}

let scene = new Scene(
  width,
  height,
  setUp
)
