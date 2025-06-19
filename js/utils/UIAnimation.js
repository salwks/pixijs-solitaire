// PixiJS 솔리테어 - UI 애니메이션 클래스

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "./Utils.js";

export class UIAnimation {
  constructor(app) {
    this.app = app;
    this.activeAnimations = new Map();
    this.animationId = 0;
  }

  // 승리 애니메이션 (화려한 버전)
  animateVictory(foundationStacks) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const duration = 3000; // 3초

      // 모든 Foundation 카드들에 대해 화려한 효과
      const allCards = foundationStacks.flatMap((stack) => stack.cards);

      // 승리 폭죽 효과
      this.createVictoryFireworks();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 무지개 색상 순환
        const hue = (elapsed * 0.002) % 1;
        const rainbowColor = this.hslToHex(hue, 0.8, 0.6);

        allCards.forEach((card, index) => {
          // 각 카드마다 다른 타이밍과 효과
          const cardOffset = index * 50;
          const cardTime = elapsed + cardOffset;

          // 춤추는 효과
          const dance = Math.sin(cardTime * 0.01) * 10;
          const bounce = Math.abs(Math.sin(cardTime * 0.008)) * 8;

          card.container.x += Math.sin(cardTime * 0.005) * 0.5;
          card.container.y += Math.cos(cardTime * 0.007) * 0.3 - bounce;

          // 크기 변화 (펄스 효과)
          const pulse = 1 + Math.sin(cardTime * 0.015) * 0.15;
          card.container.scale.set(CONSTANTS.CARD_SCALE * pulse);

          // 무지개 색상 효과
          card.container.tint = rainbowColor;

          // 회전 효과
          card.container.rotation = Math.sin(cardTime * 0.003) * 0.1;
        });

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          // 애니메이션 완료 - 원래 상태로 복구
          allCards.forEach((card) => {
            card.container.scale.set(CONSTANTS.CARD_SCALE);
            card.container.tint = 0xffffff;
            card.container.rotation = 0;
          });
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { cards: allCards, animate });
      animate();
    });
  }

  // 승리 폭죽 효과
  createVictoryFireworks() {
    const container = this.app.stage;

    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const firework = new PIXI.Container();
        container.addChild(firework);

        const x = Math.random() * CONSTANTS.GAME_WIDTH;
        const y = Math.random() * CONSTANTS.GAME_HEIGHT * 0.7;

        // 폭죽 파티클들
        for (let j = 0; j < 12; j++) {
          const particle = new PIXI.Graphics();
          particle.circle(0, 0, 2 + Math.random() * 3);
          particle.fill({ color: this.getRandomColor() });

          const angle = (j / 12) * Math.PI * 2;
          const speed = 50 + Math.random() * 100;

          particle.x = x;
          particle.y = y;

          firework.addChild(particle);

          // 파티클 애니메이션
          const duration = 1000 + Math.random() * 500;
          const startTime = Date.now();

          const animateParticle = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
              particle.x += Math.cos(angle) * speed * 0.016;
              particle.y += Math.sin(angle) * speed * 0.016 + progress * 20; // 중력
              particle.alpha = 1 - progress;
              particle.scale.set(1 - progress * 0.5);
              this.app.ticker.addOnce(animateParticle);
            } else {
              firework.removeChild(particle);
              if (firework.children.length === 0) {
                container.removeChild(firework);
              }
            }
          };

          animateParticle();
        }
      }, i * 200);
    }
  }

  // 점수 상승 애니메이션
  animateScoreIncrease(scoreElement, oldScore, newScore) {
    return new Promise((resolve) => {
      const duration = 1000;
      const startTime = Date.now();
      const scoreDiff = newScore - oldScore;

      // 점수 증가 표시
      const scorePopup = document.createElement("div");
      scorePopup.style.cssText = `
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                color: #ffd700;
                font-weight: bold;
                font-size: 18px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                pointer-events: none;
                z-index: 200;
            `;
      scorePopup.textContent = `+${scoreDiff}`;
      scoreElement.parentElement.style.position = "relative";
      scoreElement.parentElement.appendChild(scorePopup);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
          // 위로 올라가면서 페이드 아웃
          scorePopup.style.top = `${-20 - progress * 30}px`;
          scorePopup.style.opacity = 1 - progress;
          this.app.ticker.addOnce(animate);
        } else {
          // 애니메이션 완료
          if (scorePopup.parentElement) {
            scorePopup.parentElement.removeChild(scorePopup);
          }
          resolve();
        }
      };

      animate();
    });
  }

  // HSL을 Hex로 변환
  hslToHex(h, s, l) {
    const hue = h * 360;
    const saturation = s * 100;
    const lightness = l * 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = l - c / 2;

    let r, g, b;
    if (hue < 60) {
      [r, g, b] = [c, x, 0];
    } else if (hue < 120) {
      [r, g, b] = [x, c, 0];
    } else if (hue < 180) {
      [r, g, b] = [0, c, x];
    } else if (hue < 240) {
      [r, g, b] = [0, x, c];
    } else if (hue < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    const toHex = (n) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return parseInt(toHex(r) + toHex(g) + toHex(b), 16);
  }

  // 랜덤 색상 생성
  getRandomColor() {
    const colors = [
      0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800,
      0x8800ff, 0x00ff88, 0xff0088, 0x88ff00, 0x0088ff,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 모든 애니메이션 중지
  stopAllAnimations() {
    this.activeAnimations.forEach((animation) => {
      if (animation.cards) {
        animation.cards.forEach((card) => {
          if (card.container) {
            card.container.scale.set(CONSTANTS.CARD_SCALE);
            card.container.tint = 0xffffff;
            card.container.rotation = 0;
          }
        });
      }
    });
    this.activeAnimations.clear();
  }

  // 리소스 정리
  destroy() {
    this.stopAllAnimations();
    this.activeAnimations.clear();
  }
}
