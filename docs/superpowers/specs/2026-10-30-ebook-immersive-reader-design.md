# 电子书阅读：文档模式 + 沉浸模式

日期：2026-10-30  
状态：已确认（待实现）  
范围：`ReaderView` 阅读体验；沉浸模式抽离为独立组件

## 目标

在现有电子书阅读器上增加两种模式：

1. **文档模式** — 保留当前整章滚动、按需加载、章末切章体验  
2. **沉浸模式** — 文字落在书本页上，桌面双页对开、窄屏单页，CSS 翻页动效，点击左右侧翻页；章末自动进入下一章  

沉浸模式独立成组件，避免 `ReaderView.vue` 膨胀，便于后续维护。

## 约束（已与产品确认）

| 项 | 选择 |
|---|---|
| 翻页动效 | 纯 CSS / Vue（`rotateY` + 阴影），不引入第三方翻页库 |
| 版式 | 桌面双页对开；约 `max-width: 800px` 退化为单页 |
| 模式切换 | 阅读顶栏「文档 \| 沉浸」切换；`localStorage` 记住偏好 |
| 章末行为 | 末页再下一页 → 自动进入下一章首页；首页再上一页 → 上一章末页；无章则不响应或轻提示 |
| 实现路径 | 测量分页 + CSS 翻页组件 |

## 非目标

- 不引入 `turn.js` / `page-flip` 等依赖  
- 不改 ebook 解析、编码、IndexedDB 入库逻辑  
- 不改书架 / 首页导入流程  
- 本期不做沉浸 ↔ 文档的精确页内滚动同步（切换只保证同一章节）  
- 本期不做书签、划线、字体大小设置面板  

## 架构

```
ReaderView.vue
  ├── 顶栏（返回 / 面包屑 / 章节选择 / 模式切换）
  ├── 章节正文加载（loadChapterText，现有逻辑）
  ├── document 模式 → 现有滚动文档 UI
  └── immersive 模式 → ImmersiveReader.vue
                          └── usePagePagination.ts（测量切页）
```

| 单元 | 职责 |
|------|------|
| `ReaderView.vue` | 数据加载、章节切换、顶栏、模式切换；按模式渲染子视图 |
| `ImmersiveReader.vue`（新建，建议路径 `src/components/ebook/ImmersiveReader.vue`） | 书本外观、双页/单页、CSS 翻页、左右点击与键盘 |
| `usePagePagination.ts`（新建，建议路径 `src/composables/usePagePagination.ts`） | 给定正文 + 页尺寸 → `string[]` 页内容 |

### 数据流

1. `ReaderView` 负责 `loadChapterText`，维护 `fullText` / `loading` / `loadFailed`  
2. `mode === 'document'` → 现有文档 UI（滚动 + 渐进渲染可保留）  
3. `mode === 'immersive'` → 将正文与章节边界能力传给 `ImmersiveReader`  
4. 沉浸组件在页边界外翻时 `emit('prev-chapter' | 'next-chapter')`，由 `ReaderView` 更新 `chapterId`  
5. 模式键：`localStorage['ebook-reader-mode']`，值 `'document' | 'immersive'`，默认 `'document'`

## 组件接口

### `ImmersiveReader` props

| prop | 类型 | 说明 |
|------|------|------|
| `text` | `string` | 当前章全文 |
| `title` | `string` | 章标题（页眉） |
| `hasPrevChapter` | `boolean` | 是否有上一章 |
| `hasNextChapter` | `boolean` | 是否有下一章 |
| `loading` | `boolean` | 加载中 |
| `failed` | `boolean` | 加载失败 |
| `startAt` | `'start' \| 'end'` | 换章后落地页；默认 `'start'`。上一章回退时用 `'end'` |

### emits

| 事件 | 时机 |
|------|------|
| `prev-chapter` | 首页再上一页且 `hasPrevChapter`（父级切章后应以 `startAt="end"` 打开） |
| `next-chapter` | 末页再下一页且 `hasNextChapter`（父级切章后以 `startAt="start"` 打开） |

可选：`page-change`（页码变化）本期可不接。

## 交互细节

- **点击热区**：书本左约 1/3 → 上一页；右约 1/3 → 下一页；中间不翻页  
- **键盘**：`←` / `→`，以及 `PageUp` / `PageDown`  
- **双页步进**：宽屏一次翻 2 页；单页步进 1  
- **动画**：CSS `rotateY` + 页缘阴影，约 400–600ms；动画进行中忽略重复输入  
- **换章 / resize**：debounce 后重新测量分页；用字符偏移映射到最接近的新页，尽量保持进度  
- **顶栏切换**：保留当前章节；文档 ↔ 沉浸不强制页内位置对齐  

## 视觉

- 浅色纸面、书脊与页边阴影/微渐变；沿用 clay 色板（`--clay-*`），不引入紫霓虹风  
- 正文字体与文档模式一致：宋体系 + 相近字号/行高  
- 页脚「当前页 / 总页」；双页时左右各标页码  
- 书本居中；四周略暗阅读底，突出沉浸感  
- `prefers-reduced-motion: reduce`：跳过翻页动画，直接换页  

## 分页算法（`usePagePagination`）

1. 离屏测量节点：与真实页同宽高、同字体/行高/padding  
2. 贪心或二分累加文本，直到 `scrollHeight` 超出页高 → 切出一页  
3. 尽量在换行 / 段落边界切开，避免半行  
4. 输出 `string[]`；双页按索引成对展示  
5. `text` 或尺寸变化时重算；通过字符偏移恢复页位  

## 错误与边界

| 情况 | 行为 |
|------|------|
| loading | 书本区域状态文案，不可翻页 |
| failed | 失败文案，不可翻页 |
| 空章 | 单页「本章暂无正文」 |
| 无上一/下一章 | 边界翻页不 emit、无 toast |
| 极短章（不足一页） | 一页（或双页时右页留白） |

## 文件改动清单

| 文件 | 动作 |
|------|------|
| `src/views/ebook/ReaderView.vue` | 模式切换 + 条件渲染沉浸组件 |
| `src/components/ebook/ImmersiveReader.vue` | 新建 |
| `src/composables/usePagePagination.ts` | 新建 |

## 验收标准

- [ ] 顶栏可在文档 / 沉浸间切换，刷新后记住上次模式  
- [ ] 文档模式行为与现网一致（滚动、渐进加载、章末切章）  
- [ ] 沉浸模式桌面双页、窄屏单页；左右点击与键盘可翻页  
- [ ] 有 CSS 翻页动效；`prefers-reduced-motion` 下无动画硬切  
- [ ] 章末自动进下一章；章首可回上一章  
- [ ] 沉浸相关代码主要在独立组件 / composable 中，`ReaderView` 不膨胀为巨石文件  
- [ ] 无新 npm 翻页依赖  
