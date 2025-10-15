"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconSymbol = IconSymbol;
var jsx_runtime_1 = require("react/jsx-runtime");
var expo_symbols_1 = require("expo-symbols");
function IconSymbol(_a) {
    var name = _a.name, _b = _a.size, size = _b === void 0 ? 24 : _b, color = _a.color, style = _a.style, _c = _a.weight, weight = _c === void 0 ? 'regular' : _c;
    return ((0, jsx_runtime_1.jsx)(expo_symbols_1.SymbolView, { weight: weight, tintColor: color, resizeMode: "scaleAspectFit", name: name, style: [
            {
                width: size,
                height: size,
            },
            style,
        ] }));
}
