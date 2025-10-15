"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSessionStore = void 0;
var zustand_1 = require("zustand");
var middleware_1 = require("zustand/middleware");
var async_storage_1 = require("@react-native-async-storage/async-storage");
exports.useSessionStore = (0, zustand_1.create)()((0, middleware_1.persist)(function (set) { return ({
    language: "ja-JP",
    level: "beginner",
    history: [],
    user: "You",
    setLevel: function (level) { return set({ level: level }); },
    setLanguage: function (language) { return set({ language: language }); },
    setUser: function (user) { return set({ user: user }); },
    appendMessage: function (msg) {
        return set(function (s) { return ({
            history: __spreadArray(__spreadArray([], s.history, true), [msg], false)
        }); });
    },
    resetHistory: function () { return set({ history: [] }); }
}); }, {
    name: "sprachtrainer.session",
    storage: (0, middleware_1.createJSONStorage)(function () { return async_storage_1.default; })
}));
