import * as PIXI from "pixi.js";
import { Keyboard } from "./help";
import { Contain } from "./help";
import { ContainBounds } from "./help";
import { IObserver } from "./observer";
import { ISubject } from "./observer";
import { Subject } from "./observer";

// Aliases
import Application = PIXI.Application;
import Container = PIXI.Container;
import Loader = PIXI.loaders.Loader;
import Graphics = PIXI.Graphics;
import TextureCache = PIXI.utils.TextureCache;
import Sprite = PIXI.Sprite;
import Text = PIXI.Text;
import TextStyle = PIXI.TextStyle;
import Event = PIXI.interaction.InteractionEvent;
import Data = PIXI.interaction.InteractionData;

// tslint:disable-next-line:max-classes-per-file
class Main {
    public app: Application = new Application({
        width: 900,
        height: 600,
        antialias: true,
        transparent: false,
        resolution: 1,
    },
    );

    public loadSpriteSheet(): void {
        const load: Loader = new Loader()
            .add("./assets/tileset.json")
            .add("./images/treasureHunter.json")
            .load(() => this.init());
    }

    public init(): void {
        const gameScence: GameScence = new GameScence(this.app);
        gameScence.setup();
    }

    public start(): void {
        document.body.appendChild(this.app.view);
        this.loadSpriteSheet();
    }
}

// tslint:disable-next-line:max-classes-per-file
class GameScence {
    public app: Application;
    public subject: ISubject = new Subject();

    private isMobile: boolean = Boolean(navigator.userAgent.match(/Android|iPhone|iPad|iPod/i));

    public gameStartScene: Container = new Container();
    public gameIngScene: Container = new Container();
    public gameOverScene: Container = new Container();

    public playButton: Sprite = new Sprite(PIXI.Texture.fromFrame("Play.png"));
    public dungeonClass: Dungeon = new Dungeon();
    public dungeon: Sprite = this.dungeonClass.dungeon;
    public doorClass: Door = new Door();
    public door: Sprite = this.doorClass.door;
    public explorerClass: Explorer = new Explorer();
    public explorer: Sprite = this.explorerClass.explorer;
    public treasureClass: Treasure = new Treasure();
    public treasure: Sprite = this.treasureClass.treasure;
    public healthBarClass: HealthBar = new HealthBar();

    public vx: number = -3;
    public vy: number = -3;

    public shooting: boolean = false;
    public timer: number = 0;
    public timeInterval: number = 60;
    public coolingTime: number = 60;

    public minX: number = 28;
    public minY: number = 10;
    public width: number = 488;
    public height: number = 480;

    public laserList: LaserGreen[] = [];
    public blobList: Blob[] = [];

    // tslint:disable-next-line:no-empty
    public state: (delta: number) => void;

    // Create the text sprite and add it to the `gameOver` scene
    public style: TextStyle = new TextStyle({
        fontFamily: "Futura",
        fontSize: 64,
        fill: "white"
    });
    public message: Text = new Text("The End!", this.style);

    public blobPool: BlobPool = new BlobPool();
    public laserGreenPool: LaserGreenPool = new LaserGreenPool();

    constructor(app: Application) {
        this.app = app;
    }

    public setup(): void {
        this.app.stage.addChild(this.gameStartScene);
        this.gameStartScene.visible = true;
        this.app.stage.addChild(this.gameIngScene);
        this.gameIngScene.visible = false;
        this.app.stage.addChild(this.gameOverScene);
        this.gameOverScene.visible = false;

        if (this.isMobile === true) {
            this.dungeon
                .on("pointerdown", this.onDragStart)
                .on("pointerup", this.onDragEnd)
                .on("pointerupoutside", this.onDragEnd)
                .on("pointermove", this.onDragMove);
        } else {
            this.KeyboardAction();
        }

        this.startScence();

        this.app.ticker.add((delta: number): void => this.gameLoop(delta));
    }

    public gameLoop(delta: number): void {
        this.state(delta);
    }

    public startScence(): void {
        this.gameStartScene.addChild(this.playButton);

        this.playButton.interactive = true;
        this.playButton.buttonMode = true;
        this.playButton.on("pointerdown", () => this.onPlayButtonClick());

        this.state = this.gameStartState;
    }

    // tslint:disable-next-line:no-empty
    public gameStartState(delta: number): void {
    }

    public onPlayButtonClick(): void {
        this.playScence();
    }

    public playScence(): void {
        this.gameIngScene.addChild(this.dungeon);
        this.gameIngScene.addChild(this.door);
        this.gameIngScene.addChild(this.explorer);
        this.gameIngScene.addChild(this.treasure);
        this.gameIngScene.addChild(this.healthBarClass.healthBar);

        this.gameStartScene.visible = false;
        this.gameIngScene.visible = true;
        this.gameOverScene.visible = false;

        this.doorClass.setup();
        this.explorerClass.setup(this.app);
        this.treasureClass.setup(this.app);
        this.healthBarClass.setup(this.app);

        this.blobPool.init();
        this.laserGreenPool.init();

        this.handleBlobInit();

        this.state = this.playState;
    }

    public playState(delta: number): void {
        this.handleExplorerAction();

        this.timer += delta * this.timeInterval;
        this.coolingTime += delta;
        if (this.shooting && this.coolingTime > this.timeInterval) {
            this.handleLaserAction();
            this.coolingTime = 0;
        }

        if (this.timer > this.timeInterval) {
            this.subject.notifyObservers(delta);
            this.detectLBHit();
            this.timer = 0;
        }
    }

    public gameOver(): void {
        const x: number = 120;
        const ymodify: number = 32;

        this.message.x = x;
        this.message.y = this.app.stage.height / 2 - ymodify;
        this.gameOverScene.addChild(this.message);

        this.gameStartScene.visible = false;
        this.gameIngScene.visible = false;
        this.gameOverScene.visible = true;

        this.state = this.gameOverState;
    }

    // tslint:disable-next-line:no-empty
    public gameOverState(): void {
    }

    private detectLBHit(): void {
        for (let i: number = this.blobList.length - 1; i > -1; i--) {
            for (let j: number = this.laserList.length - 1; j > -1; j--) {
                if (new HitTestRectangle(this.blobList[i].blob, this.laserList[j].laserGreen).hitDetect()) {
                    this.blobList[i].isDestory = true;
                    this.laserList[j].isDestory = true;
                    this.blobList.splice(i, 1);
                    this.laserList.splice(j, 1);

                    return;
                }
            }
        }
    }

    private handleLaserAction(): void {
        const laserGreenClass: LaserGreen = this.laserGreenPool.uselaserGreen();
        const laserGreen: Sprite = laserGreenClass.laserGreen;
        laserGreenClass.setup(this.explorer);

        const halfWidth: number = laserGreen.width / 2;
        const borderWidth: number = 24; // 符合我用的

        laserGreenClass.update = (): void => {
            laserGreen.x -= this.vx;
            if (laserGreen.x > this.minX + this.width - halfWidth - borderWidth) {
                laserGreen.x = this.minX + this.width - halfWidth - borderWidth;
                laserGreenClass.isOut = true;
            }
            if (laserGreenClass.isOut || laserGreenClass.isDestory) {
                this.gameIngScene.removeChild(laserGreen);
                this.subject.removeObserver(laserGreenClass);

                this.laserList = this.laserList.filter(this.laserFilter);

                laserGreenClass.isOut = false;
                laserGreenClass.isDestory = false;

                this.laserGreenPool.returnlaserGreen(laserGreenClass);
            }
        };

        this.laserList.push(laserGreenClass);
        this.subject.registerObserver(laserGreenClass);
        this.gameIngScene.addChild(laserGreenClass.laserGreen);
    }

    private laserFilter(laserGreenClass: LaserGreen, index: number, laserList: []): LaserGreen | undefined
    {
        if(laserGreenClass.isOut === false) return laserGreenClass;
    }

    private handleExplorerAction(): void {
        this.explorer.x += this.explorerClass.vx;
        this.explorer.y += this.explorerClass.vy;

        // Explorer not out of play screen
        Contain.containWhenAnchorCenter(this.explorer,
            new ContainBounds(this.minX, this.minY, this.width, this.height));

        // If the explorer is hit...
        if (this.explorerClass.explorerHit) {
            const explorerAlpha: number = 0.5;
            // Make the explorer semi-transparent
            this.explorer.alpha = explorerAlpha;

            // Reduce the width of the health bar's inner rectangle by 1 pixel
            this.healthBarClass.outer.width -= 1;

            this.explorerClass.explorerHit = false;

        } else {

            // Make the explorer fully opaque (non-transparent) if it hasn't been hit
            this.explorer.alpha = 1;
        }

        // Check for a collision between the explorer and the treasure
        if (new HitTestRectangle(this.explorer, this.treasure).hitDetect()) {
            const treasureXYModify: number = 8;
            // If the treasure is touching the explorer, center it over the explorer
            this.treasure.x = this.explorer.x + treasureXYModify;
            this.treasure.y = this.explorer.y + treasureXYModify;
        }

        // Does the explorer have enough health? If the width of the `innerBar`
        // Is less than zero, end the game and display "You lost!"
        if (this.healthBarClass.outer.width < 0) {
            this.gameOver();
            this.message.text = "You lost!";
        }

        // If the explorer has brought the treasure to the exit,
        // End the game and display "You won!"
        if (new HitTestRectangle(this.treasure, this.door).hitDetect()) {
            this.gameOver();
            this.message.text = "You won!";
        }
    }

    private handleBlobInit(): void {
        const numOfBlols: number = 6;

        for (let i: number = 0; i < numOfBlols; i++) {
            this.genericBlob();
        }
    }

    public genericBlob(): void {
        const speed: number = 2;
        let direction: number = 1;

        const blobClass: Blob = this.blobPool.useBlob();
        const blob: Sprite = blobClass.blob;

        const x: number = this.randomInt(0, this.app.stage.width - blob.width);
        const y: number = this.randomInt(0, this.app.stage.height - blob.height);

        blob.x = x;
        blob.y = y;

        blobClass.vx = speed * direction;
        blobClass.vy = speed * direction;

        direction *= -1;

        blobClass.update = (): void => {
            blobClass.blob.x += blobClass.vx;
            blobClass.blob.y += blobClass.vy;

            let blobHitsWall: string | undefined = "";
            blobHitsWall = Contain.containWhenAnchorCenter(blobClass.blob,
                new ContainBounds(this.minX, this.minY, this.width, this.height));

            if (blobHitsWall === "right" || blobHitsWall === "left") {
                blobClass.vx *= -1;
            }

            if (blobHitsWall === "top" || blobHitsWall === "bottom") {
                blobClass.vy *= -1;
            }

            if (blobClass.isDestory) {
                this.gameIngScene.removeChild(blob);
                this.subject.removeObserver(blobClass);

                blobClass.isDestory = false;
                this.blobPool.returnBlob(blobClass);
                this.genericBlob();
            }

            if (new HitTestRectangle(this.explorer, blob).hitDetect()) {
                this.explorerClass.explorerHit = true;
            }
        };

        this.blobList.push(blobClass);
        this.subject.registerObserver(blobClass);
        this.gameIngScene.addChild(blob);
    }

    public randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private KeyboardAction(): void {
        // Keyboard Event below
        const leftASCII: number = 37;
        const topASCII: number = 38;
        const rightASCII: number = 39;
        const bottomASCII: number = 40;
        const spaceASCII: number = 32;
        const left: Keyboard = new Keyboard(leftASCII);
        const top: Keyboard = new Keyboard(topASCII);
        const right: Keyboard = new Keyboard(rightASCII);
        const bottom: Keyboard = new Keyboard(bottomASCII);
        const space: Keyboard = new Keyboard(spaceASCII);

        left.press = (): void => {
            this.explorerClass.vx = this.vx;
        };

        left.release = (): void => {
            if (!right.isDown) {
                this.explorerClass.vx = 0;
            }
        };

        right.press = (): void => {
            this.explorerClass.vx = -this.vx;
        };

        right.release = (): void => {
            if (!left.isDown) {
                this.explorerClass.vx = 0;
            }
        };

        top.press = (): void => {
            this.explorerClass.vy = this.vy;
        };

        top.release = (): void => {
            if (!bottom.isDown) {
                this.explorerClass.vy = 0;
            }
        };

        bottom.press = (): void => {
            this.explorerClass.vy = -this.vy;
        };

        bottom.release = (): void => {
            if (!top.isDown) {
                this.explorerClass.vy = 0;
            }
        };

        space.press = (): void => {
            this.shooting = true;
        };

        space.release = (): void => {
            this.shooting = false;
        };
    }

    private onDragStart(event: Event): void
    {
        if (this.state !== this.playState) return;
        this.handleLaserAction();
        this.dungeonClass.dragging = true;
        this.dungeonClass.data = event.data;
        this.dungeonClass.lastX = this.dungeonClass.data.getLocalPosition(this.gameIngScene).x;
        this.dungeonClass.lastY = this.dungeonClass.data.getLocalPosition(this.gameIngScene).y;
    }

    private onDragEnd(): void
    {
        if (this.state !== this.playState) return;
        this.dungeonClass.dragging = false;
        this.dungeonClass.data = null;
    }

    private onDragMove(): void
    {
        if (this.state !== this.playState) return;

        if(this.dungeonClass.dragging && this.dungeonClass.data !== null)
        {
            const newPosition: PIXI.Point = this.dungeonClass.data.getLocalPosition(this.gameIngScene);
            this.explorer.x += (newPosition.x - this.dungeonClass.lastX);
            this.explorer.y += (newPosition.y - this.dungeonClass.lastY);

            this.dungeonClass.lastX = newPosition.x;
            this.dungeonClass.lastY = newPosition.y;
        }
    }
}

// tslint:disable-next-line:max-classes-per-file
class Dungeon {
    public dungeon: Sprite = new Sprite(PIXI.Texture.fromFrame("dungeon.png"));
    public dragging: boolean = false;
    public data: Data | null;
    public lastX: number;
    public lastY: number;
}

// tslint:disable-next-line:max-classes-per-file
class Door {
    public door: Sprite = new Sprite(PIXI.Texture.fromFrame("door.png"));

    public setup(): void {
        const doorX: number = 60;
        const doorY: number = 15;
        const anchorNum: number = 0.5;
        this.door.position.set(doorX, doorY);
        this.door.anchor.x = anchorNum;
        this.door.anchor.y = anchorNum;
    }
}

// tslint:disable-next-line:max-classes-per-file
class Explorer {
    public explorer: Sprite = new Sprite(PIXI.Texture.fromFrame("explorer.png"));
    public vx: number = 0;
    public vy: number = 0;
    public type: string = "explorer";
    public explorerHit: boolean = false;

    public setup(app: Application): void {
        const explorerX: number = 68;
        const anchorNum: number = 0.5;
        this.explorer.x = explorerX;
        this.explorer.y = app.stage.height / 2 - this.explorer.height / 2;
        this.explorer.anchor.x = anchorNum;
        this.explorer.anchor.y = anchorNum;
    }
}

// tslint:disable-next-line:max-classes-per-file
class Treasure {
    public treasure: Sprite = new Sprite(PIXI.Texture.fromFrame("treasure.png"));

    public setup(app: Application): void {
        const borderWidth: number = 48;
        const anchorNum: number = 0.5;
        this.treasure.x = app.stage.width - this.treasure.width - borderWidth;
        this.treasure.y = app.stage.height / 2 - this.treasure.height / 2;
        this.treasure.anchor.x = anchorNum;
        this.treasure.anchor.y = anchorNum;
    }
}

// tslint:disable-next-line:max-classes-per-file
class Blob implements IObserver {
    public blob: Sprite = new Sprite(PIXI.Texture.fromFrame("blob.png"));
    public type: string = "blob";
    public vx: number = 0;
    public vy: number = 0;
    public isDestory: boolean = false;

    // tslint:disable-next-line:no-empty
    public update: () => void = () => { };
}

// tslint:disable-next-line:max-classes-per-file
class LaserGreen implements IObserver {
    public laserGreen: Sprite = new Sprite(PIXI.Texture.fromFrame("laserGreen.png"));
    public type: string = "laserGreen";
    public vx: number = 0;
    public isDestory: boolean = false;
    public isOut: boolean = false;

    public setup(explorer: Sprite): void {
        const anchorNum: number = 0.5;
        this.laserGreen.x = explorer.x;
        this.laserGreen.y = explorer.y;
        this.laserGreen.anchor.x = anchorNum;
        this.laserGreen.anchor.y = anchorNum;
        // tslint:disable-next-line:no-magic-numbers
        this.laserGreen.rotation = 90 * (Math.PI / 180);
    }

    // tslint:disable-next-line:no-empty
    public update: () => void = () => { };
}

// tslint:disable-next-line:max-classes-per-file
class HealthBar {
    public healthBar: Container = new Container();
    public innerBar: Graphics = new Graphics();
    public outerBar: Graphics = new Graphics();

    public outer: Graphics = this.outerBar;

    public setup(app: Application): void {
        this.healthBar.position.set(app.stage.width - 170, 4);

        this.innerBar.beginFill(0x000000);
        this.innerBar.drawRect(0, 0, 128, 8);
        this.innerBar.endFill();
        this.healthBar.addChild(this.innerBar);

        this.outerBar.beginFill(0xFF3300);
        this.outerBar.drawRect(0, 0, 128, 8);
        this.outerBar.endFill();
        this.healthBar.addChild(this.outerBar);
    }
}

// tslint:disable-next-line:max-classes-per-file
class HitTestRectangle {
    public sprite1: Sprite;
    public sprite2: Sprite;

    constructor(sprite1: Sprite, sprite2: Sprite) {
        this.sprite1 = sprite1;
        this.sprite2 = sprite2;
    }

    public hitDetect(): boolean {
        let hit: boolean = false;

        const sprite1CenterX: number = this.sprite1.x;
        const sprite1CenterY: number = this.sprite1.y;
        const sprite2CenterX: number = this.sprite2.x;
        const sprite2CenterY: number = this.sprite2.y;

        const sprite1HalfWidth: number = this.sprite1.width / 2;
        const sprite1HalfHeight: number = this.sprite1.height / 2;
        const sprite2HalfWidth: number = this.sprite2.width / 2;
        const sprite2HalfHeight: number = this.sprite2.height / 2;

        const vx: number = sprite1CenterX - sprite2CenterX;
        const vy: number = sprite1CenterY - sprite2CenterY;

        const combinedHalfWidths: number = sprite1HalfWidth + sprite2HalfWidth;
        const combinedHalfHeights: number = sprite1HalfHeight + sprite2HalfHeight;

        // Check for a collision on the x axis
        if (Math.abs(vx) < combinedHalfWidths) {

            // A collision might be occuring. Check for a collision on the y axis
            if (Math.abs(vy) < combinedHalfHeights) {

                // There's definitely a collision happening
                hit = true;
            } else {

                // There's no collision on the y axis
                hit = false;
            }
        } else {

            // There's no collision on the x axis
            hit = false;
        }

        // `hit` will be either `true` or `false`
        return hit;
    }
}

// tslint:disable-next-line:max-classes-per-file
class BlobPool {
    private numOfBlols: number = 10;
    private blobPoolList: Blob[] = [];

    public init(): void {
        for (let i: number = 0; i < this.numOfBlols; i++) {
            this.blobPoolList.push(new Blob());
        }
    }

    public useBlob(): Blob {
        return this.blobPoolList.shift() || new Blob();
    }

    public returnBlob(blobClass: Blob): void {
        this.blobPoolList.push(blobClass);
    }
}

// tslint:disable-next-line:max-classes-per-file
class LaserGreenPool {
    private numOfLasers: number = 10;
    private laserGreenPoolList: LaserGreen[] = [];

    public init(): void {
        for (let i: number = 0; i < this.numOfLasers; i++) {
            this.laserGreenPoolList.push(new LaserGreen());
        }
    }

    public uselaserGreen(): LaserGreen {
        return this.laserGreenPoolList.shift() || new LaserGreen();
    }

    public returnlaserGreen(laserGreenClass: LaserGreen): void {
        this.laserGreenPoolList.push(laserGreenClass);
    }
}

const main: Main = new Main();
main.start();
