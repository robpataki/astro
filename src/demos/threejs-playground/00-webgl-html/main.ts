import * as THREE from 'three';
import imagesLoaded from 'imagesloaded';
import FontFaceObserver from 'fontfaceobserver';
import gsap from 'gsap';

import Scroll from './lib/scroll.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';
import noise from './shaders/noise.glsl';

import ocean from './img/ocean.jpg';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

type TImage = {
  img: HTMLImageElement;
  mesh: THREE.Mesh;
  top: number;
  left: number;
  width: number;
  height: number;
};

export default class Sketch {
  private container: HTMLElement | null;
  private time = 0;
  private width = 0;
  private height = 0;
  private currentScroll = 0;

  private mouse = new THREE.Vector2();
  private scroll!: Scroll;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster!: THREE.Raycaster;
  private composer!: EffectComposer;
  private renderPass!: RenderPass;
  private customPass!: ShaderPass;

  private images!: HTMLImageElement[];
  private material!: THREE.ShaderMaterial;
  private materials: THREE.ShaderMaterial[] = [];
  private imageStore!: TImage[];

  private myEffect!: Record<string, any>;

  constructor(private options: { container: HTMLElement | null }) {
    this.container = this.options.container;

    if (!this.container) {
      return;
    }

    this.scene = new THREE.Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
    this.camera.position.z = 600;

    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;

    this.images = Array.from(document.querySelectorAll('img'));

    const fontOpen = new Promise<void>((resolve) => {
      new FontFaceObserver('Open Sans').load().then(() => {
        resolve();
      });
    });

    const fontPlayfair = new Promise<void>((resolve) => {
      new FontFaceObserver('Playfair Display').load().then(() => {
        resolve();
      });
    });

    // Preload images
    const preloadImages = new Promise((resolve) => {
      imagesLoaded(document.querySelectorAll('img'), { background: true }, resolve);
    });

    let allDone = [fontOpen, fontPlayfair, preloadImages];
    this.raycaster = new THREE.Raycaster();

    Promise.all(allDone).then(() => {
      this.scroll = new Scroll();
      this.addImages();
      this.setPosition();
      this.handleResize();
      this.setupEvents();
      this.createComposerPass();
      this.render();
    });
  }

  createComposerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    //custom shader pass
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
          float area = smoothstep(1.,0.8,vUv.y)*2. - 1.;
          float area1 = smoothstep(0.4,0.0,vUv.y);
          area1 = pow(area1,4.);
          float noise = 0.5*(cnoise(vec3(vUv*10.,time/5.)) + 1.);
          float n = smoothstep(0.5,0.51, noise + area/2.);
          newUV.x -= (vUv.x - 0.5)*0.1*area1*scrollSpeed;
          gl_FragColor = texture2D( tDiffuse, newUV);
        //   gl_FragColor = vec4(n,0.,0.,1.);
        gl_FragColor = mix(vec4(1.),texture2D( tDiffuse, newUV),n);
        // gl_FragColor = vec4(area,0.,0.,1.);
        }
      `,
    };

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;

    this.composer.addPass(this.customPass);
  }

  handleMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / this.width) * 2 - 1;
    this.mouse.y = -(event.clientY / this.height) * 2 + 1;

    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      let obj = intersects[0].object as THREE.Mesh;
      (obj.material as THREE.ShaderMaterial).uniforms.hover.value = intersects[0].uv;
    }
  }

  addImages() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uImage: { value: 0 },
        hover: { value: new THREE.Vector2(0.5, 0.5) },
        hoverState: { value: 0 },
        oceanTexture: { value: new THREE.TextureLoader().load(ocean.src) },
      },
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      // wireframe: true,
    });

    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();

      let geometry = new THREE.PlaneGeometry(bounds.width, bounds.height, 10, 10);

      // ThreeJS bug (https://github.com/mrdoob/three.js/issues/23164) workaround
      let imgEl = document.createElement('img');
      imgEl.src = img.src;

      let texture = new THREE.Texture(imgEl);
      texture.needsUpdate = true;

      let material = this.material.clone();

      img.addEventListener('mouseenter', () => {
        gsap.to(material.uniforms.hoverState, {
          duration: 1,
          value: 1,
          ease: 'power3.out',
        });
      });

      img.addEventListener('mouseout', () => {
        gsap.to(material.uniforms.hoverState, {
          duration: 1,
          value: 0,
          ease: 'power3.out',
        });
      });

      this.materials.push(material);

      material.uniforms.uImage.value = texture;

      let mesh = new THREE.Mesh(geometry, material);

      this.scene.add(mesh);

      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });
  }

  setPosition() {
    this.imageStore.forEach((image) => {
      image.mesh.position.y = this.currentScroll - image.top + this.height / 2 - image.height / 2;
      image.mesh.position.x = image.left - this.width / 2 + image.width / 2;
    });
  }

  setupEvents() {
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  handleResize() {
    if (this.container) {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }
  }

  render() {
    this.time += 0.05;

    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;

    this.setPosition();
    this.customPass.uniforms.scrollSpeed.value = this.scroll.speedTarget;
    this.customPass.uniforms.time.value = this.time;

    this.materials.forEach((m) => {
      m.uniforms.time.value = this.time;
    });

    this.composer.render();
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({
  container: document.querySelector('#sketch-container'),
});
