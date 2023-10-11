import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type ShapeObject = THREE.Object3D<THREE.Object3DEventMap>;

export default class Playground {
  private time = 0;
  private width = 0;
  private height = 0;

  private container!: HTMLElement | null;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  protected controls!: any; // Where does one get the type for OrbitControls?

  private uniformData!: any;

  private box!: ShapeObject;

  constructor(private options: { container: HTMLElement | null }) {
    if (!this.options.container) {
      return;
    }
    this.container = this.options.container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

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

    this.uniformData = {
      u_time: {
        type: 'f',
        value: this.time,
      },
    };

    this.addObjects();
    this.handleResize();
    this.setupEvents();
    this.render();
  }

  addObjects() {
    const boxGeometry = new THREE.BoxGeometry(20, 10, 100, 10, 10, 100);
    const boxMaterial = new THREE.ShaderMaterial({
      wireframe: true,
      uniforms: this.uniformData,
      vertexShader: `
      varying vec3 pos;
      uniform float u_time;

      void main()	{
        vec4 result;
        pos = position;

        result = vec4(
          position.x,
          4.0*sin(position.z/4.0 + u_time * 5.) + position.y,
          position.z,
          1.0
        );

        gl_Position = projectionMatrix
          * modelViewMatrix
          * result;
      }`,
    });
    this.box = new THREE.Mesh(boxGeometry, boxMaterial);
    this.box.rotation.x = THREE.MathUtils.degToRad(45);
    this.box.rotation.y = THREE.MathUtils.degToRad(45);
    this.scene.add(this.box);
  }

  handleResize() {
    if (!this.container) {
      return;
    }

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  setupEvents() {
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  render() {
    this.time += 0.005;
    this.uniformData.u_time.value = this.time;

    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Playground({
  container: document.querySelector('#container'),
});
