"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HapticTab = HapticTab;
var jsx_runtime_1 = require("react/jsx-runtime");
var elements_1 = require("@react-navigation/elements");
var Haptics = require("expo-haptics");
function HapticTab(props) {
    return ((0, jsx_runtime_1.jsx)(elements_1.PlatformPressable, __assign({}, props, { onPressIn: function (ev) {
            var _a;
            if (process.env.EXPO_OS === 'ios') {
                // Add a soft haptic feedback when pressing down on the tabs.
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            (_a = props.onPressIn) === null || _a === void 0 ? void 0 : _a.call(props, ev);
        } })));
}
