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

  // 게임 시작 애니메이션
  animateGameStart() {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(26, 107, 84, 0.9) 0%, rgba(15, 76, 58, 0.95) 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 500;
                color: white;
                font-size: 48px;
                font-weight: bold;
                text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
            `;
      overlay.textContent = "게임 시작!";
      document.body.appendChild(overlay);

      // 페이드 아웃 애니메이션
      let opacity = 1;
      const fadeOut = () => {
        opacity -= 0.05;
        overlay.style.opacity = opacity;

        if (opacity > 0) {
          setTimeout(fadeOut, 50);
        } else {
          document.body.removeChild(overlay);
          resolve();
        }
      };

      setTimeout(fadeOut, 1000);
    });
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
          // 숫자 카운트 업
          const currentScore = Math.floor(oldScore + scoreDiff * progress);
          scoreElement.textContent = currentScore.toLocaleString();

          // 팝업 애니메이션
          scorePopup.style.top = `${-20 - progress * 30}px`;
          scorePopup.style.opacity = 1 - progress;

          // 점수 요소 펄스
          const pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
          scoreElement.style.transform = `scale(${pulse})`;

          requestAnimationFrame(animate);
        } else {
          scoreElement.textContent = newScore.toLocaleString();
          scoreElement.style.transform = "scale(1)";
          scorePopup.remove();
          resolve();
        }
      };

      animate();
    });
  }

  // 버튼 클릭 애니메이션
  animateButtonClick(button) {
    const originalTransform = button.style.transform;

    button.style.transform = "scale(0.95)";
    button.style.transition = "transform 0.1s ease";

    setTimeout(() => {
      button.style.transform = originalTransform;
      setTimeout(() => {
        button.style.transition = "";
      }, 100);
    }, 100);
  }

  // 알림 메시지 애니메이션
  showNotification(message, type = "info", duration = 3000) {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

    // 타입별 색상 설정
    switch (type) {
      case "success":
        notification.style.background =
          "linear-gradient(135deg, #27ae60, #2ecc71)";
        break;
      case "warning":
        notification.style.background =
          "linear-gradient(135deg, #f39c12, #e67e22)";
        break;
      case "error":
        notification.style.background =
          "linear-gradient(135deg, #e74c3c, #c0392b)";
        break;
      default:
        notification.style.background =
          "linear-gradient(135deg, #3498db, #2980b9)";
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // 슬라이드 인 애니메이션
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // 자동 제거
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, duration);
  }

  // 로딩 스피너 애니메이션
  showLoadingSpinner(message = "로딩 중...") {
    const overlay = document.createElement("div");
    overlay.id = "loadingSpinner";
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
        `;

    overlay.innerHTML = `
            <div style="
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <div style="font-size: 18px; font-weight: bold;">${message}</div>
        `;

    document.body.appendChild(overlay);
    return overlay;
  }

  hideLoadingSpinner() {
    const spinner = document.getElementById("loadingSpinner");
    if (spinner) {
      document.body.removeChild(spinner);
    }
  }

  // HSL을 HEX로 변환
  hslToHex(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;

    let r, g, b;

    if (h < 1 / 6) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 2 / 6) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 3 / 6) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 4 / 6) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 5 / 6) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return (r << 16) | (g << 8) | b;
  }

  // 랜덤 색상 생성
  getRandomColor() {
    const colors = [
      0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b, 0xeb4d4b, 0x6c5ce7,
      0xa29bfe,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 페이드 인/아웃 효과
  fadeElement(element, fadeIn = true, duration = 300) {
    return new Promise((resolve) => {
      const startOpacity = fadeIn ? 0 : 1;
      const endOpacity = fadeIn ? 1 : 0;
      const startTime = Date.now();

      element.style.opacity = startOpacity;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        element.style.opacity = Utils.lerp(startOpacity, endOpacity, progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.opacity = endOpacity;
          resolve();
        }
      };

      animate();
    });
  }

  // 모든 UI 애니메이션 중지
  stopAllAnimations() {
    this.activeAnimations.clear();

    // 모든 알림 제거
    document
      .querySelectorAll('[style*="position: fixed"]')
      .forEach((element) => {
        if (element.id !== "gameContainer" && element.id !== "pauseOverlay") {
          element.remove();
        }
      });

    console.log("모든 UI 애니메이션이 중지되었습니다.");
  }

  // 메모리 정리
  destroy() {
    this.stopAllAnimations();
    this.hideLoadingSpinner();
    console.log("UI 애니메이션 시스템이 정리되었습니다.");
  }
}
