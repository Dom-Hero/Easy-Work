<script setup lang="ts">
// 小电视页面 —— 仿飞书文档样式，左上角工作台可返回主页
import { useRouter } from 'vue-router'
import FloatingTv from '@/components/FloatingTv.vue'

const router = useRouter()
function goDashboard() {
  router.push('/dashboard')
}

const navItems = [
  { key: 'home', label: '主页', icon: '⌂' },
  { key: 'docs', label: '文档', icon: '▤' },
  { key: 'wiki', label: '知识库', icon: '✿' },
  { key: 'star', label: '收藏', icon: '★' },
]

const channels = [
  { id: 'c1', label: '小电视产品说明书', meta: '刚刚编辑', tone: 'lavender' },
  { id: 'c2', label: '设计灵感收集', meta: '昨天', tone: 'peach' },
  { id: 'c3', label: '摸鱼图鉴', meta: '3 天前', tone: 'mint' },
  { id: 'c4', label: '工位摆件清单', meta: '上周', tone: 'ochre' },
  { id: 'c5', label: '复古像素画廊', meta: '10 月', tone: 'coral' },
]
</script>

<template>
  <div class="tv-app">
    <aside class="tv-sidebar">
      <div class="tv-sidebar__brand">
        <button type="button" class="tv-sidebar__logo" tabindex="-1">
          <span class="tv-sidebar__mark" aria-hidden="true">视</span>
          <span>小电视</span>
        </button>
        <button type="button" class="tv-sidebar__exit" title="返回工作台" @click="goDashboard">
          工作台
        </button>
      </div>

      <div class="tv-sidebar__search" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6" />
          <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <span>搜索</span>
      </div>

      <nav class="tv-sidebar__nav" aria-label="主导航">
        <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="tv-sidebar__link"
          :class="{ 'tv-sidebar__link--active': item.key === 'home' }"
          tabindex="-1"
        >
          <span class="tv-sidebar__link-icon" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </nav>

      <div class="tv-sidebar__section tv-sidebar__section--grow">
        <div class="tv-sidebar__section-head">
          <span>我的频道</span>
          <span class="tv-sidebar__section-count">{{ channels.length }}</span>
        </div>
        <nav class="tv-sidebar__channels clay-scroll" aria-label="频道列表">
          <button
            v-for="channel in channels"
            :key="channel.id"
            type="button"
            class="tv-sidebar__channel"
            tabindex="-1"
          >
            <span
              class="tv-sidebar__channel-icon"
              :class="`tv-sidebar__channel-icon--${channel.tone}`"
              aria-hidden="true"
            >
              {{ channel.label.slice(0, 1) }}
            </span>
            <span class="tv-sidebar__channel-body">
              <span class="tv-sidebar__channel-title">{{ channel.label }}</span>
              <span class="tv-sidebar__channel-meta">{{ channel.meta }}</span>
            </span>
          </button>
        </nav>
      </div>

      <div class="tv-sidebar__foot" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </aside>

    <div class="tv-main">
      <header class="tv-topbar">
        <nav class="tv-topbar__crumb" aria-label="面包屑">
          <span>小电视</span>
          <span class="tv-topbar__crumb-sep">/</span>
          <span>文档</span>
          <span class="tv-topbar__crumb-sep">/</span>
          <span class="tv-topbar__crumb-current">小电视产品说明书</span>
        </nav>
        <div class="tv-topbar__actions" aria-hidden="true">
          <button type="button" class="tv-topbar__btn" tabindex="-1" title="搜索">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6" />
              <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="tv-topbar__btn" tabindex="-1" title="帮助">?</button>
          <button type="button" class="tv-topbar__btn" tabindex="-1" title="通知">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9a6 6 0 1 1 12 0c0 4 2 5 2 5H4s2-1 2-5Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path
                d="M10 19a2 2 0 0 0 4 0"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <button type="button" class="tv-topbar__btn" tabindex="-1" title="分享">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="6" cy="12" r="2.4" stroke="currentColor" stroke-width="1.6" />
              <circle cx="18" cy="6" r="2.4" stroke="currentColor" stroke-width="1.6" />
              <circle cx="18" cy="18" r="2.4" stroke="currentColor" stroke-width="1.6" />
              <path d="M8 11l8-4M8 13l8 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
          <span class="tv-topbar__avatar">我</span>
        </div>
      </header>

      <div class="tv-content clay-scroll">
        <article class="tv-doc">
          <div class="tv-doc__cover" aria-hidden="true">
            <span class="tv-doc__cover-emoji">📺</span>
            <span class="tv-doc__cover-tag">Designer: 小胖</span>
          </div>

          <h1 class="tv-doc__title">小电视产品说明书</h1>
          <p class="tv-doc__meta">
            <span class="tv-doc__meta-item">
              <span class="tv-doc__avatar">胖</span> 小胖
            </span>
            <span class="tv-doc__meta-sep">·</span>
            <span class="tv-doc__meta-item">创建于 2026-10-30</span>
            <span class="tv-doc__meta-sep">·</span>
            <span class="tv-doc__meta-item">最近编辑：刚刚</span>
          </p>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">一、概述</h2>
            <p class="tv-doc__p">
              <span class="tv-doc__mention">@小胖</span> 设计的「小电视」是一台桌面级复古像素电视，
              它以黏土质感的外壳、可摇摆的天线和永远在播放的雪花屏，把「摸鱼」这件事变成一件
              可以放在工位上的小确幸。本页面以飞书文档样式静态呈现其设计理念与功能要点，
              供团队成员浏览与回顾。
            </p>
            <div class="tv-doc__callout tv-doc__callout--info">
              <span class="tv-doc__callout-icon" aria-hidden="true">💡</span>
              <p>本页为静态展示页，所有按钮、链接均不响应点击，仅作样式预览。</p>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">二、功能特点</h2>
            <ul class="tv-doc__list">
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>悬浮动画</strong>：默认状态下电视轻轻上下浮动，像在呼吸。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>悬停切换</strong>：鼠标移入时，节目画面淡出，雪花屏接管整个屏幕。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>天线摇摆</strong>：悬停时左右天线交替摆动，像在努力寻找信号。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>旋钮旋转</strong>：两个旋钮在悬停时分别顺时针 / 逆时针转动。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>手绘涂鸦</strong>：星星、火花、螺旋等小涂鸦围绕电视漂浮，营造童趣氛围。</p>
              </li>
            </ul>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">三、设计灵感</h2>
            <p class="tv-doc__p">
              灵感来源于老式显像管电视与黏土动画的结合。我们希望保留电视「信号不稳定」的怀旧感，
              同时用柔和的圆角、厚重的描边和偏移阴影，让它看起来像一件可以被捏一捏的玩具。
            </p>
            <div class="tv-doc__quote">
              <p>「它不是一台电视，它是工位上的一只小宠物。」</p>
              <span class="tv-doc__quote-author">—— 小胖</span>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">四、配色方案</h2>
            <div class="tv-doc__swatches">
              <div class="tv-doc__swatch">
                <span class="tv-doc__swatch-color" style="background: #c0bbfe"></span>
                <span class="tv-doc__swatch-name">机身紫</span>
                <span class="tv-doc__swatch-hex">#C0BBFE</span>
              </div>
              <div class="tv-doc__swatch">
                <span class="tv-doc__swatch-color" style="background: #ff8ba7"></span>
                <span class="tv-doc__swatch-name">珊瑚红</span>
                <span class="tv-doc__swatch-hex">#FF8BA7</span>
              </div>
              <div class="tv-doc__swatch">
                <span class="tv-doc__swatch-color" style="background: #c6e377"></span>
                <span class="tv-doc__swatch-name">嫩芽绿</span>
                <span class="tv-doc__swatch-hex">#C6E377</span>
              </div>
              <div class="tv-doc__swatch">
                <span class="tv-doc__swatch-color" style="background: #ffdf6c"></span>
                <span class="tv-doc__swatch-name">柠檬黄</span>
                <span class="tv-doc__swatch-hex">#FFDF6C</span>
              </div>
              <div class="tv-doc__swatch">
                <span class="tv-doc__swatch-color" style="background: #2c2c2c"></span>
                <span class="tv-doc__swatch-name">墨水黑</span>
                <span class="tv-doc__swatch-hex">#2C2C2C</span>
              </div>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">五、交互状态</h2>
            <p class="tv-doc__p">电视共有两种主要状态，对应不同的视觉表达：</p>
            <div class="tv-doc__table-wrap">
              <table class="tv-doc__table">
                <thead>
                  <tr>
                    <th>状态</th>
                    <th>触发</th>
                    <th>屏幕</th>
                    <th>天线</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>默认</td>
                    <td>无</td>
                    <td>播放节目画面</td>
                    <td>静止</td>
                  </tr>
                  <tr>
                    <td>悬停</td>
                    <td>鼠标移入</td>
                    <td>切换为雪花屏</td>
                    <td>左右交替摇摆</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">六、相关链接</h2>
            <div class="tv-doc__links">
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">📺</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">小电视组件源码</span>
                  <span class="tv-doc__link-desc">src/components/tv.vue</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">🎨</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">Clay 设计规范</span>
                  <span class="tv-doc__link-desc">暖色黏土质感设计系统</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">📚</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">电子书阅读器</span>
                  <span class="tv-doc__link-desc">参考页面布局来源</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </section>

          <div class="tv-doc__divider" aria-hidden="true">
            <span>正文到此结束</span>
          </div>
        </article>
      </div>
    </div>

    <FloatingTv />
  </div>
</template>

<style scoped>
.tv-app {
  display: flex;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  background: var(--clay-canvas, #fffaf0);
  color: var(--clay-ink, #0a0a0a);
}

/* ===== 侧边栏 ===== */
.tv-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 12px 12px;
  border-right: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-soft, #faf5e8);
  min-height: 0;
}

.tv-sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
  flex-shrink: 0;
}

.tv-sidebar__logo {
  appearance: none;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--clay-ink, #0a0a0a);
  padding: 0;
}

.tv-sidebar__mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  background: var(--clay-brand-lavender, #b8a4ed);
  border: 1px solid var(--clay-ink, #0a0a0a);
  box-shadow: 2px 2px 0 var(--clay-ink, #0a0a0a);
}

.tv-sidebar__exit {
  appearance: none;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
  color: var(--clay-muted, #6a6a6a);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.tv-sidebar__exit:hover {
  color: var(--clay-ink, #0a0a0a);
  border-color: var(--clay-muted-soft, #9a9a9a);
  transform: translateY(-1px);
}

.tv-sidebar__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 80%, white);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  color: var(--clay-muted-soft, #9a9a9a);
  font-size: 13px;
}

.tv-sidebar__search svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.tv-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tv-sidebar__link {
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--clay-body, #3a3a3a);
  text-align: left;
}

.tv-sidebar__link-icon {
  width: 16px;
  text-align: center;
  color: var(--clay-muted, #6a6a6a);
  font-size: 14px;
}

.tv-sidebar__link--active {
  background: color-mix(in srgb, var(--clay-brand-lavender, #b8a4ed) 30%, white);
  color: var(--clay-ink, #0a0a0a);
  font-weight: 700;
}

.tv-sidebar__link--active .tv-sidebar__link-icon {
  color: var(--clay-brand-teal, #1a3a3a);
}

.tv-sidebar__section {
  margin-top: 10px;
  padding: 0 4px;
}

.tv-sidebar__section--grow {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.tv-sidebar__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
  font-weight: 600;
  flex-shrink: 0;
}

.tv-sidebar__section-count {
  font-size: 11px;
  color: var(--clay-muted-soft, #9a9a9a);
  font-weight: 500;
}

.tv-sidebar__channels {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: auto;
  min-height: 0;
  flex: 1;
}

.tv-sidebar__channel {
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  text-align: left;
  color: var(--clay-body, #3a3a3a);
}

.tv-sidebar__channel-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 45%, white);
  color: var(--clay-brand-teal, #1a3a3a);
}

.tv-sidebar__channel-icon--lavender {
  background: color-mix(in srgb, var(--clay-brand-lavender, #b8a4ed) 50%, white);
  color: #3a2a6a;
}
.tv-sidebar__channel-icon--peach {
  background: color-mix(in srgb, var(--clay-brand-peach, #ffb084) 55%, white);
  color: #8a3d18;
}
.tv-sidebar__channel-icon--mint {
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 50%, white);
  color: var(--clay-brand-teal, #1a3a3a);
}
.tv-sidebar__channel-icon--ochre {
  background: color-mix(in srgb, var(--clay-brand-ochre, #e8b94a) 50%, white);
  color: #6a4a10;
}
.tv-sidebar__channel-icon--coral {
  background: color-mix(in srgb, var(--clay-brand-coral, #ff6b5a) 45%, white);
  color: #6a1a10;
}

.tv-sidebar__channel-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tv-sidebar__channel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--clay-ink, #0a0a0a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tv-sidebar__channel-meta {
  font-size: 11px;
  color: var(--clay-muted-soft, #9a9a9a);
}

.tv-sidebar__foot {
  margin-top: auto;
  display: flex;
  gap: 10px;
  padding: 8px 4px 4px;
}

.tv-sidebar__foot span {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--clay-hairline, #e5e5e5);
}

/* ===== 主区 ===== */
.tv-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--clay-canvas, #fffaf0) 70%, white) 0%,
    var(--clay-canvas, #fffaf0) 100%
  );
}

.tv-topbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px;
}

.tv-topbar__crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--clay-muted, #6a6a6a);
  min-width: 0;
}

.tv-topbar__crumb-sep {
  opacity: 0.5;
}

.tv-topbar__crumb-current {
  color: var(--clay-ink, #0a0a0a);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tv-topbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tv-topbar__btn {
  appearance: none;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--clay-muted, #6a6a6a);
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
}

.tv-topbar__btn svg {
  width: 16px;
  height: 16px;
}

.tv-topbar__avatar {
  width: 28px;
  height: 28px;
  margin-left: 4px;
  border-radius: 50%;
  background: var(--clay-brand-lavender, #b8a4ed);
  color: var(--clay-ink, #0a0a0a);
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.tv-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 28px 28px;
  display: flex;
  justify-content: center;
}

/* ===== 文档区 ===== */
.tv-doc {
  width: 100%;
  max-width: 820px;
  padding: 24px 48px 48px;
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 92%, white);
  border: 1px solid var(--clay-hairline, #e5e5e5);
  border-radius: var(--clay-rounded-lg, 16px);
  box-shadow: 0 1px 0 rgba(10, 10, 10, 0.02);
}

.tv-doc__cover {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.tv-doc__cover-emoji {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 30px;
  background: color-mix(in srgb, var(--clay-brand-lavender, #b8a4ed) 35%, white);
  border: 1px solid var(--clay-hairline, #e5e5e5);
}

.tv-doc__cover-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--clay-brand-teal, #1a3a3a);
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 40%, white);
  border-radius: 999px;
}

.tv-doc__title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: var(--clay-ink, #0a0a0a);
}

.tv-doc__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--clay-hairline-soft, #f0f0f0);
  font-size: 13px;
  color: var(--clay-muted, #6a6a6a);
}

.tv-doc__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tv-doc__meta-sep {
  opacity: 0.5;
}

.tv-doc__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--clay-brand-peach, #ffb084);
  color: var(--clay-ink, #0a0a0a);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.tv-doc__block {
  margin-top: 28px;
}

.tv-doc__h2 {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--clay-ink, #0a0a0a);
  position: relative;
  padding-left: 12px;
}

.tv-doc__h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  border-radius: 2px;
  background: var(--clay-brand-coral, #ff6b5a);
}

.tv-doc__p {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.85;
  color: var(--clay-body-strong, #1a1a1a);
}

.tv-doc__mention {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  margin: 0 2px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--clay-brand-teal, #1a3a3a);
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 35%, white);
}

.tv-doc__callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: color-mix(in srgb, var(--clay-brand-ochre, #e8b94a) 18%, white);
}

.tv-doc__callout-icon {
  flex-shrink: 0;
  font-size: 18px;
  line-height: 1.6;
}

.tv-doc__callout p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--clay-body, #3a3a3a);
}

.tv-doc__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tv-doc__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tv-doc__list-marker {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--clay-brand-coral, #ff6b5a);
  font-size: 13px;
}

.tv-doc__list p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--clay-body-strong, #1a1a1a);
}

.tv-doc__list strong {
  font-weight: 700;
  color: var(--clay-ink, #0a0a0a);
}

.tv-doc__quote {
  margin: 16px 0 0;
  padding: 14px 18px;
  border-left: 3px solid var(--clay-brand-lavender, #b8a4ed);
  background: color-mix(in srgb, var(--clay-brand-lavender, #b8a4ed) 12%, white);
  border-radius: 0 12px 12px 0;
}

.tv-doc__quote p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--clay-body-strong, #1a1a1a);
  font-style: italic;
}

.tv-doc__quote-author {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
}

.tv-doc__swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.tv-doc__swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 10px;
  border-radius: 12px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
}

.tv-doc__swatch-color {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
}

.tv-doc__swatch-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--clay-ink, #0a0a0a);
}

.tv-doc__swatch-hex {
  font-size: 11px;
  color: var(--clay-muted, #6a6a6a);
  font-family: 'SF Mono', 'Menlo', monospace;
}

.tv-doc__table-wrap {
  margin-top: 12px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 92%, white);
}

.tv-doc__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.tv-doc__table th {
  text-align: left;
  font-weight: 600;
  color: var(--clay-muted, #6a6a6a);
  padding: 10px 14px;
  border-bottom: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-soft, #faf5e8);
  white-space: nowrap;
}

.tv-doc__table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--clay-hairline-soft, #f0f0f0);
  color: var(--clay-body, #3a3a3a);
}

.tv-doc__table tr:last-child td {
  border-bottom: none;
}

.tv-doc__links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tv-doc__link-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--clay-hairline, #e5e5e5);
  background: var(--clay-surface-card, #f5f0e0);
  text-decoration: none;
  color: var(--clay-ink, #0a0a0a);
}

.tv-doc__link-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 40%, white);
}

.tv-doc__link-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tv-doc__link-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--clay-ink, #0a0a0a);
}

.tv-doc__link-desc {
  font-size: 12px;
  color: var(--clay-muted, #6a6a6a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tv-doc__link-arrow {
  flex-shrink: 0;
  color: var(--clay-muted-soft, #9a9a9a);
  font-size: 16px;
  font-weight: 600;
}

.tv-doc__divider {
  margin-top: 36px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--clay-muted-soft, #9a9a9a);
  font-size: 12px;
}

.tv-doc__divider::before,
.tv-doc__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--clay-hairline, #e5e5e5);
}

@media (max-width: 768px) {
  .tv-sidebar {
    display: none;
  }

  .tv-content {
    padding: 8px 16px 24px;
  }

  .tv-doc {
    padding: 20px 18px 32px;
  }

  .tv-doc__title {
    font-size: 26px;
  }
}
</style>
