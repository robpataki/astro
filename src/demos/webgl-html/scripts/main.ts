import * as THREE from 'three';
import imagesLoaded from 'imagesloaded';
import FontFaceObserver from 'fontfaceobserver';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';
import noise from './shaders/noise.glsl';
import oceanImage from './img/ocean.jpg';

export default class Sketch {
  private container: HTMLElement;
  private time = 0;
  private width = 0;
  private height = 0;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  protected controls!: OrbitControls;
  private composer!: EffectComposer;
  private renderPass!: RenderPass;
  private customPass!: ShaderPass;

  private images!: HTMLImageElement[];

  constructor(private options: { dom: HTMLElement }) {
    this.container = this.options.dom;

    if (!this.container) {
      return;
    }

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
    this.camera.position.z = 600;

    /*
      Control exactly how big rendered objects should appear (in this case,
      the 100x100px object will measure 100x100px when rendered in the browser)
    */
    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.images = Array.from(document.querySelectorAll('img'));

    const fontOpen = new Promise<void>((resolve) => {
      new FontFaceObserver('Open Sans').load().then(() => {
        resolve();
      });
    });

    const fontPlayFair = new Promise<void>((resolve) => {
      new FontFaceObserver('Playfair Display').load().then(() => {
        resolve();
      });
    });

    const preloadImages = new Promise((resolve) => {
      imagesLoaded(document.querySelectorAll('img'), { background: true }, resolve);
    });

    const allDone = [fontOpen, fontPlayFair, preloadImages];

    Promise.all(allDone).then(() => {
      this.scroll = new Scroll();
      this.addImages();
      this.setPosition();

      this.mouseMovement();
      this.resize();
      this.setupResize();
      // this.addObjects();
      this.composerPass();
      this.render();
    });
  }

  addImages() {
    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();
      let { top, left, width, height } = bounds;

      let geometry = new THREE.PlaneGeometry(width, height, 1, 1);
      let texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      let material = new THREE.MeshBasicMaterial({
        // color: "#ff0000",
        map: texture,
      });
      let mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);

      return {
        img,
        ...{ top, left, width, height },
        mesh,
      };
    });
  }

  setPosition() {
    this.imageStore.forEach((o) => {
      o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
    });
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    const geometry = new THREE.PlaneGeometry(200, 400, 10, 10);
    // this.geometry = new THREE.SphereGeometry(0.4, 40, 40);
    // this.material = new THREE.MeshNormalMaterial();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        oceanTexture: { value: new THREE.TextureLoader().load(oceanImage.src) },
      },
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      wireframe: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  composerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    //custom shader pass
    var counter = 0.0;
    this.myEffect = {
      uniforms: {
        tDiffuse: { value: null },
        scrollSpeed: { value: null },
        time: { value: null },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix 
            * modelViewMatrix 
            * vec4( position, 1.0 );
        }
        `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        uniform float scrollSpeed;
        uniform float time;
        ${noise}
        void main(){
          vec2 newUV = vUv;
          float area = smoothstep(1.,0.6,vUv.y)*2. - 1.;
          // area = pow(area,4.);
          float noise = 0.5 * (cnoise(vec3(vUv*10., time)) + 1.);
          float n = smoothstep(0.5,0.51, noise + area);
          newUV.x -= (vUv.x - 0.5) * 0.1*area*scrollSpeed;
          gl_FragColor = texture2D( tDiffuse, newUV);
          // gl_FragColor = vec4(n,0.,0.,1.);
          gl_FragColor = mix(vec4(1.),texture2D(tDiffuse, newUV),n);
        }
        `,
    };

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;

    this.composer.addPass(this.customPass);
  }

  render() {
    this.time += 0.05;

    this.scroll.render();

    this.setPosition();
    this.customPass.uniforms.scrollSpeed.value = this.scroll.speedTarget;
    this.customPass.uniforms.time.value = this.time;

    this.composer.render();

    this.materials.forEach((material) => {
      material.uniforms.time.value = this.time;
    });

    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({ dom: document.querySelector('#container') });
