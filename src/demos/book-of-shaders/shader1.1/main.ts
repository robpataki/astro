import * as THREE from 'three';
import Studio from '@scripts/webgl/studio';
import fragment from './shader.frag';

const createShapes = () => {
  const planeGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
  const planeMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      u_time: { value: 0.0 },
    },
    fragmentShader: fragment,
  });
  const plane = new THREE.Mesh(planeGeo, planeMaterial);

  return [plane];
};

const studio = new Studio({
  container: document.querySelector('#container'),
});

const shapes = createShapes();
studio.addShapes(shapes);
