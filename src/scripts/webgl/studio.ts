import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type ShapeObject = THREE.Object3D<THREE.Object3DEventMap>;

export default class Studio {
  protected TIME_UNIT = 0.005;
  private time = 0;
  private timeUnit!: number;
  private width = 0;
  private height = 0;
  private container!: HTMLElement | null;
  private shapes: ShapeObject[] = [];

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  protected controls!: any; // Where does one get the type for OrbitControls?

  constructor(private options: { container: HTMLElement | null; timeUnit?: number }) {
    if (!this.options.container) {
      console.warn('[studio] - container element is undefined');
      return;
    }
    this.container = this.options.container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.timeUnit = this.options.timeUnit || this.TIME_UNIT;

    this.scene = new THREE.Scene();
    this.scene.rotation.z = THREE.MathUtils.degToRad(90);

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 10, 1000);
    this.camera.position.z = 100;

    this.camera.fov = 2 * Math.atan(this.height / 2 / 1000) * (180 / Math.PI);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.handleResize();
    this.setupEvents();
    this.render();
  }

  public addShapes(shapes: ShapeObject[]) {
    shapes.map((shape) => {
      this.shapes.push(shape);
      this.scene.add(shape);
    });
  }

  private handleResize() {
    if (!this.container) {
      return;
    }

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  private setupEvents() {
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private render() {
    this.time += this.timeUnit;

    // Update the uniform values in each shape
    this.shapes.map((shape) => {
      const shapeWithUniforms = (shape as THREE.Mesh).material as THREE.ShaderMaterial;

      if (shapeWithUniforms.uniforms.u_time) {
        shapeWithUniforms.uniforms.u_time.value = this.time;
      }
      if (shapeWithUniforms.uniforms.u_resolution) {
        shapeWithUniforms.uniforms.u_resolution.value = { x: this.width, y: this.height };
      }
      if (shapeWithUniforms.uniforms.u_mouse) {
        shapeWithUniforms.uniforms.u_mouse.value = { x: 0, y: 0 };
      }
    });

    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));
  }
}
