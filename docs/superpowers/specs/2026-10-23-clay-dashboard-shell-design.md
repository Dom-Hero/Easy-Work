# Clay 风 Dashboard + 全局壳 视觉重肤

日期：2026-10-23  
状态：已确认（待实现）  
依据：`DESIGN-clay.md`  
范围：Dashboard + `AdminLayout` / `CardNav` / 背景动效（不含笔记页 `/user`）

## 目标

将首页与全局壳从「深色霓虹科技风」调整为 Clay 规范的暖奶油画布 + 高饱和单色 feature card 氛围，业务逻辑（搜索过滤、卡片跳转、导航展开）保持不变。

## 约束（已与产品确认）

| 项 | 选择 |
|---|---|
| 范围 | Dashboard + 全局壳 |
| 背景 | 保留轻量动效，改为浅色低对比暖色细线 |
| 卡片 | 六色轮换饱和底（pink / teal / lavender / peach / ochre / cream） |
| 导航 | 保留折叠/展开交互，只换色与圆角 |
| 实现路径 | Token 驱动重肤 |

## 非目标

- 不改笔记页 `/user` 视觉
- 不新增 3D claymation 插画资源
- 不改路由、卡片数据源结构、搜索/跳转业务逻辑
- 不引入 Plain Black 字体文件；用 Inter 500 + 负字距近似 display

## 架构

```
DESIGN-clay.md
      ↓ tokens
base.css / :root CSS variables
      ↓ consumed by
AdminLayout ── FloatingLines（浅色线渐变参数）
     │
     ├── CardNav / StartBtn / Note（换肤）
     └── Dashboard ── InfoCard（variant 六色）
```

组件只引用 CSS 变量或少量 props（如 `variant` / `colorIndex`），避免硬编码霓虹色。

## Token 落地

在 `src/assets/base.css`（或等价全局样式）定义：

**颜色：** `primary`、`ink`、`body`、`muted`、`muted-soft`、`hairline`、`canvas`、`surface-soft`、`surface-card`、`on-primary`、`on-dark`、以及 `brand-pink|teal|lavender|peach|ochre`、`brand-mint`（背景线可用）。

**圆角：** `rounded-md 12px`、`rounded-lg 16px`、`rounded-xl 24px`。

**语义映射：**

- 页面背景 → `canvas`
- 主按钮 → `primary` + `on-primary`
- 输入框 → canvas + hairline 边框，高度约 44px，圆角 md

**暗色系统：** 壳层与 Dashboard 固定暖浅 Clay，不跟随 `prefers-color-scheme: dark` 切到深色底（避免与奶油规范冲突）。笔记页本轮不动。

## 壳层 + 背景

### AdminLayout

- 根容器背景：`canvas`
- 继续全屏列布局：顶栏 + 可滚动 content
- 传入 `FloatingLines` 的颜色/强度参数改为暖浅低对比；减弱 bend / 对比度，避免压过卡片

### FloatingLines

- 保留组件与交互能力
- `lineGradient`（或等价）改为 peach / ochre / lavender / mint 的淡色版本
- 线更细、动画更慢、透明度更低；画布清晰区域仍以奶油色为主

### CardNav

- 保留：汉堡展开、搜索绑定 `useCardFilter`、跳转笔记等行为
- 换肤：`baseColor` → canvas；按钮 → primary 近黑；文字 → ink
- 展开面板：`surface-soft` / 浅色，圆角 lg/xl，去掉紫青霓虹
- 搜索框对齐 `text-input` token

### StartBtn / Note

- 仅 token 换色，不改行为

## Dashboard + InfoCard

### Dashboard

- 保留自适应列宽计算与 `filteredList` 逻辑
- gap 调整为约 24–32px；padding 使用 spacing token
- 空状态文字使用 `muted`，不再用半透明白

### InfoCard

- 去掉 `::before` / `::after` 霓虹光晕
- 饱和单色 feature card：`rounded-xl`，内边距约 24–32px
- 颜色按列表 index 轮换六色；父组件传入 `colorIndex` 或 `variant`
- 文字对比度：
  - pink / teal → 白字（`on-primary` / `on-dark`）
  - lavender / peach / ochre / cream → ink
- CTA「跳转」：`button-on-color` 风格（白底深字或反色适配），始终可见或轻 hover，不再底部滑出隐藏
- hover：轻微上移 + 极淡阴影；无强发光
- 点击：仍 `window.open` 新标签

## 主要改动文件

| 文件 | 变更 |
|---|---|
| `src/assets/base.css` | Clay CSS 变量；壳层不跟系统暗色 |
| `src/layouts/AdminLayout.vue` | 奶油底；FloatingLines / CardNav 参数 |
| `src/components/background/FloatingLines.vue` | 默认可接受浅色渐变（或由 layout 传入） |
| `src/components/CardNav.vue` | 样式与默认色对齐 Clay |
| `src/components/startBtn.vue` / `note.vue` | 换色（若硬编码） |
| `src/components/infoCard.vue` | feature card 重做 |
| `src/views/dashboard/index.vue` | 间距、空状态、传入 colorIndex |

## 验收标准

1. 打开 Dashboard：背景为暖奶油，无紫青霓虹主色调
2. 顶栏保留展开/搜索；视觉为浅色 + 近黑按钮
3. 卡片为六色轮换饱和底，圆角约 24px，无发光边框
4. 搜索过滤与跳转行为与改前一致
5. `/user` 笔记页视觉本轮无要求变更

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| FloatingLines 浅色后几乎看不见 | 保留极淡色；必要时略提高 opacity，仍低于卡片对比 |
| 六色轮换导致部分组合对比不足 | 按上表固定字色规则；必要时 cream 卡加 hairline |
| CardNav 内部硬编码色 | 优先改 CSS / props，少动 GSAP 时间轴逻辑 |
