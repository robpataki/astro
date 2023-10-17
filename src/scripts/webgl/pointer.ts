let instance: Pointer;

type TPointerProps = {
  onMove: () => void;
};

/**
 * Tracks the pointer in WebGL
 */
export default class Pointer {
  /**
   * Current coordinates
   * @return {x: number, y: number} The current pointer coordinates.
   */
  public coords = { x: 0, y: 0 };

  /**
   * Current pressed state
   * @return boolean `true` when the pointer is pressed.
   */
  public isPressed = false;

  private onMoveHandler!: () => void;

  constructor(private options: TPointerProps) {
    if (!window) {
      return;
    }

    if (!instance) {
      instance = this;
      this.init();
    }

    return instance;
  }

  private init() {
    if (this.options) {
      this.onMoveHandler = this.options.onMove;
    }

    window.addEventListener('pointermove', this.handlePointerMove.bind(this));
    window.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    window.addEventListener('pointerup', this.handlePointerUp.bind(this));
  }

  private handlePointerMove(event: PointerEvent) {
    this.coords.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.coords.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.onMoveHandler && this.onMoveHandler();
  }

  private handlePointerDown() {
    this.isPressed = true;
  }

  private handlePointerUp() {
    this.isPressed = false;
  }

  /**
   * Clean up and remove event listeners
   */
  dispose() {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointermove', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerUp);
  }
}
