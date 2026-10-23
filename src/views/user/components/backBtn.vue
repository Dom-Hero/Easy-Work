<template>
  <button
    class="bg-white text-center w-48 rounded-2xl h-14 relative text-black text-xl font-semibold group cursor-pointer"
    type="button"
    @click="goHome"
  >
    <div
      class="back-btn-slide rounded-xl h-12 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1024 1024"
        height="25px"
        width="25px"
      >
        <path
          d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
          fill="#ffffff"
        />
        <path
          d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
          fill="#ffffff"
        />
      </svg>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.back-btn-slide {
  background: var(--clay-primary, #0a0a0a);
  transition: width 0.45s cubic-bezier(0.34, 1.3, 0.64, 1), background-color 0.2s ease;
}

.group:hover .back-btn-slide {
  background: var(--clay-primary-active, #1f1f1f);
}
</style>
