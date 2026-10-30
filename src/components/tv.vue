<template>
  <div class="tv-root">
    <div class="tv">
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

      <div class="tv-set">
        <div class="tv-antenna" aria-hidden="true">
          <span class="tv-antenna-arm tv-antenna-arm--left" />
          <span class="tv-antenna-arm tv-antenna-arm--right" />
          <span class="tv-antenna-base" />
        </div>

        <div class="tv-body">
          <div class="tv-screen">
            <div class="tv-program">
              <span class="tv-program-emoji" aria-hidden="true">▶</span>
              <p class="tv-program-text">小电视<br /><span>Designer: 小胖</span></p>
            </div>
            <div class="tv-static" aria-hidden="true">
              <svg class="tv-static-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                  <filter id="tvNoSignalNoise" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.95"
                      numOctaves="4"
                      stitchTiles="stitch"
                      result="noise"
                    >
                      <animate
                        attributeName="baseFrequency"
                        values="0.9;1.15;0.85;1.05;0.9"
                        dur="0.35s"
                        repeatCount="indefinite"
                      />
                    </feTurbulence>
                    <feColorMatrix
                      in="noise"
                      type="matrix"
                      values="0 0 0 0 0.55
                              0 0 0 0 0.55
                              0 0 0 0 0.55
                              0 0 0 1 0"
                    />
                    <feComponentTransfer>
                      <feFuncR type="discrete" tableValues="0 0.35 0.7 1" />
                      <feFuncG type="discrete" tableValues="0 0.35 0.7 1" />
                      <feFuncB type="discrete" tableValues="0 0.35 0.7 1" />
                    </feComponentTransfer>
                  </filter>
                </defs>
                <rect width="100%" height="100%" filter="url(#tvNoSignalNoise)" />
              </svg>
              <span class="tv-static-flicker" />
            </div>
            <div class="tv-glass" aria-hidden="true" />
          </div>

          <div class="tv-panel">
            <span class="tv-knob" />
            <span class="tv-knob tv-knob--small" />
            <span class="tv-speaker" aria-hidden="true" />
          </div>
        </div>

        <div class="tv-feet" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tv-root {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: visible;
  cursor: pointer;
}

.tv {
  --bg-color: #fdfbf7;
  --ink-color: #2c2c2c;
  --body-color: #c0bbfe;
  --body-deep: #a89ae8;
  --screen-off: #2a2a2a;
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
  padding: 1.6em 1.2em 1.2em;
  z-index: 1;
  animation: floatTv 6s ease-in-out infinite;
}

.tv-set {
  position: relative;
  width: 13.5em;
  z-index: 2;
}

.tv-antenna {
  position: relative;
  height: 3.2em;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: -0.15em;
  z-index: 3;
}

.tv-antenna-arm {
  position: absolute;
  bottom: 0.55em;
  width: 0.22em;
  height: 2.8em;
  background: var(--ink-color);
  border-radius: 999px;
  transform-origin: bottom center;
}

.tv-antenna-arm::after {
  content: "";
  position: absolute;
  top: -0.35em;
  left: 50%;
  width: 0.7em;
  height: 0.7em;
  border: 0.18em solid var(--ink-color);
  border-radius: 50%;
  background: var(--accent-yellow);
  transform: translateX(-50%);
}

.tv-antenna-arm--left {
  transform: translateX(-1.1em) rotate(-28deg);
}

.tv-antenna-arm--right {
  transform: translateX(1.1em) rotate(28deg);
}

.tv-antenna-base {
  width: 1.4em;
  height: 0.7em;
  background: var(--ink-color);
  border-radius: 0.4em 0.4em 0.1em 0.1em;
  z-index: 1;
}

.tv-body {
  position: relative;
  background: linear-gradient(160deg, var(--body-color) 0%, var(--body-deep) 100%);
  border: 0.25em solid var(--ink-color);
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  box-shadow:
    0.5em 0.5em 0 var(--ink-color),
    inset 0 0 1.2em rgba(255, 255, 255, 0.22);
  padding: 1em 0.9em 0.85em;
  display: flex;
  flex-direction: column;
  gap: 0.7em;
  transition:
    transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow 0.4s ease,
    border-radius 0.4s ease;
}

.tv-screen {
  position: relative;
  height: 8.2em;
  border: 0.22em solid var(--ink-color);
  border-radius: 1.1em 1.4em 1.2em 1.3em / 1.3em 1.1em 1.4em 1.2em;
  background: var(--screen-off);
  overflow: hidden;
  box-shadow: inset 0 0 1.2em rgba(0, 0, 0, 0.35);
}

.tv-program {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35em;
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 223, 108, 0.55), transparent 42%),
    linear-gradient(160deg, #7ec8ff 0%, #c0bbfe 48%, #ff8ba7 100%);
  z-index: 1;
}

.tv-static {
  position: absolute;
  inset: 0;
  z-index: 2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
  background: #111;
  overflow: hidden;
}

.tv-static-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.tv-static-flicker {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);
  mix-blend-mode: soft-light;
  animation: staticFlicker 0.18s steps(2) infinite;
  pointer-events: none;
}

.tv-program-emoji {
  width: 2.4em;
  height: 2.4em;
  display: grid;
  place-items: center;
  border: 0.18em solid var(--ink-color);
  border-radius: 50% 40% 60% 40% / 40% 60% 40% 50%;
  background: var(--bg-color);
  color: var(--ink-color);
  font-size: 1.1em;
  font-weight: 900;
  box-shadow: 0.18em 0.18em 0 var(--ink-color);
  padding-left: 0.15em;
}

.tv-program-text {
  margin: 0;
  text-align: center;
  color: var(--ink-color);
  font-size: 1.2em;
  font-weight: 900;
  font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif;
  letter-spacing: 0.04em;
  line-height: 1.3;
  text-shadow: 0.06em 0.06em 0 var(--bg-color);
}

.tv-program-text span {
  display: inline-block;
  font-size: 0.55em;
  background: var(--accent-mint);
  border: 0.15em solid var(--ink-color);
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  padding: 0.35em 0.85em;
  margin-top: 0.45em;
  box-shadow: 0.15em 0.15em 0 var(--ink-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: none;
}

.tv-glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    125deg,
    rgba(255, 255, 255, 0.28) 0%,
    transparent 38%,
    transparent 62%,
    rgba(255, 255, 255, 0.08) 100%
  );
  z-index: 3;
}

.tv-panel {
  display: flex;
  align-items: center;
  gap: 0.55em;
  padding: 0 0.2em;
}

.tv-knob {
  width: 1.5em;
  height: 1.5em;
  border: 0.18em solid var(--ink-color);
  border-radius: 50% 45% 55% 45% / 45% 55% 45% 50%;
  background: var(--accent-coral);
  box-shadow: 0.15em 0.15em 0 var(--ink-color);
  transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tv-knob--small {
  width: 1.15em;
  height: 1.15em;
  background: var(--accent-yellow);
}

.tv-speaker {
  margin-left: auto;
  width: 4.2em;
  height: 1.5em;
  border: 0.18em solid var(--ink-color);
  border-radius: 0.5em;
  background:
    repeating-linear-gradient(
      90deg,
      var(--bg-color) 0,
      var(--bg-color) 0.22em,
      var(--ink-color) 0.22em,
      var(--ink-color) 0.32em
    );
  box-shadow: 0.12em 0.12em 0 var(--ink-color);
}

.tv-feet {
  display: flex;
  justify-content: space-between;
  padding: 0 1.6em;
  margin-top: -0.15em;
}

.tv-feet span {
  width: 1.5em;
  height: 0.85em;
  background: var(--ink-color);
  border-radius: 0 0 0.45em 0.45em;
  transform: skewX(-8deg);
}

.tv-feet span:last-child {
  transform: skewX(8deg);
}

.tv-root:hover .tv {
  animation-play-state: paused;
  transform: translateY(-0.55em) rotate(1deg);
}

.tv-root:hover .tv-body {
  border-radius: 15px 255px 15px 225px / 255px 15px 225px 15px;
  box-shadow:
    0.7em 0.9em 0 var(--ink-color),
    inset 0 0 1.2em rgba(255, 255, 255, 0.22);
}

.tv-root:hover .tv-program {
  opacity: 0;
  transform: scale(1.02);
}

.tv-root:hover .tv-static {
  opacity: 1;
}

.tv-root:hover .tv-antenna-arm--left {
  animation: antennaWiggleLeft 0.7s ease-in-out infinite alternate;
}

.tv-root:hover .tv-antenna-arm--right {
  animation: antennaWiggleRight 0.7s ease-in-out infinite alternate;
}

.tv-root:hover .tv-knob {
  transform: rotate(45deg);
}

.tv-root:hover .tv-knob--small {
  transform: rotate(-55deg);
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
  top: 0.2em;
  right: 0.6em;
  fill: var(--accent-yellow);
  animation: pulseSparkle 3s infinite alternate ease-in-out;
}

.doodle.sparkle {
  width: 1.5em;
  height: 1.5em;
  top: 3.6em;
  left: 0.3em;
  fill: var(--accent-mint);
  animation: pulseSparkle 2.5s infinite alternate-reverse ease-in-out;
}

.doodle.swirl {
  width: 2.5em;
  height: 2.5em;
  bottom: 0.4em;
  right: 0.2em;
  stroke: var(--accent-coral);
  stroke-width: 6;
  opacity: 0.6;
  animation: rotateDoodle 15s linear infinite;
}

@keyframes floatTv {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.4em);
  }
}

@keyframes staticFlicker {
  0% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.45;
  }
  100% {
    opacity: 0.2;
  }
}

@keyframes antennaWiggleLeft {
  0% {
    transform: translateX(-1.1em) rotate(-28deg);
  }
  100% {
    transform: translateX(-1.1em) rotate(-38deg);
  }
}

@keyframes antennaWiggleRight {
  0% {
    transform: translateX(1.1em) rotate(28deg);
  }
  100% {
    transform: translateX(1.1em) rotate(38deg);
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

@keyframes titleWobble {
  0% {
    transform: rotate(-2deg) scale(1.02);
  }
  100% {
    transform: rotate(2deg) scale(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tv,
  .doodle.star,
  .doodle.sparkle,
  .doodle.swirl,
  .tv-static-flicker {
    animation: none;
  }

  .tv-program,
  .tv-static,
  .tv-knob,
  .tv-body {
    transition: none;
  }

  .tv-root:hover .tv-antenna-arm--left,
  .tv-root:hover .tv-antenna-arm--right {
    animation: none;
  }
}
</style>
