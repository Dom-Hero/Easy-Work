import { computed, ref } from 'vue'

const open = ref(false)
const iframeReady = ref(false)

export function useAiChatDrawer() {
  const isOpen = computed(() => open.value)
  const hasLoadedIframe = computed(() => iframeReady.value)

  function show() {
    open.value = true
    iframeReady.value = true
  }

  function hide() {
    open.value = false
  }

  function toggle() {
    if (open.value) hide()
    else show()
  }

  return {
    isOpen,
    hasLoadedIframe,
    show,
    hide,
    toggle,
  }
}
