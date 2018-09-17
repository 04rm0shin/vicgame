import * as PIXI from "pixi.js";

/* Helper functions */

export class Contain {
  public static containWhenAnchorCenter(sprite: PIXI.Sprite, container: ContainBounds): string | undefined
  {
    let collision: string | undefined;
    const halfWidth: number = sprite.width / 2;
    const halfHeight: number = sprite.height / 2;
    const borderWidth: number = 24; // 符合我用的

    // Left
    if (sprite.x < container.minX + halfWidth) {
      sprite.x = container.minX + halfWidth;
      collision = "left";
    }

    // Top
    if (sprite.y < container.minY + halfHeight) {
      sprite.y = container.minY + halfHeight;
      collision = "top";
    }

    // Right
    if (sprite.x > container.minX + container.width - halfWidth - borderWidth) {
      sprite.x = container.minX + container.width - halfWidth - borderWidth;
      collision = "right";
    }

    // Bottom
    if (sprite.y > container.minY + container.height - halfHeight) {
      sprite.y = container.minY + container.height - halfHeight;
      collision = "bottom";
    }

    // Return the `collision` value
    return collision;
  }

}

/* Helper functions */
// tslint:disable-next-line:max-classes-per-file
export class ContainBounds {
  public minX: number = 0;
  public minY: number = 0;
  public width: number = 0;
  public height: number = 0;

  constructor(minX: number, minY: number, width: number, height: number)
  {
    this.minX = minX;
    this.minY = minY;
    this.width = width;
    this.height = height;
  }
}

// The `keyboard` helper function
// tslint:disable-next-line:max-classes-per-file
export class Keyboard {
  private code: number = 0;
  public isDown: boolean = false;
  public isUp: boolean = true;

  constructor(keyCode: number, pressCallback?: () => void, releaseCallback?: () => void)
  {
    this.code = keyCode;
    if (pressCallback !== undefined) {
      this.press = pressCallback;
    }
    if (releaseCallback !== undefined) {
      this.release = releaseCallback;
    }

    // Attach event listeners
    window.addEventListener(
      "keydown", this.downHandler.bind(this), false,
    );
    window.addEventListener(
      "keyup", this.upHandler.bind(this), false,
    );
  }

  // tslint:disable-next-line:no-empty
  public press: () => void = () => { };
  // tslint:disable-next-line:no-empty
  public release: () => void = () => { };

  // The `downHandler`
  private downHandler = (event: any): void => {
    if (event.keyCode === this.code) {
      if (this.isUp && this.press) {
        this.press();
      }
      this.isDown = true;
      this.isUp = false;
    }
    event.preventDefault();
  }

  // The `upHandler`
  private upHandler = (event: any): void => {
    if (event.keyCode === this.code) {
      if (this.isDown && this.release) {
        this.release();
      }
      this.isDown = false;
      this.isUp = true;
    }
    event.preventDefault();
  }
}
