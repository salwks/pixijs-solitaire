// PixiJS 솔리테어 - 카드 애니메이션 클래스

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "./Utils.js";

export class CardAnimation {
  constructor(app) {
    this.app = app;
    this.activeAnimations = new Map(); // 진행 중인 애니메이션들
    this.animationId = 0; // 애니메이션 고유 ID
  }

  // 카드 이동 애니메이션 (개선된 버전)
  animateCardMove(
    card,
    targetX,
    targetY,
    duration = CONSTANTS.ANIMATION.DURATION
  ) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startX = card.container.x;
      const startY = card.container.y;
      const startTime = Date.now();

      // 경로 계산 (포물선 움직임 추가)
      const distance = Math.sqrt(
        (targetX - startX) ** 2 + (targetY - startY) ** 2
      );
      const arcHeight = Math.min(distance * 0.1, 30); // 포물선 높이

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        // 더 자연스러운 이징 함수
        const easedProgress = this.easeOutBounce(progress);

        // 현재 위치 계산 (포물선 경로)
        const currentX = Utils.lerp(startX, targetX, easedProgress);
        const currentY = Utils.lerp(startY, targetY, easedProgress);

        // 포물선 효과 (중간에 살짝 위로)
        const arcProgress = Math.sin(progress * Math.PI);
        const arcOffset = arcHeight * arcProgress;

        card.container.x = currentX;
        card.container.y = currentY - arcOffset;

        // 이동 중 약간의 회전 효과
        card.container.rotation = Math.sin(progress * Math.PI * 2) * 0.05;

        if (progress < 1) {
          // 애니메이션 계속
          this.app.ticker.addOnce(animate);
        } else {
          // 애니메이션 완료
          card.container.x = targetX;
          card.container.y = targetY;
          card.container.rotation = 0;
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { card, animate });
      animate();
    });
  }

  // 바운스 이징 함수
  easeOutBounce(t) {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  // 카드 뒤집기 애니메이션 (3D 효과)
  animateCardFlip(card, faceUp, duration = CONSTANTS.ANIMATION.FLIP_DURATION) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const halfDuration = duration * 500; // 절반 시간을 밀리초로

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        if (elapsed < halfDuration) {
          // 첫 번째 절반: 카드가 얇아짐 (3D 회전 효과)
          const scaleProgress = elapsed / halfDuration;
          const scaleX = Utils.lerp(CONSTANTS.CARD_SCALE, 0, scaleProgress);
          const scaleY = Utils.lerp(
            CONSTANTS.CARD_SCALE,
            CONSTANTS.CARD_SCALE * 1.1,
            scaleProgress * 0.5
          );

          card.container.scale.x = scaleX;
          card.container.scale.y = scaleY;
        } else {
          // 두 번째 절반: 카드 앞/뒤면 전환 후 다시 커짐
          if (elapsed >= halfDuration && card.faceUp !== faceUp) {
            card.flip(faceUp);

            // 뒤집기 순간 파티클 효과
            this.createFlipSparkles(card);
          }

          const scaleProgress = (elapsed - halfDuration) / halfDuration;
          const scaleX = Utils.lerp(0, CONSTANTS.CARD_SCALE, scaleProgress);
          const scaleY = Utils.lerp(
            CONSTANTS.CARD_SCALE * 1.1,
            CONSTANTS.CARD_SCALE,
            scaleProgress * 0.5
          );

          card.container.scale.x = scaleX;
          card.container.scale.y = scaleY;
        }

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          // 애니메이션 완료
          card.container.scale.set(CONSTANTS.CARD_SCALE);
          card.flip(faceUp);
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { card, animate });
      animate();
    });
  }

  // 뒤집기 시 반짝이는 효과
  createFlipSparkles(card) {
    if (!card.container.parent) return;

    const sparkles = new PIXI.Container();
    card.container.parent.addChild(sparkles);

    // 여러 개의 작은 별 생성
    for (let i = 0; i < 8; i++) {
      const sparkle = new PIXI.Graphics();

      // 별 모양 그리기 (star 메서드 대신 수동으로)
      sparkle.moveTo(0, -4);
      sparkle.lineTo(1, -1);
      sparkle.lineTo(4, 0);
      sparkle.lineTo(1, 1);
      sparkle.lineTo(0, 4);
      sparkle.lineTo(-1, 1);
      sparkle.lineTo(-4, 0);
      sparkle.lineTo(-1, -1);
      sparkle.lineTo(0, -4);
      sparkle.fill({ color: 0xffd700 });

      const angle = (i / 8) * Math.PI * 2;
      const distance = 20 + Math.random() * 15;

      sparkle.x = card.container.x + Math.cos(angle) * distance;
      sparkle.y = card.container.y + Math.sin(angle) * distance;
      sparkle.scale.set(0.5 + Math.random() * 0.5);

      sparkles.addChild(sparkle);

      // 반짝이 애니메이션
      const duration = 500 + Math.random() * 300;
      const startTime = Date.now();

      const animateSparkle = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
          sparkle.alpha = 1 - progress;
          sparkle.scale.set((0.5 + Math.random() * 0.5) * (1 - progress * 0.5));
          sparkle.rotation += 0.1;
          this.app.ticker.addOnce(animateSparkle);
        } else {
          if (sparkles.parent) {
            sparkles.removeChild(sparkle);
            if (sparkles.children.length === 0) {
              sparkles.parent.removeChild(sparkles);
              sparkles.destroy();
            }
          }
        }
      };

      animateSparkle();
    }
  }

  // 힌트 애니메이션
  animateHint(card, duration = 1000) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const originalScale = card.container.scale.x;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 깜빡이는 효과
        const blink = Math.sin(progress * Math.PI * 8) * 0.3 + 0.7;
        card.container.alpha = blink;

        // 크기 변화
        const scale =
          originalScale * (1 + Math.sin(progress * Math.PI * 4) * 0.1);
        card.container.scale.set(scale);

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          // 원래 상태로 복구
          card.container.alpha = 1;
          card.container.scale.set(originalScale);
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { card, animate });
      animate();
    });
  }

  // 잘못된 이동 애니메이션
  animateInvalidMove(card) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const originalX = card.container.x;
      const originalY = card.container.y;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 300, 1);

        // 흔들리는 효과
        const shake = Math.sin(progress * Math.PI * 10) * 5 * (1 - progress);
        card.container.x = originalX + shake;

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          // 원래 위치로 복구
          card.container.x = originalX;
          card.container.y = originalY;
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { card, animate });
      animate();
    });
  }

  // 모든 애니메이션 중지
  stopAllAnimations() {
    this.activeAnimations.forEach((animation) => {
      if (animation.card && animation.card.container) {
        animation.card.container.alpha = 1;
        animation.card.container.scale.set(CONSTANTS.CARD_SCALE);
        animation.card.container.rotation = 0;
      }
    });
    this.activeAnimations.clear();
  }

  // 특정 카드의 애니메이션 중지
  stopCardAnimation(card) {
    this.activeAnimations.forEach((animation, id) => {
      if (animation.card === card) {
        if (card.container) {
          card.container.alpha = 1;
          card.container.scale.set(CONSTANTS.CARD_SCALE);
          card.container.rotation = 0;
        }
        this.activeAnimations.delete(id);
      }
    });
  }

  // 활성 애니메이션 개수 반환
  getActiveAnimationCount() {
    return this.activeAnimations.size;
  }

  // 카드가 애니메이션 중인지 확인
  isCardAnimating(card) {
    for (const animation of this.activeAnimations.values()) {
      if (animation.card === card) {
        return true;
      }
    }
    return false;
  }

  // 모든 애니메이션 완료 대기
  waitForAllAnimations() {
    return new Promise((resolve) => {
      const checkAnimations = () => {
        if (this.activeAnimations.size === 0) {
          resolve();
        } else {
          this.app.ticker.addOnce(checkAnimations);
        }
      };
      checkAnimations();
    });
  }

  // 리소스 정리
  destroy() {
    this.stopAllAnimations();
    this.activeAnimations.clear();
  }
}
