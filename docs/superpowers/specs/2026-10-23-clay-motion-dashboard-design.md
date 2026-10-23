# Clay Dashboard 完整站感 + 玩味动效

日期：2026-10-23  
状态：已确认  
依据：`DESIGN-clay.md`  
前置：`2026-10-23-clay-dashboard-shell-design.md`（token / 六色卡 / 浅色壳）

## 目标

在已有 Clay token 换肤基础上，把 Dashboard + 壳做成更完整的 Clay 产品站感，并叠加克制的玩味动效；笔记页仅轻量跟色。

## 约束

| 项 | 选择 |
|---|---|
| 范围 | Dashboard + 壳为主；`/user` 轻量跟色 |
| 布局 | 轻量 hero + 工具卡片网格 |
| 动效 | 入场 GSAP 编排 + 交互 spring（C） |
| 实现 | 增强现有组件，不新动效库 |

## 非目标

- 不引入 3D claymation 素材 / Plain Black 字体
- 不重构笔记编辑器业务逻辑
- 不做强发光、循环晃动、重滚动视差

## 结构

**Dashboard**
- Hero：badge + display 标题 + 一句说明；旁侧几何色块装饰（粉/桃/薰衣草）
- 下方六色 feature 卡片网格（更大 padding，gap 24–32）

**壳**
- 奶油顶栏 + 近黑 CTA；背景暖线再压对比
- CardNav 展开略加 overshoot

**笔记页**
- 侧栏/顶栏/内容区背景与主色跟 Clay token

## 动效

1. Hero 分步入场（标题 → 副文 → 装饰）
2. 卡片 stagger 入场（y + scale）
3. 搜索结果短 fade，避免硬切
4. 卡片 hover 上浮 / press scale 0.98；按钮微反馈
5. 搜索 focus 边框 + lavender 环
6. CardNav 展开 `back.out` 轻度弹性

## 验收

1. 首屏奶油 + hero 分步 + 卡片错落入场  
2. 搜索过滤流畅  
3. 卡片交互有 spring、无霓虹  
4. 导航展开可用且略弹  
5. `/user` 跟色且功能正常  
