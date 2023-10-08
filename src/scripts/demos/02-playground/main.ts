import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

type MaterialOptions = Record<string, string | boolean | number>
type ShapeObject = any //THREE.Object3D<THREE.Object3DEventMap>;

export default class Playground {
  private time = 0
  private shapeDistance = 200
  private shapeSize = 20
  private width = 0
  private height = 0
  private cameraStartingPos = { x: 0, y: 100, z: 300 }
  private pointer = new THREE.Vector2()

  private container!: HTMLElement | null

  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private raycaster!: THREE.Raycaster
  protected controls!: any // Where does one get the type for OrbitControls?

  private activeObject: ShapeObject | null = null
  private cachedActiveObject: ShapeObject | null = null
  private selectedObject: ShapeObject | null = null
  private basicMaterialOptions: MaterialOptions = {
    color: '#ff0000',
    wireframe: true,
  }
  private activeMaterialOptions!: MaterialOptions
  private selectedMaterialOptions!: MaterialOptions
  private basicMaterial!: THREE.MeshBasicMaterial
  private doubleSidedMaterial!: THREE.MeshBasicMaterial

  private sphere!: ShapeObject
  private capsule!: ShapeObject
  private torus!: ShapeObject
  private cone!: ShapeObject
  private circle!: ShapeObject
  private cylinder!: ShapeObject
  private plane!: ShapeObject
  private dodecahedron!: ShapeObject
  private icosahedron!: ShapeObject
  private octahedron!: ShapeObject
  private ring!: ShapeObject
  private tetrahedron!: ShapeObject
  private torusKnot!: ShapeObject
  private interactiveObjects: Array<ShapeObject> = []

  constructor(private options: { container: HTMLElement | null }) {
    if (!this.options.container) {
      return
    }
    this.container = this.options.container
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight

    this.scene = new THREE.Scene()
    this.scene.rotation.y = THREE.MathUtils.degToRad(300)

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 10, 1000)
    this.camera.position.x = this.cameraStartingPos.x
    this.camera.position.y = this.cameraStartingPos.y
    this.camera.position.z = this.cameraStartingPos.z

    this.camera.fov = 2 * Math.atan(this.height / 2 / 500) * (180 / Math.PI)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.container.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.raycaster = new THREE.Raycaster()
    this.basicMaterial = new THREE.MeshBasicMaterial(this.basicMaterialOptions)
    this.doubleSidedMaterial = new THREE.MeshBasicMaterial({
      ...this.basicMaterialOptions,
      side: THREE.DoubleSide,
    })

    this.activeMaterialOptions = {
      color: '#000000',
      wireframe: true,
    }

    this.selectedMaterialOptions = {
      color: '#0000ff',
    }

    this.addHelpers()
    this.pointer.set(-100000, 100000)
    this.addObjects()
    this.handleResize()
    this.setupEvents()
    this.render()
  }

  addHelpers() {
    const axesHelper = new THREE.AxesHelper(100)
    this.scene.add(axesHelper)

    const lowerPlaneGeometry = new THREE.PlaneGeometry(this.shapeSize * 500, this.shapeSize * 500, 10, 10)
    const lowerPlaneMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: '#ff0000',
      transparent: true,
      opacity: 0.1,
    })
    const lowerPlane = new THREE.Mesh(lowerPlaneGeometry, lowerPlaneMaterial)
    lowerPlane.rotation.x = THREE.MathUtils.degToRad(90)
    lowerPlane.position.y = -400
    this.scene.add(lowerPlane)
  }

  addObjects() {
    // Sphere
    const sphereGeometry = new THREE.SphereGeometry(this.shapeSize, 10, 10)
    this.sphere = new THREE.Mesh(sphereGeometry, this.basicMaterial.clone())
    this.sphere.startPos = this.sphere.position
    this.sphere.name = 'sphere'
    this.scene.add(this.sphere)
    this.interactiveObjects.push(this.sphere)

    // Capsule
    const capsuleGeometry = new THREE.CapsuleGeometry(this.shapeSize, this.shapeSize, 4, 8)
    this.capsule = new THREE.Mesh(capsuleGeometry, this.basicMaterial.clone())
    this.capsule.position.x = -this.shapeDistance
    this.capsule.startPos = this.capsule.position
    this.capsule.name = 'capsule'
    this.scene.add(this.capsule)
    this.interactiveObjects.push(this.capsule)

    // Torus
    const torusGeometry = new THREE.TorusGeometry(this.shapeSize, 5, 10, 20)
    this.torus = new THREE.Mesh(torusGeometry, this.basicMaterial.clone())
    this.torus.position.x = this.shapeDistance
    this.torus.startPos = this.torus.position
    this.torus.name = 'torus'
    this.scene.add(this.torus)
    this.interactiveObjects.push(this.torus)

    // Cone
    const coneGeometry = new THREE.ConeGeometry(this.shapeSize, this.shapeSize * 3, 10, 10)
    this.cone = new THREE.Mesh(coneGeometry, this.basicMaterial.clone())
    this.cone.position.z = -this.shapeDistance
    this.cone.startPos = this.cone.position
    this.cone.name = 'cone'
    this.scene.add(this.cone)
    this.interactiveObjects.push(this.cone)

    // Circle
    const circleGeometry = new THREE.CircleGeometry(this.shapeSize, 10)
    this.circle = new THREE.Mesh(circleGeometry, this.doubleSidedMaterial.clone())
    this.circle.position.x = -this.shapeDistance
    this.circle.position.z = -this.shapeDistance
    this.circle.startPos = this.circle.position
    this.circle.name = 'circle'
    this.scene.add(this.circle)
    this.interactiveObjects.push(this.circle)

    // Cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(this.shapeSize, this.shapeSize, this.shapeSize * 3, 10, 10)
    this.cylinder = new THREE.Mesh(cylinderGeometry, this.basicMaterial.clone())
    this.cylinder.position.x = this.shapeDistance
    this.cylinder.position.z = -this.shapeDistance
    this.cylinder.startPos = this.cylinder.position
    this.cylinder.name = 'cylinder'
    this.scene.add(this.cylinder)
    this.interactiveObjects.push(this.cylinder)

    // Plane
    const planeGeometry = new THREE.PlaneGeometry(this.shapeSize, this.shapeSize, 1, 1)
    this.plane = new THREE.Mesh(planeGeometry, this.doubleSidedMaterial.clone())
    this.plane.position.x = -this.shapeDistance
    this.plane.position.z = this.shapeDistance
    this.plane.startPos = this.plane.position
    this.plane.name = 'plane'
    this.scene.add(this.plane)
    this.interactiveObjects.push(this.plane)

    // Dodecahedron
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(this.shapeSize)
    this.dodecahedron = new THREE.Mesh(dodecahedronGeometry, this.basicMaterial.clone())
    this.dodecahedron.position.z = this.shapeDistance
    this.dodecahedron.startPos = this.dodecahedron.position
    this.dodecahedron.name = 'dodecahedron'
    this.scene.add(this.dodecahedron)
    this.interactiveObjects.push(this.dodecahedron)

    // Icosahedron
    const icosahedronGeometry = new THREE.IcosahedronGeometry(this.shapeSize)
    this.icosahedron = new THREE.Mesh(icosahedronGeometry, this.basicMaterial.clone())
    this.icosahedron.position.z = this.shapeDistance
    this.icosahedron.position.x = this.shapeDistance
    this.icosahedron.startPos = this.icosahedron.position
    this.icosahedron.name = 'icosahedron'
    this.scene.add(this.icosahedron)
    this.interactiveObjects.push(this.icosahedron)

    // Octahedron
    const octahedronGeometry = new THREE.OctahedronGeometry(this.shapeSize)
    this.octahedron = new THREE.Mesh(octahedronGeometry, this.basicMaterial.clone())
    this.octahedron.position.y = this.shapeDistance
    this.octahedron.startPos = this.octahedron.position
    this.octahedron.name = 'octahedron'
    this.scene.add(this.octahedron)
    this.interactiveObjects.push(this.octahedron)

    // Ring
    const ringGeometry = new THREE.RingGeometry(this.shapeSize)
    this.ring = new THREE.Mesh(ringGeometry, this.doubleSidedMaterial.clone())
    this.ring.position.y = this.shapeDistance
    this.ring.position.x = this.shapeDistance
    this.ring.startPos = this.ring.position
    this.ring.name = 'ring'
    this.scene.add(this.ring)
    this.interactiveObjects.push(this.ring)

    // Tetrahedron
    const tetrahedronGeometry = new THREE.TetrahedronGeometry(this.shapeSize)
    this.tetrahedron = new THREE.Mesh(tetrahedronGeometry, this.basicMaterial.clone())
    this.tetrahedron.position.y = this.shapeDistance
    this.tetrahedron.position.x = -this.shapeDistance
    this.tetrahedron.startPos = this.tetrahedron.position
    this.tetrahedron.name = 'tetrahedron'
    this.scene.add(this.tetrahedron)
    this.interactiveObjects.push(this.tetrahedron)

    // TorusKnot
    const torusKnot = new THREE.TorusKnotGeometry(this.shapeSize, this.shapeSize * 0.2)
    this.torusKnot = new THREE.Mesh(torusKnot, new THREE.MeshBasicMaterial(this.basicMaterialOptions))
    this.torusKnot.position.y = -this.shapeDistance
    this.torusKnot.startPos = this.torusKnot.position
    this.torusKnot.name = 'torusKnot'
    this.scene.add(this.torusKnot)
    this.interactiveObjects.push(this.torusKnot)
  }

  handleResize() {
    if (!this.container) {
      return
    }

    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }

  setupEvents() {
    window.addEventListener('resize', this.handleResize.bind(this))
    window.addEventListener('pointermove', this.handlePointerMove.bind(this))
    window.addEventListener('pointerdown', this.handlePointerDown.bind(this), false)
    window.addEventListener('pointerup', this.handlePointerUp.bind(this), false)
  }

  setObjectColor(object: THREE.Mesh, color: string) {
    ;(object.material as THREE.MeshBasicMaterial).color.set(color)
  }

  render() {
    this.time += 0.005
    this.renderer.render(this.scene, this.camera)

    // changing objects based on pointer interaction
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, false)

    if (intersects.length > 0) {
      if (this.activeObject !== null && this.activeObject.name !== intersects[0].object.name) {
        this.setObjectColor(this.activeObject, this.basicMaterialOptions.color as string)
      }

      this.activeObject = intersects[0].object
      if (this.activeObject !== this.selectedObject) {
        this.setObjectColor(this.activeObject, this.activeMaterialOptions.color as string)
      }
    } else {
      if (this.activeObject !== null && this.activeObject !== this.selectedObject) {
        this.setObjectColor(this.activeObject, this.basicMaterialOptions.color as string)
      }
      this.activeObject = null
    }

    this.interactiveObjects.map((interactiveObject) => {
      interactiveObject.position.y += 0.1 * Math.sin(this.time * 5 + interactiveObject.name.length)
      interactiveObject.rotation.z = 0.05 * Math.cos(this.time * 4 + interactiveObject.name.length)
    })

    window.requestAnimationFrame(this.render.bind(this))
  }

  handlePointerMove(event: PointerEvent) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    this.pointer.x = (event.clientX / this.width) * 2 - 1
    this.pointer.y = -(event.clientY / this.height) * 2 + 1

    if (this.activeObject) {
      this.setCursor('pointer')
    } else {
      this.setCursor()
    }
  }

  setCursor(cursorType = 'default') {
    if (this.container) {
      this.container.style.cursor = cursorType
    }
  }

  setCameraPosition() {
    const { y } = this.selectedObject ? this.selectedObject.startPos : this.cameraStartingPos
    // this.camera.up = new THREE.Vector3(0, 0, 0);
    // this.camera.lookAt(new THREE.Vector3(x, y, z));
    gsap.to(this.camera.position, {
      y,
      duration: 1.6,
      ease: 'expo.inOut',
      onUpdate: () => {
        this.controls.update()
      },
    })
  }

  handlePointerDown() {
    this.cachedActiveObject = this.activeObject

    if (this.selectedObject && this.selectedObject !== this.activeObject) {
      this.setObjectColor(this.selectedObject, this.basicMaterialOptions.color as string)
    }
  }

  handlePointerUp() {
    // Making sure the selected object was "clicked", not dragged and released on another object
    if (this.activeObject !== null && this.activeObject === this.cachedActiveObject) {
      this.selectedObject = this.activeObject

      this.setObjectColor(this.selectedObject, this.selectedMaterialOptions.color as string)
    } else {
      if (this.selectedObject) {
        this.setObjectColor(this.selectedObject, this.basicMaterialOptions.color as string)
        this.selectedObject = null
      }
    }

    this.cachedActiveObject = null

    if (this.selectedObject !== null) {
      this.setCameraPosition()
    }
  }
}

new Playground({
  container: document.querySelector('#container'),
})
