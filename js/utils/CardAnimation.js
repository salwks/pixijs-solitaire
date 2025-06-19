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

  // 카드 딜링 애니메이션 (순차적으로 배치)
  animateCardDeal(
    cards,
    positions,
    dealDelay = CONSTANTS.ANIMATION.DEAL_DELAY
  ) {
    return new Promise(async (resolve) => {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const position = positions[i];

        // 동시에 이동과 뒤집기
        const movePromise = this.animateCardMove(
          card,
          position.x,
          position.y,
          CONSTANTS.ANIMATION.DURATION
        );

        const flipPromise =
          position.faceUp !== undefined
            ? this.animateCardFlip(card, position.faceUp)
            : Promise.resolve();

        // 다음 카드까지 대기
        if (i < cards.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, dealDelay * 1000));
        }

        // 마지막 카드의 애니메이션 완료까지 대기
        if (i === cards.length - 1) {
          await Promise.all([movePromise, flipPromise]);
        }
      }
      resolve();
    });
  }

  // 자동 완성 애니메이션 (Foundation으로 순차 이동)
  animateAutoComplete(cards, foundationPositions) {
    return new Promise(async (resolve) => {
      for (const card of cards) {
        const targetPos = foundationPositions[card.suit];

        // 카드를 Foundation으로 이동
        await this.animateCardMove(
          card,
          targetPos.x,
          targetPos.y,
          CONSTANTS.ANIMATION.AUTO_MOVE_DURATION
        );

        // 약간의 지연
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      resolve();
    });
  }

  // 힌트 애니메이션 (카드 강조)
  animateHint(card, duration = 1000) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const originalY = card.container.y;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 위아래로 부드럽게 움직이는 효과
        const bounce = Math.sin(elapsed * 0.008) * 10;
        card.container.y = originalY + bounce;

        // 빛나는 효과
        const glow = Math.sin(elapsed * 0.01) * 0.3 + 0.7;
        card.container.tint = 0xffffff * glow + 0xffff00 * (1 - glow);

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          // 애니메이션 완료
          card.container.y = originalY;
          card.container.tint = 0xffffff;
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { card, animate });
      animate();
    });
  }

  // 드래그 시작 애니메이션 (카드 들어올리기)
  animateDragStart(cards) {
    const promises = cards.map((card) => {
      const targetY = card.container.y - 10; // 10픽셀 위로
      return this.animateCardMove(
        card,
        card.container.x,
        targetY,
        0.1 // 빠른 애니메이션
      );
    });

    return Promise.all(promises);
  }

  // 드래그 종료 애니메이션 (카드 내려놓기)
  animateDragEnd(cards, positions) {
    const promises = cards.map((card, index) => {
      const pos = positions[index];
      return this.animateCardMove(
        card,
        pos.x,
        pos.y,
        0.2 // 부드러운 착지
      );
    });

    return Promise.all(promises);
  }

  // 무효한 이동 애니메이션 (흔들기)
  animateInvalidMove(card) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const duration = 500;
      const originalX = card.container.x;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 좌우로 흔들기
        const shake = Math.sin(elapsed * 0.03) * 5 * (1 - progress);
        card.container.x = originalX + shake;

        // 빨간색 틴트
        const redTint = Math.sin(elapsed * 0.02) * 0.5 + 0.5;
        card.container.tint =
          0xffffff * (1 - redTint * 0.5) + 0xff0000 * redTint;

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          // 애니메이션 완료
          card.container.x = originalX;
          card.container.tint = 0xffffff;
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { card, animate });
      animate();
    });
  }

  // 카드 그룹 이동 애니메이션
  animateCardGroup(
    cards,
    targetPositions,
    duration = CONSTANTS.ANIMATION.DURATION
  ) {
    const promises = cards.map((card, index) => {
      const targetPos = targetPositions[index];
      return this.animateCardMove(card, targetPos.x, targetPos.y, duration);
    });

    return Promise.all(promises);
  }

  // 카드 페이드 인/아웃
  animateCardFade(card, fadeIn = true, duration = 0.3) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const startAlpha = fadeIn ? 0 : 1;
      const endAlpha = fadeIn ? 1 : 0;

      card.container.alpha = startAlpha;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        card.container.alpha = Utils.lerp(startAlpha, endAlpha, progress);

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          card.container.alpha = endAlpha;
          this.activeAnimations.delete(animId);
          resolve();
        }
      };

      this.activeAnimations.set(animId, { card, animate });
      animate();
    });
  }

  // 카드 스케일 애니메이션
  animateCardScale(card, targetScale, duration = 0.3) {
    return new Promise((resolve) => {
      const animId = ++this.animationId;
      const startTime = Date.now();
      const startScale = card.container.scale.x;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const easedProgress = Utils.easeInOut(progress);

        const currentScale = Utils.lerp(startScale, targetScale, easedProgress);
        card.container.scale.set(currentScale);

        if (progress < 1) {
          this.app.ticker.addOnce(animate);
        } else {
          card.container.scale.set(targetScale);
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
    this.activeAnimations.forEach(({ card, cards }) => {
      if (card) {
        card.container.scale.set(CONSTANTS.CARD_SCALE);
        card.container.tint = 0xffffff;
        card.container.alpha = 1.0;
        card.container.rotation = 0;
      }
      if (cards) {
        cards.forEach((c) => {
          c.container.scale.set(CONSTANTS.CARD_SCALE);
          c.container.tint = 0xffffff;
          c.container.alpha = 1.0;
          c.container.rotation = 0;
        });
      }
    });

    this.activeAnimations.clear();
    console.log("모든 카드 애니메이션이 중지되었습니다.");
  }

  // 특정 카드의 애니메이션 중지
  stopCardAnimation(card) {
    for (const [animId, animation] of this.activeAnimations.entries()) {
      if (
        animation.card === card ||
        (animation.cards && animation.cards.includes(card))
      ) {
        // 애니메이션 중지 및 정리
        card.container.scale.set(CONSTANTS.CARD_SCALE);
        card.container.tint = 0xffffff;
        card.container.alpha = 1.0;
        card.container.rotation = 0;

        this.activeAnimations.delete(animId);
        break;
      }
    }
  }

  // 진행 중인 애니메이션 수
  getActiveAnimationCount() {
    return this.activeAnimations.size;
  }

  // 특정 카드의 애니메이션이 진행 중인지 확인
  isCardAnimating(card) {
    for (const animation of this.activeAnimations.values()) {
      if (
        animation.card === card ||
        (animation.cards && animation.cards.includes(card))
      ) {
        return true;
      }
    }
    return false;
  }

  // 모든 애니메이션이 완료될 때까지 대기
  waitForAllAnimations() {
    return new Promise((resolve) => {
      const checkAnimations = () => {
        if (this.activeAnimations.size === 0) {
          resolve();
        } else {
          setTimeout(checkAnimations, 50);
        }
      };
      checkAnimations();
    });
  }

  // 메모리 정리
  destroy() {
    this.stopAllAnimations();
    this.activeAnimations.clear();
    console.log("카드 애니메이션 시스템이 정리되었습니다.");
  }
}
