import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import fragment from './shaders/fragment.glsl';
import vertex from './shaders/terrain.vert';

type ShapeObject = THREE.Object3D<THREE.Object3DEventMap>;

export default class Terrain {
  private time = 0;
  private width = 0;
  private height = 0;

  private container!: HTMLElement | null;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  protected controls!: any; // Where does one get the type for OrbitControls?

  private plane!: ShapeObject;
  private material!: THREE.ShaderMaterial;

  constructor(private options: { container: HTMLElement | null }) {
    if (!this.options.container) {
      return;
    }
    this.container = this.options.container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.scene = new THREE.Scene();
    this.scene.rotation.z = THREE.MathUtils.degToRad(90);

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.01, 10);
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.addObjects();
    this.handleResize();
    this.setupEvents();
    this.render();
  }

  addObjects() {
    const geometry = new THREE.PlaneGeometry(4, 12, 100, 300);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      wireframe: true,
    });
    this.plane = new THREE.Mesh(geometry, this.material);
    this.plane.rotation.y = THREE.MathUtils.degToRad(45);
    this.scene.add(this.plane);
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
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;

    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Terrain({
  container: document.querySelector('#container'),
});
