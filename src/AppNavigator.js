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
exports.default = AppNavigator;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var native_1 = require("@react-navigation/native");
var native_stack_1 = require("@react-navigation/native-stack");
var ConversationScreen_1 = require("./screens/ConversationScreen");
var SettingsScreen_1 = require("./screens/SettingsScreen");
var react_native_1 = require("react-native");
var Stack = (0, native_stack_1.createNativeStackNavigator)();
var navTheme = __assign(__assign({}, native_1.DefaultTheme), { colors: __assign(__assign({}, native_1.DefaultTheme.colors), { background: "#fff" }) });
function AppNavigator() {
    return ((0, jsx_runtime_1.jsx)(native_1.NavigationContainer, { theme: navTheme, children: (0, jsx_runtime_1.jsxs)(Stack.Navigator, { children: [(0, jsx_runtime_1.jsx)(Stack.Screen, { name: "Conversation", component: ConversationScreen_1.default, options: function (_a) {
                        var navigation = _a.navigation;
                        return ({
                            title: "Sprachtrainer",
                            headerRight: function () { return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: function () { return navigation.navigate("Settings"); }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { color: "#2563eb", fontWeight: "600" }, children: "Settings" }) })); }
                        });
                    } }), (0, jsx_runtime_1.jsx)(Stack.Screen, { name: "Settings", component: SettingsScreen_1.default, options: { title: "Settings" } })] }) }));
}
