"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsScreen;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_native_1 = require("react-native");
var session_1 = require("../store/session");
var languages = ["ja-JP", "en-US", "de-DE"];
var levels = ["beginner", "intermediate", "advanced"];
function SettingsScreen() {
    var _a = (0, session_1.useSessionStore)(), language = _a.language, level = _a.level, setLanguage = _a.setLanguage, setLevel = _a.setLevel, user = _a.user, setUser = _a.setUser;
    var LangButtons = (0, react_1.useMemo)(function () {
        return languages.map(function (l) { return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.choice, language === l && styles.choiceActive], onPress: function () { return setLanguage(l); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.choiceText, language === l && styles.choiceTextActive], children: l }) }, l)); });
    }, [language, setLanguage]);
    var LevelButtons = (0, react_1.useMemo)(function () {
        return levels.map(function (lv) { return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [styles.choice, level === lv && styles.choiceActive], onPress: function () { return setLevel(lv); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.choiceText, level === lv && styles.choiceTextActive], children: lv }) }, lv)); });
    }, [level, setLevel]);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "User" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: user, onChangeText: setUser, placeholder: "Your name", style: styles.input, autoCapitalize: "words" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "Language" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.row, children: LangButtons }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "Level" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.row, children: LevelButtons })] }));
}
var styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 16, gap: 12 },
    label: { fontSize: 14, color: "#374151", marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    choice: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb"
    },
    choiceActive: {
        backgroundColor: "#dbeafe",
        borderColor: "#93c5fd"
    },
    choiceText: { color: "#111827" },
    choiceTextActive: { color: "#1d4ed8", fontWeight: "600" }
});
