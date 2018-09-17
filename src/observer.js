"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observer = /** @class */ (function () {
    function Observer() {
        this.observerList = [];
    }
    Observer.prototype.registerObserver = function (observer) {
        this.observerList.push(observer);
    };
    Observer.prototype.removeObserver = function (observer) {
        var index = this.observerList.indexOf(observer);
        if (index >= 0) {
            this.observerList.splice(index, 1);
        }
    };
    Observer.prototype.notifyObservers = function () {
        for (var _i = 0, _a = this.observerList; _i < _a.length; _i++) {
            var observer = _a[_i];
            observer.update();
        }
    };
    return Observer;
}());
exports.Observer = Observer;
//# sourceMappingURL=observer.js.map