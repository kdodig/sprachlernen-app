"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ParallaxScrollView;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_native_1 = require("react-native");
var react_native_reanimated_1 = require("react-native-reanimated");
var themed_view_1 = require("@/components/themed-view");
var use_color_scheme_1 = require("@/hooks/use-color-scheme");
var use_theme_color_1 = require("@/hooks/use-theme-color");
var HEADER_HEIGHT = 250;
function ParallaxScrollView(_a) {
    var _b;
    var children = _a.children, headerImage = _a.headerImage, headerBackgroundColor = _a.headerBackgroundColor;
    var backgroundColor = (0, use_theme_color_1.useThemeColor)({}, 'background');
    var colorScheme = (_b = (0, use_color_scheme_1.useColorScheme)()) !== null && _b !== void 0 ? _b : 'light';
    var scrollRef = (0, react_native_reanimated_1.useAnimatedRef)();
    var scrollOffset = (0, react_native_reanimated_1.useScrollOffset)(scrollRef);
    var headerAnimatedStyle = (0, react_native_reanimated_1.useAnimatedStyle)(function () {
        return {
            transform: [
                {
                    translateY: (0, react_native_reanimated_1.interpolate)(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]),
                },
                {
                    scale: (0, react_native_reanimated_1.interpolate)(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
                },
            ],
        };
    });
    return ((0, jsx_runtime_1.jsxs)(react_native_reanimated_1.default.ScrollView, { ref: scrollRef, style: { backgroundColor: backgroundColor, flex: 1 }, scrollEventThrottle: 16, children: [(0, jsx_runtime_1.jsx)(react_native_reanimated_1.default.View, { style: [
                    styles.header,
                    { backgroundColor: headerBackgroundColor[colorScheme] },
                    headerAnimatedStyle,
                ], children: headerImage }), (0, jsx_runtime_1.jsx)(themed_view_1.ThemedView, { style: styles.content, children: children })] }));
}
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: HEADER_HEIGHT,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        padding: 32,
        gap: 16,
        overflow: 'hidden',
    },
});
