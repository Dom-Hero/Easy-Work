<script setup lang="ts">
// 小电视页面 —— 仿飞书文档样式，左上角工作台可返回主页
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import FloatingTv from '@/components/tv/FloatingTv.vue'
import FloatingMatch3 from '@/components/tv/FloatingMatch3.vue'

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

interface Channel {
  id: string
  label: string
  meta: string
  tone: string
  emoji: string
  author: string
  created: string
}

const channels: Channel[] = [
  { id: 'c1', label: '小电视产品说明书', meta: '刚刚编辑', tone: 'lavender', emoji: '📺', author: '小胖', created: '2026-10-30' },
  { id: 'c6', label: '羊了个羊玩法与算法', meta: '刚刚编辑', tone: 'mint', emoji: '🐑', author: '小胖', created: '2026-11-03' },
  { id: 'c7', label: '我的小家玩法与算法', meta: '刚刚编辑', tone: 'peach', emoji: '🏠', author: '小胖', created: '2026-11-03' },
]

const activeId = ref<Channel['id']>('c1')
const activeChannel = computed(() => channels.find(c => c.id === activeId.value) ?? channels[0]!)
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
            :class="{ 'tv-sidebar__channel--active': channel.id === activeId }"
            @click="activeId = channel.id"
          >
            <span
              class="tv-sidebar__channel-icon"
              :class="`tv-sidebar__channel-icon--${channel.tone}`"
              aria-hidden="true"
            >
              {{ channel.emoji }}
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
          <span class="tv-topbar__crumb-current">{{ activeChannel.label }}</span>
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
            <span class="tv-doc__cover-emoji">{{ activeChannel.emoji }}</span>
            <span class="tv-doc__cover-tag">Designer: {{ activeChannel.author }}</span>
          </div>

          <h1 class="tv-doc__title">{{ activeChannel.label }}</h1>
          <p class="tv-doc__meta">
            <span class="tv-doc__meta-item">
              <span class="tv-doc__avatar">{{ activeChannel.author.slice(0, 1) }}</span> {{ activeChannel.author }}
            </span>
            <span class="tv-doc__meta-sep">·</span>
            <span class="tv-doc__meta-item">创建于 {{ activeChannel.created }}</span>
            <span class="tv-doc__meta-sep">·</span>
            <span class="tv-doc__meta-item">最近编辑：{{ activeChannel.meta }}</span>
          </p>

          <!-- c1：小电视产品说明书 -->
          <template v-if="activeId === 'c1'">
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
                  <span class="tv-doc__link-desc">src/components/tv/tv.vue</span>
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
          </template>

          <!-- c6：羊了个羊玩法与算法 -->
          <template v-else-if="activeId === 'c6'">
          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">一、玩法说明</h2>
            <p class="tv-doc__p">
              「羊了个羊」是一款层叠消除类小游戏。牌桌由多层卡牌堆叠而成，玩家需要点击
              <strong>未被上层覆盖</strong> 的卡牌，将其送入底部 7 格槽位；槽位中集齐
              <strong>3 张相同图案</strong> 的卡牌即自动消除。清空全部卡牌即获胜，
              若槽位满 7 张且无法再消除则失败。
            </p>
            <ul class="tv-doc__list">
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>点击</strong>：点击卡堆中露出的（未被覆盖的）卡牌，它会飞入底部槽位末尾。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>消除</strong>：槽位内同图案达到 3 张时自动消除，腾出空间。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>暂放区</strong>：使用「移出」道具可把一张卡牌挪到暂放区，不占槽位、不计消除，必要时可点回槽位。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>胜负</strong>：所有卡牌消除完毕 → 获胜；槽位满 7 张且无三同 → 失败。</p>
              </li>
            </ul>
            <div class="tv-doc__callout tv-doc__callout--info">
              <span class="tv-doc__callout-icon" aria-hidden="true">💡</span>
              <p>本作刻意调高了难度：每局有解率每次重开都会随机生成，且严格不超过 10%，绝大多数局面需要靠道具与运气才能通关。</p>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">二、道具系统</h2>
            <div class="tv-doc__table-wrap">
              <table class="tv-doc__table">
                <thead>
                  <tr>
                    <th>道具</th>
                    <th>次数</th>
                    <th>作用</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>移出</td>
                    <td>3</td>
                    <td>把任意一张可点击的卡堆卡或槽位卡挪到暂放区，缓解槽位压力</td>
                  </tr>
                  <tr>
                    <td>撤回</td>
                    <td>3</td>
                    <td>把槽位中最后一张卡牌退回原卡堆位置</td>
                  </tr>
                  <tr>
                    <td>洗牌</td>
                    <td>1</td>
                    <td>重新随机分配卡堆中剩余卡牌的类型（槽位卡不变）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">三、堆叠结构</h2>
            <p class="tv-doc__p">
              牌桌采用 <strong>直接覆盖堆叠</strong>（层间无错位偏移），共 7 层：
              <code class="tv-doc__code">8×4 / 8×4 / 6×3 / 6×3 / 6×3 / 5×3 / 4×3</code>，
              另加左右两个侧堆各 7 张。其中 <code class="tv-doc__code">8×4</code> 重复 2 次、
              <code class="tv-doc__code">6×3</code> 重复 3 次——同尺寸层完全重叠，上层把下层完全盖住，
              形成「隐藏层」。玩家可见 4 个阶梯，实际却有 7 层，难以看清底下到底压着几层。
            </p>
            <div class="tv-doc__callout tv-doc__callout--info">
              <span class="tv-doc__callout-icon" aria-hidden="true">🎯</span>
              <p>总卡数 159（board 145 + 侧堆 14），恰好 53 组三连，可被 3 整除。</p>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">四、关卡生成算法</h2>
            <p class="tv-doc__p">
              每次重开时，先随机生成一个 <code class="tv-doc__code">solvableRate ∈ [0, 0.10]</code>
              作为本局有解率，再据此决定走「构造法」或「纯随机」：
            </p>
            <ul class="tv-doc__list">
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p>
                  <strong>构造法（小概率，必有解）</strong>：以 <code class="tv-doc__code">Math.random() &lt; solvableRate</code>
                  命中时启用。计算卡牌间的覆盖关系 DAG，用 Kahn 拓扑排序得到一个合法移除顺序，
                  再沿该顺序每 3 张分配同类型。按此顺序点击时每张牌轮到时都已不被覆盖、且每三连立即消除，
                  槽位从不超过 3，故必有解。
                </p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p>
                  <strong>纯随机（大概率，极难/无解）</strong>：未命中时，把「每 3 张同类型」的类型池打乱后随机分配到各位置，
                  不做可解校验。贪心求解器实测对这种牌局可解率为 0%，对玩家而言即极难/无解。
                </p>
              </li>
            </ul>
            <p class="tv-doc__p">核心构造法伪代码如下：</p>
            <pre class="tv-doc__code-block"><code>function buildSolvable(positions):
    deck = positions.map(建空牌)
    order = topoOrder(deck)          # 覆盖关系 DAG 的 Kahn 拓扑序
    for k in 0 .. groupCount-1:
        t = TYPES[k % TYPES.length]
        for r in 0..2:
            deck[order[k*3 + r]].type = t   # 沿移除序每 3 张同类型
    return deck

function topoOrder(deck):
    # 覆盖者 → 被覆盖者 的有向边，入度 = 被多少张牌覆盖
    # 入度为 0（顶层、可先移除）的入队，随机出队，逐步剥离
    # 返回一个合法的移除顺序（覆盖者在前）</code></pre>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">五、覆盖与求解判定</h2>
            <p class="tv-doc__p">
              <strong>覆盖判定</strong> <code class="tv-doc__code">covers(a, b)</code>：a、b 同堆、
              a 层 &gt; b 层，且（board 堆还需矩形重叠）时，a 覆盖 b。只有未被任何牌覆盖的卡牌才可点击。
            </p>
            <p class="tv-doc__p">
              <strong>贪心求解器</strong> <code class="tv-doc__code">isSolvable</code>：每步在所有可点击牌中，
              选「该类型在可点击牌与槽位中出现总数最多」的一张送入槽位，模拟三连消除与槽位上限，
              能清空则判定可解。它是一条启发式解法——能解出 ⇒ 必有解；解不出 ⇒ 对玩家极难。
            </p>
            <div class="tv-doc__callout tv-doc__callout--info">
              <span class="tv-doc__callout-icon" aria-hidden="true">⚠️</span>
              <p>实测贪心求解器对纯随机牌局可解率为 0%，因此无法用它「挑出」有解牌局——这正是改用构造法保证有解、用随机率控制难度的原因。</p>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">六、相关链接</h2>
            <div class="tv-doc__links">
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">🐑</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">羊了个羊组件源码</span>
                  <span class="tv-doc__link-desc">src/components/games/SheepGame.vue</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">📺</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">小电视悬浮入口</span>
                  <span class="tv-doc__link-desc">src/components/tv/FloatingTv.vue</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </section>
          </template>

          <!-- c7：我的小家玩法与算法 -->
          <template v-else-if="activeId === 'c7'">
          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">一、玩法说明</h2>
            <p class="tv-doc__p">
              「我的小家」是一款经典 Match-3 消消乐。棋盘上摆满水果方块，交换相邻两块使
              <strong>横向或纵向连成 3 个及以上同色</strong> 即可消除；消除会连锁下落并补新块。
              每关有步数上限与通关目标，在步数用尽前完成全部目标即获胜。
            </p>
            <ul class="tv-doc__list">
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>交换</strong>：点击选中一格，再点相邻格进行交换；无效交换会弹回。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>特殊棋子</strong>：4 连出火箭（清整行/列）、L/T 形出炸弹（炸 2×2）、5 连出彩虹球（清随机一色）。双击道具可直接触发。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>障碍物</strong>：冰块盖在格子上需消除覆盖层；锁链锁住棋子不可移动；石头占格不可交换，靠相邻消除震碎。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>通关</strong>：完成关卡全部目标（分数 / 收集颜色 / 清障碍）→ 获胜，按剩余步数评 1～3 星。</p>
              </li>
            </ul>
            <div class="tv-doc__callout tv-doc__callout--info">
              <span class="tv-doc__callout-icon" aria-hidden="true">💡</span>
              <p>右下角悬浮「小房子」入口可随时打开。默认继续当前关；点 🗺️ 打开 100 关选关地图。进度保存在本机 localStorage。</p>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">二、关卡与目标</h2>
            <p class="tv-doc__p">
              共 <strong>100 关</strong>：前 10 关手写精调（教学向），第 11～100 关由难度曲线程序化生成。
              第一关永远解锁，通关后解锁下一关；星级只保留更好成绩。
            </p>
            <div class="tv-doc__table-wrap">
              <table class="tv-doc__table">
                <thead>
                  <tr>
                    <th>目标类型</th>
                    <th>字段</th>
                    <th>判定</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>score</td>
                    <td>target</td>
                    <td>累计分数 ≥ 目标分</td>
                  </tr>
                  <tr>
                    <td>collect</td>
                    <td>color + target</td>
                    <td>消除指定颜色方块数 ≥ 目标</td>
                  </tr>
                  <tr>
                    <td>clear</td>
                    <td>blocker + target</td>
                    <td>清除指定障碍（ice / rock / chain）层数归零次数 ≥ 目标</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="tv-doc__p">
              星级规则：剩余步数 ≥ 总步数 40% → 3 星；≥ 15% → 2 星；否则 1 星。
              存储 key：<code class="tv-doc__code">match3_progress</code> →
              <code class="tv-doc__code">{ stars, currentLevel }</code>。
            </p>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">三、难度旋钮</h2>
            <p class="tv-doc__p">
              Match-3 难度不是线性的。按影响力从高到低：
            </p>
            <div class="tv-doc__table-wrap">
              <table class="tv-doc__table">
                <thead>
                  <tr>
                    <th>旋钮</th>
                    <th>影响</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>颜色种类数</td>
                    <td>★★★★★</td>
                    <td>4→5 色凑三消概率断崖下降，最强杠杆</td>
                  </tr>
                  <tr>
                    <td>目标 / 步数比</td>
                    <td>★★★★★</td>
                    <td>真正难度是「每步需完成多少量」，不是步数绝对值</td>
                  </tr>
                  <tr>
                    <td>障碍物</td>
                    <td>★★★★</td>
                    <td>冰、石、链压缩可操作空间</td>
                  </tr>
                  <tr>
                    <td>棋盘尺寸</td>
                    <td>★★★</td>
                    <td>7×7 → 8×8；越大组合多但收益递减</td>
                  </tr>
                  <tr>
                    <td>特殊棋子</td>
                    <td>★★★</td>
                    <td>开启后玩家变强；教学关可关闭</td>
                  </tr>
                  <tr>
                    <td>目标数量</td>
                    <td>★★★</td>
                    <td>1 个目标 → 2 个目标是乘法级提升</td>
                  </tr>
                  <tr>
                    <td>洗牌保底</td>
                    <td>★★</td>
                    <td>无解自动洗牌降难度；后期可关闭加压</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="tv-doc__callout tv-doc__callout--info">
              <span class="tv-doc__callout-icon" aria-hidden="true">⚠️</span>
              <p>新手最常犯的错：只调步数。步数从 25 减到 15 不会让难度涨 66%，只会让人觉得「卡」。真正该调的是颜色数与目标量。</p>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">四、难度曲线算法</h2>
            <p class="tv-doc__p">
              不用手写 200 关，也不纯随机（会跳变）。采用
              <strong>分段模板 + 段内线性插值</strong>：每个 tier 定义区间终点与起止参数，
              关卡 id 落在段内时按进度 <code class="tv-doc__code">t ∈ [0,1]</code> 插值。
            </p>
            <pre class="tv-doc__code-block"><code>const TIERS = [
  { to: 10,  colors: 4, board: 7×7, moves: [32,26], goals: [score],            blockers: 0 },
  { to: 25,  colors: 4, board: 7×7, moves: [28,22], goals: [score,collect],    blockers: 3 },
  { to: 45,  colors: 5, board: 8×8, moves: [28,22], goals: [collect,clear],    blockers: 8 },
  { to: 70,  colors: 5, board: 8×8, moves: [24,18], goals: [collect,clear],    blockers: 16 },
  { to: 100, colors: 6, board: 8×8, moves: [24,18], goals: [collect,clear,score], blockers: 20 },
]

function generateLevel(id):
    tier, t = locate(id)                 # t = 段内进度 0→1
    moves = lerp(tier.moves[0], tier.moves[1], t)
    # 关键公式：目标量 = 步数 × 每步压力
    scoreTarget   = moves * lerp(40, 90, t)
    collectTarget = moves * lerp(1.2, 2.0, t)
    clearTarget   = lerp(6, 24, t)
    blockers = buildBlockerLayout(≤25% 格子)
    autoShuffle = id &lt; 60                # 后期取消保底</code></pre>
            <p class="tv-doc__p">
              障碍物用字符画布描述，便于肉眼校对：
              <code class="tv-doc__code">.</code> 空地、
              <code class="tv-doc__code">i/I</code> 单/双层冰、
              <code class="tv-doc__code">r</code> 石头、
              <code class="tv-doc__code">c</code> 锁链。
              程序化布局时障碍总量不超过棋盘格子的 25%，避免堵死。
            </p>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">五、核心棋盘逻辑</h2>
            <p class="tv-doc__p">
              开局生成必须同时满足：<strong>不能已有三消</strong>，且
              <strong>至少存在一步合法交换</strong>。否则会白送分或开局卡死。
            </p>
            <pre class="tv-doc__code-block"><code>function createBoard(cfg):
    do:
        for 每格:
            随机颜色，避开「左侧/上方已有两连同色」
            石头格不放棋子
        while 仍无可行步: 洗牌（跳过特殊棋子与锁链格）
    while !hasPossibleMove()

function hasPossibleMove(grid):
    遍历每个相邻对（右 / 下）
    若任一方是特殊棋子 → 可动
    否则试交换，检测是否产生 match，再换回
    锁链格不可参与交换</code></pre>
            <p class="tv-doc__p">
              <strong>消除流水线</strong>：找连续 runs（横/竖 ≥3）→ 合并为 cluster →
              按规则决定是否生成特殊棋子 → 展开特殊棋子连锁 → 计分与目标进度 →
              播放动效 → 清除 → 重力下落补块 → 循环直到无 match。
            </p>
            <p class="tv-doc__p">
              <strong>障碍损伤</strong>：消除格子上的冰直接掉层；相邻格的石头/锁链被「震碎」掉层；
              石头消失后格子变为可落入空位。重力下落时石头格当作实心，棋子绕开。
            </p>
            <div class="tv-doc__callout tv-doc__callout--info">
              <span class="tv-doc__callout-icon" aria-hidden="true">🎯</span>
              <p>无解检测：每步结算后若无可移动交换，autoShuffle 开启则洗牌，否则直接判负（后期加压关）。</p>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">六、难度模拟器</h2>
            <p class="tv-doc__p">
              手调系数容易翻车。开发期用贪心代理批量跑关卡，估通过率曲线：
            </p>
            <ul class="tv-doc__list">
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>贪心玩家</strong>：每步选「能消最多格子」的合法交换，代表普通玩家水平。</p>
              </li>
              <li>
                <span class="tv-doc__list-marker">✦</span>
                <p><strong>随机玩家</strong>：随机合法交换，测下限通过率。</p>
              </li>
            </ul>
            <div class="tv-doc__table-wrap">
              <table class="tv-doc__table">
                <thead>
                  <tr>
                    <th>贪心通过率</th>
                    <th>定位</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>&gt; 85%</td><td>送分关 / 教学关</td></tr>
                  <tr><td>65% ~ 85%</td><td>简单</td></tr>
                  <tr><td>45% ~ 65%</td><td>中等（大部分关卡应落在这里）</td></tr>
                  <tr><td>30% ~ 45%</td><td>困难</td></tr>
                  <tr><td>&lt; 25%</td><td>劝退，除非是卡点关</td></tr>
                </tbody>
              </table>
            </div>
            <p class="tv-doc__p">
              命令：<code class="tv-doc__code">npm run match3:rate</code>
              （可选参数：trials from to，例如
              <code class="tv-doc__code">npx tsx scripts/match3-rate.ts 80 1 100</code>）。
              输出 CSV 后肉眼检查是否单调、有无突然掉 20% 以上的尖刺。
            </p>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">七、模块结构</h2>
            <div class="tv-doc__table-wrap">
              <table class="tv-doc__table">
                <thead>
                  <tr>
                    <th>路径</th>
                    <th>职责</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>src/game/match3/levels.ts</td>
                    <td>手写第 1～10 关配置</td>
                  </tr>
                  <tr>
                    <td>src/game/match3/curve.ts</td>
                    <td>TIERS 插值生成 11～100 关</td>
                  </tr>
                  <tr>
                    <td>src/game/match3/blockers.ts</td>
                    <td>字符画布解析与程序化障碍布局</td>
                  </tr>
                  <tr>
                    <td>src/game/match3/rate.ts</td>
                    <td>贪心/随机模拟与通过率统计</td>
                  </tr>
                  <tr>
                    <td>src/composables/useMatch3Level.ts</td>
                    <td>解锁、星级、currentLevel 持久化</td>
                  </tr>
                  <tr>
                    <td>src/components/games/Match3Game.vue</td>
                    <td>棋盘、消除、动效（视图层）</td>
                  </tr>
                  <tr>
                    <td>src/components/tv/FloatingMatch3.vue</td>
                    <td>悬浮入口 + 继续当前关 + 选关地图</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="tv-doc__block">
            <h2 class="tv-doc__h2">八、相关链接</h2>
            <div class="tv-doc__links">
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">🏠</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">我的小家组件源码</span>
                  <span class="tv-doc__link-desc">src/components/games/Match3Game.vue</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">📐</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">关卡与难度曲线</span>
                  <span class="tv-doc__link-desc">src/game/match3/</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
              <a class="tv-doc__link-card" tabindex="-1">
                <span class="tv-doc__link-icon" aria-hidden="true">🧪</span>
                <span class="tv-doc__link-body">
                  <span class="tv-doc__link-title">难度模拟脚本</span>
                  <span class="tv-doc__link-desc">npm run match3:rate</span>
                </span>
                <span class="tv-doc__link-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </section>
          </template>

          <div class="tv-doc__divider" aria-hidden="true">
            <span>正文到此结束</span>
          </div>
        </article>
      </div>
    </div>

    <FloatingTv />
    <FloatingMatch3 />
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
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tv-sidebar__channel:hover {
  background: color-mix(in srgb, var(--clay-canvas, #fffaf0) 70%, white);
}

.tv-sidebar__channel--active {
  background: color-mix(in srgb, var(--clay-brand-lavender, #b8a4ed) 28%, white);
  color: var(--clay-ink, #0a0a0a);
}

.tv-sidebar__channel--active .tv-sidebar__channel-title {
  color: var(--clay-ink, #0a0a0a);
  font-weight: 700;
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

/* 内联代码 */
.tv-doc__code {
  display: inline-block;
  padding: 1px 7px;
  margin: 0 2px;
  border-radius: 6px;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  color: var(--clay-brand-teal, #1a3a3a);
  background: color-mix(in srgb, var(--clay-brand-mint, #a4d4c5) 22%, white);
  border: 1px solid var(--clay-hairline-soft, #f0f0f0);
  white-space: nowrap;
}

/* 代码块 */
.tv-doc__code-block {
  margin: 12px 0 4px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #2c2c2c;
  color: #f4ecd8;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow: auto;
  white-space: pre;
}

.tv-doc__code-block code {
  font-family: inherit;
  color: inherit;
  background: transparent;
  padding: 0;
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
