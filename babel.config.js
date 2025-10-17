module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Transform `import.meta` in web bundles to avoid runtime errors
          // when dependencies ship ESM with `import.meta` (e.g., zustand@5).
          web: { unstable_transformImportMeta: true }
        }
      ]
    ],
    // Enable Expo Router and the `@/` alias resolution at build time
    plugins: [require.resolve("expo-router/babel")]
  }
}
