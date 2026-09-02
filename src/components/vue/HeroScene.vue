
<template>
  <div class="hero-scene"></div>
</template>

<script setup>
import { getCurrentInstance, onMounted, onBeforeUnmount } from 'vue';
import { SceneManager } from './three/index.js';

let sceneManager = null;

onMounted(() => {
  // 不使用 template ref，避免 Vue 编译器把元素提升为静态 vnode 后无法绑定 ref 的问题
  // HeroScene 是单根组件，$el 即根 div
  const el = getCurrentInstance()?.proxy?.$el;
  if (el) {
    sceneManager = new SceneManager(el);
    sceneManager.init();
  }
});

onBeforeUnmount(() => {
  if (sceneManager) {
    sceneManager.destroy();
    sceneManager = null;
  }
});
</script>

<style scoped>
.hero-scene {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
}
</style>

