import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import vertex from './shaders/vertex.glsl';
import fragment from './shaders/fragment.glsl';

import Pointer from '@scripts/webgl/pointer';

type ShapeObject = THREE.Object3D<THREE.Object3DEventMap>;

export default class Blob {
  private time = 0;
  private width = 0;
  private height = 0;

  private container!: HTMLElement | null;
  protected pointer!: Pointer;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private raycaster!: THREE.Raycaster;
  protected controls!: any; // Where does one get the type for OrbitControls?

  private uniformData!: any;

  private plane!: ShapeObject;

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
    this.camera.position.z = 50;

    this.camera.fov = 2 * Math.atan(this.height / 2 / 1000) * (180 / Math.PI);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.x += 40;
    dirLight.position.y += 60;
    dirLight.position.z = -40;
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    const d = 100;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    let target = new THREE.Object3D();
    target.position.z = -20;
    dirLight.target = target;
    dirLight.target.updateMatrixWorld();

    dirLight.shadow.camera.lookAt(0, 0, -30);
    this.scene.add(dirLight);
    this.scene.add(new THREE.CameraHelper(dirLight.shadow.camera));

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.uniformData = {
      u_time: {
        type: 'f',
        value: this.time,
      },
      u_hover: {
        type: 'f',
        value: new THREE.Vector2(0.5, 0.5),
      },
    };

    this.pointer = new Pointer({ onMove: this.onPointerMove.bind(this) });
    this.raycaster = new THREE.Raycaster();

    this.addObjects();
    this.handleResize();
    this.setupEvents();
    this.render();
  }

  addObjects() {
    const geometry = new THREE.PlaneGeometry(40, 40, 10, 10);
    // const geometry = new THREE.BoxGeometry(40, 40, 20, 20);
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      // wireframe: true,
      uniforms: this.uniformData,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.receiveShadow = true;
    this.plane.castShadow = true;
    /* this.plane.rotation.x = -Math.PI / 2;
    this.plane.position.z = -30; */
    /* this.plane.rotation.x = THREE.MathUtils.degToRad(60);
    this.plane.rotation.y = THREE.MathUtils.degToRad(120);
    this.plane.rotation.z = THREE.MathUtils.degToRad(90); */
    this.scene.add(this.plane);
  }

  setupEvents() {
    window.addEventListener('resize', this.handleResize.bind(this));
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

  onPointerMove() {
    // update the picking ray with the camera and mouse position
    const vector = new THREE.Vector2(this.pointer.coords.x, this.pointer.coords.y);
    this.raycaster.setFromCamera(vector, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      let obj = intersects[0].object as THREE.Mesh;
      (obj.material as THREE.ShaderMaterial).uniforms.u_hover.value = intersects[0].uv;
    }
  }

  render() {
    this.time += 0.001;
    this.uniformData.u_time.value = this.time;

    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Blob({ container: document.querySelector('#container') });
