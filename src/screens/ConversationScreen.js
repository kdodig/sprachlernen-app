"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.default = ConversationScreen;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_native_1 = require("react-native");
var Speech = require("expo-speech");
var api_1 = require("../lib/api");
var audio_1 = require("../lib/audio");
var session_1 = require("../store/session");
function ConversationScreen() {
    var _this = this;
    var _a = (0, session_1.useSessionStore)(), language = _a.language, level = _a.level, history = _a.history, appendMessage = _a.appendMessage, user = _a.user;
    var _b = (0, react_1.useState)(null), recording = _b[0], setRecording = _b[1];
    var _c = (0, react_1.useState)(false), busy = _c[0], setBusy = _c[1];
    var isHeldRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        return function () {
            var rec = recording;
            if (rec) {
                rec.stopAndUnloadAsync().catch(function () { return undefined; });
            }
        };
    }, [recording]);
    var handleStart = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var rec, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (busy || recording)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, audio_1.startRecording)()];
                case 2:
                    rec = _a.sent();
                    setRecording(rec);
                    isHeldRef.current = true;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    react_native_1.Alert.alert("Mic Error", e_1 instanceof Error ? e_1.message : "Failed to start recording");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [busy, recording]);
    var handleStop = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var uri, text, userMsg, reply, botMsg, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!recording || !isHeldRef.current)
                        return [2 /*return*/];
                    setBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, (0, audio_1.stopRecording)(recording)];
                case 2:
                    uri = _a.sent();
                    setRecording(null);
                    isHeldRef.current = false;
                    return [4 /*yield*/, (0, api_1.sttUpload)(uri)];
                case 3:
                    text = _a.sent();
                    userMsg = { role: "user", content: text };
                    appendMessage(userMsg);
                    return [4 /*yield*/, (0, api_1.chatReply)(level, __spreadArray(__spreadArray([], history, true), [userMsg], false), user)];
                case 4:
                    reply = _a.sent();
                    botMsg = { role: "assistant", content: reply };
                    appendMessage(botMsg);
                    Speech.speak(reply, {
                        language: language,
                        pitch: 1.0,
                        rate: 0.95
                    });
                    return [3 /*break*/, 7];
                case 5:
                    e_2 = _a.sent();
                    react_native_1.Alert.alert("Conversation Error", e_2 instanceof Error ? e_2.message : "Unknown error");
                    return [3 /*break*/, 7];
                case 6:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [appendMessage, history, language, level, recording, user]);
    var btnLabel = recording ? "Release to Send" : "Hold to Talk";
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.FlatList, { data: history, keyExtractor: function (_, i) { return "msg-".concat(i); }, contentContainerStyle: styles.list, renderItem: function (_a) {
                    var item = _a.item;
                    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                            styles.bubble,
                            item.role === "user" ? styles.userBubble : styles.botBubble
                        ], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.bubbleText, children: item.content }) }));
                } }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.footer, children: (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: function (_a) {
                        var pressed = _a.pressed;
                        return [
                            styles.ptt,
                            pressed || recording ? styles.pttActive : undefined
                        ];
                    }, onPressIn: handleStart, onPressOut: handleStop, disabled: busy, children: busy ? ((0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { color: "#fff" })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.pttText, children: btnLabel })) }) })] }));
}
var styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    list: { padding: 16, gap: 8 },
    bubble: {
        padding: 12,
        borderRadius: 12,
        maxWidth: "85%"
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "#dbeafe"
    },
    botBubble: {
        alignSelf: "flex-start",
        backgroundColor: "#f3f4f6"
    },
    bubbleText: { fontSize: 16, color: "#111827" },
    footer: {
        padding: 16,
        borderTopWidth: react_native_1.StyleSheet.hairlineWidth,
        borderTopColor: "#e5e7eb"
    },
    ptt: {
        backgroundColor: "#2563eb",
        paddingVertical: 16,
        borderRadius: 999,
        alignItems: "center"
    },
    pttActive: {
        backgroundColor: "#1d4ed8"
    },
    pttText: { color: "#fff", fontSize: 16, fontWeight: "600" }
});
