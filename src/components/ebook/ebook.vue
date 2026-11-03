<template>
  <div class="ebook-root">
    <div class="book">
      <svg class="doodle star" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15 9L22 10L17 15L18.5 22L12 18.5L5.5 22L7 15L2 10L9 9L12 2Z" />
      </svg>
      <svg class="doodle sparkle" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C12 6.6 17.4 12 24 12C17.4 12 12 17.4 12 24C12 17.4 6.6 12 0 12C6.6 12 12 6.6 12 0Z" />
      </svg>
      <svg class="doodle swirl" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C72.1 90 90 72.1 90 50C90 32.3 75.7 18 58 18C44.3 18 33 29.3 33 43C33 53.5 41.5 62 52 62C59.7 62 66 55.7 66 48"
        />
      </svg>

      <div class="book-float">
        <div class="book-lift">
          <div class="book-stage">
            <div class="book-spine" aria-hidden="true" />
            <div class="book-pages">
              <p class="page-text">翻开一页<br />读点什么</p>
            </div>
            <div class="book-cover">
              <div class="cover-face cover-front">
                <div class="cover-badge">BOOK</div>
                <div class="cover-title">
                  电子书<br />
                  <span>Designer: 小胖</span>
                </div>
                <div class="cover-ornament" aria-hidden="true" />
              </div>
              <div class="cover-face cover-back" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ebook-root {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: visible;
  cursor: pointer;
}

.book {
  --bg-color: #fdfbf7;
  --ink-color: #2c2c2c;
  --paper-line: #e6e0d4;
  --cover-color: #ff8ba7;
  --cover-deep: #f06d8f;
  --accent-coral: #ff8ba7;
  --accent-mint: #c6e377;
  --accent-lavender: #c0bbfe;
  --accent-yellow: #ffdf6c;

  font-size: 9px;
  position: relative;
  width: 17em;
  max-width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.2em 1.2em 1.6em;
  z-index: 1;
}

/* 浮动与悬停抬起分两层，避免 animation / transform 互相抢 */
.book-float {
  animation: floatBook 6s ease-in-out infinite;
}

.book-lift {
  transition: transform 0.35s ease;
}

.ebook-root:hover .book-lift {
  transform: translateY(-0.55em) rotate(1deg);
}

.book-stage {
  position: relative;
  width: 12.5em;
  height: 15.5em;
  perspective: 900px;
  perspective-origin: left center;
  z-index: 2;
}

.book-spine {
  position: absolute;
  left: -0.55em;
  top: 0.35em;
  width: 0.9em;
  height: calc(100% - 0.7em);
  background: linear-gradient(90deg, #d45f7d 0%, var(--cover-deep) 55%, #e884a0 100%);
  border: 0.2em solid var(--ink-color);
  border-radius: 0.35em 0.15em 0.15em 0.35em;
  box-shadow: 0.15em 0.25em 0 var(--ink-color);
  z-index: 0;
}

.book-pages {
  position: absolute;
  inset: 0.35em 0.2em 0.35em 0.35em;
  background:
    linear-gradient(var(--bg-color) 1.4em, transparent 1.4em) 0 0 / 100% 1.5em,
    linear-gradient(var(--paper-line) 0.08em, transparent 0.08em) 0 1.4em / 100% 1.5em var(--bg-color);
  border: 0.2em solid var(--ink-color);
  border-radius: 0.4em 1.2em 1.2em 0.4em / 0.4em 1em 1em 0.4em;
  box-shadow:
    0.35em 0.35em 0 var(--ink-color),
    inset 0 0 1em rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2em;
  z-index: 1;
}

.page-text {
  margin: 0;
  text-align: center;
  color: var(--ink-color);
  font-size: 1.15em;
  font-weight: 800;
  font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif;
  letter-spacing: 0.04em;
  line-height: 1.45;
  text-shadow: 0.06em 0.06em 0 var(--accent-lavender);
  opacity: 0;
  transform: translateX(0.4em);
  transition:
    opacity 0.25s ease,
    transform 0.35s ease;
}

.book-cover {
  position: absolute;
  inset: 0;
  z-index: 3;
  transform-origin: left center;
  transform-style: preserve-3d;
  transform: rotateY(0deg);
  /* 合上用平滑缓动，避免 back.out 过冲导致正反面闪一下 */
  transition: transform 0.5s ease-in-out;
  will-change: transform;
}

.cover-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border: 0.25em solid var(--ink-color);
  border-radius: 18px 22px 20px 24px / 22px 18px 24px 20px;
}

.cover-front {
  background:
    radial-gradient(circle at 18% 22%, var(--accent-yellow) 0 0.55em, transparent 0.58em),
    radial-gradient(circle at 82% 18%, var(--accent-mint) 0 0.45em, transparent 0.48em),
    linear-gradient(145deg, var(--cover-color) 0%, var(--cover-deep) 100%);
  box-shadow:
    0.5em 0.5em 0 var(--ink-color),
    inset 0 0 1.4em rgba(255, 255, 255, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.4em 1.1em 1.6em;
  gap: 0.9em;
  /* 微抬升，减轻与内页 z-fighting 闪烁 */
  transform: translateZ(1px);
}

.cover-back {
  background:
    repeating-linear-gradient(
      90deg,
      #f3e8d8 0,
      #f3e8d8 0.18em,
      #ebe0cf 0.18em,
      #ebe0cf 0.36em
    );
  transform: rotateY(180deg) translateZ(1px);
  box-shadow: inset 0.35em 0 0.6em rgba(0, 0, 0, 0.08);
}

.cover-badge {
  font-size: 0.75em;
  font-weight: 900;
  letter-spacing: 0.18em;
  color: var(--ink-color);
  background: var(--accent-mint);
  border: 0.15em solid var(--ink-color);
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  padding: 0.35em 0.9em;
  box-shadow: 0.18em 0.18em 0 var(--ink-color);
  font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif;
  animation: badgeFloat 3s ease-in-out infinite alternate;
}

.cover-title {
  text-align: center;
  color: var(--ink-color);
  font-size: 1.35em;
  font-weight: 900;
  font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif;
  letter-spacing: 0.05em;
  text-shadow: 0.08em 0.08em 0 var(--accent-lavender);
  line-height: 1.25;
}

.cover-title span {
  display: inline-block;
  font-size: 0.55em;
  color: var(--ink-color);
  background: var(--bg-color);
  padding: 0.4em 0.9em;
  border: 0.15em solid var(--ink-color);
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  margin-top: 0.75em;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  box-shadow: 0.18em 0.18em 0 var(--ink-color);
  text-shadow: none;
}

.cover-ornament {
  width: 3.2em;
  height: 0.35em;
  border-radius: 999px;
  background: var(--ink-color);
  opacity: 0.35;
  margin-top: 0.4em;
  box-shadow:
    0 0.7em 0 0 color-mix(in srgb, var(--ink-color) 25%, transparent),
    0 1.4em 0 0 color-mix(in srgb, var(--ink-color) 18%, transparent);
}

.ebook-root:hover .book-cover {
  transform: rotateY(-148deg);
}

.ebook-root:hover .page-text {
  opacity: 1;
  transform: translateX(0);
  transition-delay: 0.18s;
}

.ebook-root:hover .cover-title {
  animation: titleWobble 0.6s ease-in-out infinite alternate;
}

.doodle {
  position: absolute;
  fill: none;
  stroke: var(--ink-color);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  z-index: 0;
  pointer-events: none;
}

.doodle.star {
  width: 1.8em;
  height: 1.8em;
  top: 0.4em;
  right: 0.8em;
  fill: var(--accent-yellow);
  animation: pulseSparkle 3s infinite alternate ease-in-out;
}

.doodle.sparkle {
  width: 1.5em;
  height: 1.5em;
  top: 3.2em;
  left: 0.4em;
  fill: var(--accent-mint);
  animation: pulseSparkle 2.5s infinite alternate-reverse ease-in-out;
}

.doodle.swirl {
  width: 2.5em;
  height: 2.5em;
  bottom: 0.6em;
  right: 0.3em;
  stroke: var(--accent-lavender);
  stroke-width: 6;
  opacity: 0.6;
  animation: rotateDoodle 15s linear infinite;
}

@keyframes floatBook {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.4em);
  }
}

@keyframes pulseSparkle {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes rotateDoodle {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes badgeFloat {
  0% {
    transform: translateY(0) rotate(-1deg);
  }
  100% {
    transform: translateY(-0.2em) rotate(1deg);
  }
}

@keyframes titleWobble {
  0% {
    transform: rotate(-2deg) scale(1.02);
  }
  100% {
    transform: rotate(2deg) scale(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  .book-float,
  .doodle.star,
  .doodle.sparkle,
  .doodle.swirl,
  .cover-badge {
    animation: none;
  }

  .book-cover,
  .page-text,
  .book-lift {
    transition: none;
  }
}
</style>
