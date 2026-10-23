<template>
  <button type="button" class="button">
    <span class="text_button">Generate Site</span>
  </button>
</template>

<style scoped>
.button {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 12px 20px;
  border: none;
  border-radius: var(--clay-rounded-md, 12px);
  background-color: var(--clay-primary, #0a0a0a);
  color: var(--clay-on-primary, #ffffff);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.button:hover,
.button:focus-visible {
  background-color: var(--clay-primary-active, #1f1f1f);
  outline: none;
}

.button:active {
  transform: scale(0.98);
}

.text_button {
  color: inherit;
}
</style>
