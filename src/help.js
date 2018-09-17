"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Helper functions */
var Contain = /** @class */ (function () {
    function Contain() {
    }
    Contain.containWhenAnchorCenter = function (sprite, container) {
        var collision;
        var halfWidth = sprite.width / 2;
        var halfHeight = sprite.height / 2;
        var borderWidth = 24; // 符合我用的
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
    };
    return Contain;
}());
exports.Contain = Contain;
/* Helper functions */
// tslint:disable-next-line:max-classes-per-file
var ContainBounds = /** @class */ (function () {
    function ContainBounds(minX, minY, width, height) {
        this.minX = 0;
        this.minY = 0;
        this.width = 0;
        this.height = 0;
        this.minX = minX;
        this.minY = minY;
        this.width = width;
        this.height = height;
    }
    return ContainBounds;
}());
exports.ContainBounds = ContainBounds;
// The `keyboard` helper function
// tslint:disable-next-line:max-classes-per-file
var Keyboard = /** @class */ (function () {
    function Keyboard(keyCode, pressCallback, releaseCallback) {
        var _this = this;
        this.code = 0;
        this.isDown = false;
        this.isUp = true;
        this.press = function () { };
        this.release = function () { };
        // The `downHandler`
        this.downHandler = function (event) {
            if (event.keyCode === _this.code) {
                if (_this.isUp && _this.press) {
                    _this.press();
                }
                _this.isDown = true;
                _this.isUp = false;
            }
            event.preventDefault();
        };
        // The `upHandler`
        this.upHandler = function (event) {
            if (event.keyCode === _this.code) {
                if (_this.isDown && _this.release) {
                    _this.release();
                }
                _this.isDown = false;
                _this.isUp = true;
            }
            event.preventDefault();
        };
        this.code = keyCode;
        if (pressCallback !== undefined) {
            this.press = pressCallback;
        }
        if (releaseCallback !== undefined) {
            this.release = releaseCallback;
        }
        // Attach event listeners
        window.addEventListener("keydown", this.downHandler.bind(this), false);
        window.addEventListener("keyup", this.upHandler.bind(this), false);
    }
    return Keyboard;
}());
exports.Keyboard = Keyboard;
//# sourceMappingURL=help.js.map