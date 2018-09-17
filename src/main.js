"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PIXI = require("pixi.js");
// Aliases
var Application = PIXI.Application;
var Loader = PIXI.loaders.Loader;
var Sprite = PIXI.Sprite;
// tslint:disable-next-line:max-classes-per-file
var Main = /** @class */ (function () {
    function Main() {
        this.app = new Application({
            width: 900,
            height: 600,
            antialias: true,
            transparent: false,
            resolution: 1,
        });
    }
    Main.prototype.start = function () {
        this.loadSpriteSheet();
    };
    Main.prototype.init = function () {
        var gameScence = new GameScence(this.app);
    };
    Main.prototype.loadSpriteSheet = function () {
        var load = new Loader()
            .add("../assets/tileset.json")
            .add("../images/treasureHunter.json")
            .load(this.init);
    };
    return Main;
}());
// tslint:disable-next-line:max-classes-per-file
var GameScence = /** @class */ (function () {
    function GameScence(app) {
        this.dungeon = new Dungeon().dungeon;
        this.app = app;
    }
    GameScence.prototype.setup = function () {
        this.app.stage.addChild(this.dungeon);
    };
    return GameScence;
}());
// tslint:disable-next-line:max-classes-per-file
var Dungeon = /** @class */ (function () {
    function Dungeon() {
        this.dungeon = new Sprite(PIXI.Texture.fromFrame("dungeon.png"));
    }
    return Dungeon;
}());
var main = new Main();
main.start();
//# sourceMappingURL=main.js.map