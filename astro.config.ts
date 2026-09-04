import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

import vue from "@astrojs/vue";

export default defineConfig({
  site: config.site.url,
  integrations: [mdx(), sitemap({
    filter: page =>
      config.features?.showArchives !== false || !page.endsWith("/archives/"),
  }), vue()],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['three'], // 预构建 three
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 如果模块来自 three，单独打包成 three chunk
            if (id.includes('node_modules/three')) {
              return 'three';
            }
          },
        },
      },
    },
  },
  fonts: [
    // {
    //   name: "Recursive",          // 字体名称（自定义）
    //   cssVariable: "--font-recursive", // CSS 变量名
    //   provider: fontProviders.local(), // 改为 local 提供商
    //   fallbacks: ["monospace"],
    //   options: {
    //     variants: [
    //       {
    //         weight: 300,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/RecursiveSansCslSt-Light.ttf" }], 
    //         unicodeRange: ["U+0000-00FF"],
    //       },
    //       {
    //         weight: 400,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/RecursiveSansCslSt-Med.ttf" }], 
    //         unicodeRange: ["U+0000-00FF"],
    //       },
    //       {
    //         weight: 500,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/RecursiveSansCslSt-Regular.ttf" }], 
    //         unicodeRange: ["U+0000-00FF"],
    //       },
    //       {
    //         weight: 600,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/RecursiveSansCslSt-SemiBd.ttf" }], 
    //         unicodeRange: ["U+0000-00FF"],
    //       },          
    //       {
    //         weight: 700,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/RecursiveSansCslSt-XBlk.ttf" }], 
    //         unicodeRange: ["U+0000-00FF"],
    //       },
    //     ],
    //   },
    // },
    // {
    //   name: "PingFang",          // 字体名称（自定义）
    //   cssVariable: "--font-pingfang", // CSS 变量名
    //   provider: fontProviders.local(), // 改为 local 提供商
    //   fallbacks: ["monospace"],
    //   options: {
    //     variants: [
    //       {
    //         weight: 300,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/苹方黑体-极细-简.ttf" }], 
    //       },
    //       {
    //         weight: 400,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/苹方黑体-细-简.ttf" }], 
    //       },
    //       {
    //         weight: 500,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/苹方黑体-纤细-简.ttf" }], 
    //       },
    //       {
    //         weight: 600,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/苹方黑体-准-简.ttf" }], 
    //       },          
    //       {
    //         weight: 700,
    //         style: "normal",
    //         src: [{ url: "./public/fonts/苹方黑体-中黑-简.ttf" }], 
    //       },
    //     ],
    //   },
    // },
    // {
    //   name: "Google Sans Code",
    //   cssVariable: "--font-google-sans-code",
    //   provider: fontProviders.npm(),
    //   fallbacks: ["monospace"],
    //   weights: [300, 400, 500, 600, 700],
    //   styles: ["normal", "italic"],
    //   formats: ["woff", "ttf"],
    // },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});