<script setup lang="ts">
import { gsap } from 'gsap';
import { nextTick, onBeforeUpdate, onMounted, onUnmounted, ref, watch, type VNodeRef } from 'vue';
import { useRouter } from 'vue-router';
import { useCardFilter } from '@/composables/useCardFilter';
import Note from './note.vue';
import StartBtn from './startBtn.vue';

const router = useRouter();

const navigateToUser = () => {
  router.push('/user');
};

type CardNavLink = {
  label: string;
  href?: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo?: string;
  logoAlt?: string;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  searchPlaceholder?: string;
}

const props = withDefaults(defineProps<CardNavProps>(), {
  logoAlt: 'Logo',
  className: '',
  ease: 'power3.out',
  baseColor: '#fff',
  searchPlaceholder: '搜索卡片...'
});

const { searchQuery } = useCardFilter();

const isHamburgerOpen = ref(false);
const isExpanded = ref(false);

const navRef = ref<HTMLDivElement | null>(null);
const cardsRef = ref<HTMLDivElement[]>([]);
const tlRef = ref<gsap.core.Timeline | null>(null);

const setCardRef =
  (i: number): VNodeRef =>
  el => {
    if (el && el instanceof HTMLDivElement) {
      cardsRef.value[i] = el;
    }
  };

onBeforeUpdate(() => {
  cardsRef.value = [];
});

const calculateHeight = () => {
  const navEl = navRef.value;
  if (!navEl) return 260;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
    if (contentEl) {
      const wasVisible = contentEl.style.visibility;
      const wasPosition = contentEl.style.position;
      const wasHeight = contentEl.style.height;

      contentEl.style.visibility = 'visible';
      contentEl.style.position = 'static';
      contentEl.style.height = 'auto';

      const topBar = 60;
      const padding = 16;
      const contentHeight = contentEl.scrollHeight;

      contentEl.style.visibility = wasVisible;
      contentEl.style.position = wasPosition;
      contentEl.style.height = wasHeight;

      return topBar + contentHeight + padding;
    }
  }
  return 260;
};

const createTimeline = () => {
  const navEl = navRef.value;
  if (!navEl) return null;

  gsap.set(navEl, { height: 60, overflow: 'hidden' });
  gsap.set(cardsRef.value, { y: 50, opacity: 0 });

  const tl = gsap.timeline({ paused: true });

  tl.to(navEl, {
    height: calculateHeight,
    duration: 0.4,
    ease: props.ease
  });

  tl.to(cardsRef.value, { y: 0, opacity: 1, duration: 0.4, ease: props.ease, stagger: 0.08 }, '-=0.1');

  return tl;
};

const toggleMenu = () => {
  const tl = tlRef.value;
  if (!tl) return;
  if (!isExpanded.value) {
    isHamburgerOpen.value = true;
    isExpanded.value = true;
    nextTick(() => {
      tl.play(0);
    });
  } else {
    isHamburgerOpen.value = false;
    tl.eventCallback('onReverseComplete', () => {
      isExpanded.value = false;
      tl.eventCallback('onReverseComplete', null);
    });
    tl.reverse();
  }
};

const handleResize = () => {
  if (!tlRef.value) return;

  if (isExpanded.value) {
    const newHeight = calculateHeight();
    gsap.set(navRef.value, { height: newHeight });

    tlRef.value.kill();
    const newTl = createTimeline();
    if (newTl) {
      newTl.progress(1);
      tlRef.value = newTl;
    }
  } else {
    tlRef.value.kill();
    tlRef.value = createTimeline();
  }
};

onMounted(() => {
  tlRef.value = createTimeline();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  tlRef.value?.kill();
  tlRef.value = null;
  window.removeEventListener('resize', handleResize);
});

watch(
  () => [props.ease, props.items],
  () => {
    nextTick(() => {
      if (tlRef.value) tlRef.value.kill();
      tlRef.value = createTimeline();
    });
  }
);
</script>

<template>
  <div
    :class="`card-nav-container absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[99] top-[1.2em] md:top-[2em] ${props.className}`"
  >
    <nav
      ref="navRef"
      :class="[
        'card-nav block h-[60px] p-0 rounded-xl relative overflow-hidden will-change-[height]',
        { open: isExpanded }
      ]"
      :style="{ '--nav-glass-tint': props.baseColor }"
    >
      <div
        class="card-nav-top top-0 z-[2] absolute inset-x-0 flex justify-between items-center p-2 px-[1.1rem] h-[60px]"
      >
        <div
          :class="[
            'hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none',
            { open: isHamburgerOpen }
          ]"
          @click="toggleMenu"
          role="button"
          :aria-label="isExpanded ? 'Close menu' : 'Open menu'"
          tabindex="0"
          :style="{ color: props.menuColor || '#000' }"
        >
          <div
            :class="[
              'hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] group-hover:opacity-75',
              { 'translate-y-[4px] rotate-45': isHamburgerOpen }
            ]"
          />
          <div
            :class="[
              'hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] group-hover:opacity-75',
              { '-translate-y-[4px] -rotate-45': isHamburgerOpen }
            ]"
          />
        </div>

        <div class="card-nav-search-wrap">
          <label class="card-nav-search" :style="{ color: props.menuColor || '#000' }">
            <svg
              class="card-nav-search-icon shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L16.5 16.5" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              class="card-nav-search-input"
              :placeholder="props.searchPlaceholder"
              aria-label="搜索卡片"
              autocomplete="off"
            />
          </label>
        </div>
        <StartBtn />
      </div>

      <div
        :class="[
          'card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] md:flex-row md:items-end md:gap-[12px]',
          isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        ]"
        :aria-hidden="!isExpanded"
      >
        <div
          v-for="(item, idx) in (props.items || []).slice(0, 3)"
          :key="`${item.label}-${idx}`"
          :ref="setCardRef(idx)"
          class="relative flex flex-col flex-[1_1_auto] md:flex-[1_1_0%] gap-2 p-[12px_16px] rounded-[16px] min-w-0 h-auto md:h-full min-h-[60px] md:min-h-0 select-none nav-card"
          :style="{ backgroundColor: item.bgColor, color: item.textColor }"
        >
          <div class="h-full w-full" role="link" tabindex="0" @click="navigateToUser" @keydown.enter="navigateToUser">
            <Note />
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.card-nav {
  --glass-tint: var(--nav-glass-tint, var(--clay-canvas, #fffaf0));
  background: color-mix(in srgb, var(--glass-tint) 92%, transparent);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-xl, 24px);
  box-shadow: 0 4px 20px rgba(10, 10, 10, 0.04);
}

.card-nav.open {
  background: var(--clay-canvas, #fffaf0);
  border-color: var(--clay-hairline, #e5e5e5);
  box-shadow: 0 8px 28px rgba(10, 10, 10, 0.06);
}

@supports not (backdrop-filter: blur(1px)) {
  .card-nav {
    background: var(--clay-canvas, #fffaf0);
  }

  .card-nav.open {
    background: var(--clay-canvas, #fffaf0);
  }
}

.card-nav-search-wrap {
  order: 1;
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: 360px;
  margin-inline: 8px;
  display: flex;
  align-items: center;
}

@media (min-width: 640px) {
  .card-nav-search-wrap {
    max-width: 440px;
  }
}

@media (min-width: 768px) {
  .card-nav-search-wrap {
    order: 0;
    flex: none;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(360px, calc(100% - 11rem));
    max-width: none;
    margin-inline: 0;
  }
}

.card-nav-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border-radius: var(--clay-rounded-md, 12px);
  cursor: text;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-canvas, #fffaf0);
  box-shadow: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card-nav-search:focus-within {
  border-color: var(--clay-ink, #0a0a0a);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clay-brand-lavender, #b8a4ed) 35%, transparent);
}

.card-nav-search-icon {
  width: 15px;
  height: 15px;
  opacity: 0.55;
  transition: opacity 0.2s ease;
}

.card-nav-search:focus-within .card-nav-search-icon {
  opacity: 0.85;
}

.card-nav-search-input {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
  color: var(--clay-ink, #0a0a0a);
}

.card-nav-search-input::placeholder {
  color: var(--clay-muted-soft, #9a9a9a);
  opacity: 1;
}

.card-nav-search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
</style>
