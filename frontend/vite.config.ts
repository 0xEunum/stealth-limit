// import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// import wasm from "vite-plugin-wasm";
// // @ts-ignore - bypass type verification for the plugin wrapper
// import topLevelAwait from "vite-plugin-top-level-await";
// export default defineConfig({
//   vite: {
//     plugins: [
//       wasm(),
//       topLevelAwait({
//           promiseExportName: "__next_amd",
//           promiseImportName: (i: number) => `__next_amd_${i}`      })
//     ],
//     worker: {
//       plugins: () => [wasm(), topLevelAwait()]
//     },
//     optimizeDeps: {
//       exclude: ["@cofhe/sdk"],
//       // 1. FORCE VITE TO PRE-BUNDLE THE LEGACY CRYPTO DEPENDENCIES AS ESM
//       include: ["tweetnacl", "tweetnacl/nacl-fast"] 
//     },
//     server: {
//       port: 8080,
//       strictPort: true
//     }
//   }
// });




import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import wasm from "vite-plugin-wasm";
// @ts-ignore - bypass type verification for the plugin wrapper
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  vite: {
    plugins: [
      wasm(),
      topLevelAwait({
        promiseExportName: "__next_amd",
        promiseImportName: (i: number) => `__next_amd_${i}`
      })
    ],
    worker: {
      plugins: () => [wasm(), topLevelAwait()]
    },
    optimizeDeps: {
      exclude: ["@cofhe/sdk"],
      // FORCE VITE TO PRE-BUNDLE BOTH ENCRYPTION AND IFRAME ENGINE LOWER DEPENDENCIES
      include: [
        "tweetnacl", 
        "tweetnacl/nacl-fast",
        "iframe-shared-storage" // 👈 Explicitly force standard ESM transformation here
      ]
    },
    server: {
      port: 8080,
      strictPort: true
    }
  }
});