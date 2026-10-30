<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="tv-placeholder">
    <h1 class="tv-placeholder__title">小电视</h1>
    <p class="tv-placeholder__lead">内容待定，稍后补充</p>
    <button type="button" class="tv-placeholder__back" @click="goDashboard">
      返回工作台
    </button>
  </div>
</template>

<style scoped>
.tv-placeholder {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  box-sizing: border-box;
  background: var(--clay-canvas, #fffaf0);
  color: var(--clay-ink, #0a0a0a);
}

.tv-placeholder__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 600;
  letter-spacing: -0.03em;
}

.tv-placeholder__lead {
  margin: 0;
  color: var(--clay-muted, #6a6a6a);
  font-size: 15px;
}

.tv-placeholder__back {
  margin-top: 8px;
  padding: 10px 18px;
  border: 1px solid var(--clay-ink, #0a0a0a);
  border-radius: 12px;
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-ink, #0a0a0a);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tv-placeholder__back:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(10, 10, 10, 0.08);
}

.tv-placeholder__back:active {
  transform: translateY(0);
}
</style>
