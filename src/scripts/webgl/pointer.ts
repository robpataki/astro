let instance: Pointer;

export default class Pointer {
  public pointer = { x: 0, y: 0 };
  public isPressed = false;

  constructor() {
    if (!window) {
      return;
    }

    if (!instance) {
      instance = this;
      this.init();
    }

    return instance;
  }

  init() {
    window.addEventListener('pointermove', this.handlePointerMove.bind(this));
    window.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    window.addEventListener('pointerup', this.handlePointerUp.bind(this));
  }

  handlePointerMove(event: PointerEvent) {
    this.pointer.x = (event.clientX / window.outerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.outerHeight) * 2 + 1;
  }

  handlePointerDown() {
    this.isPressed = true;
  }

  handlePointerUp() {
    this.isPressed = false;
  }

  public dispose() {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointermove', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerUp);
  }
}
