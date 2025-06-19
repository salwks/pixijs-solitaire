// PixiJS 솔리테어 - 유틸리티 함수들

import { CONSTANTS } from "../core/Constants.js";

export class Utils {
  // 배열 셔플 (Fisher-Yates 알고리즘)
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 게임 시간 포맷팅 (초 -> MM:SS)
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  // 점수 계산
  static calculateScore(moves, time, foundationCards) {
    let score = 0;

    // Foundation에 올린 카드당 점수
    score += foundationCards * 10;

    // 시간 보너스 (빠를수록 높은 점수)
    const timeBonus = Math.max(0, 500 - Math.floor(time / 10));
    score += timeBonus;

    // 움직임 패널티 (적을수록 좋음)
    const movePenalty = Math.floor(moves / 2);
    score = Math.max(0, score - movePenalty);

    return score;
  }

  // 선형 보간
  static lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // 카드 더미 위치 계산
  static getStackPosition(stackType, index = 0, scale = 1) {
    // 현재 화면 크기 사용
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * scale;
    const cardHeight = CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * scale;

    const horizontalGap = 10 * scale;
    const margin = CONSTANTS.MARGIN * scale;

    switch (stackType) {
      case "stock":
        // 좌하단에 배치
        return {
          x: margin,
          y: screenHeight - margin - cardHeight,
        };

      case "waste":
        // Stock 옆에 배치
        return {
          x: margin + cardWidth + horizontalGap,
          y: screenHeight - margin - cardHeight,
        };

      case "foundation":
        // 우하단에 4개 배치
        const foundationStartX =
          screenWidth - margin - (cardWidth + horizontalGap) * 4;
        return {
          x: foundationStartX + index * (cardWidth + horizontalGap),
          y: screenHeight - margin - cardHeight,
        };

      case "tableau":
        // 중앙 상단에 7개 배치
        const tableauTotalWidth = cardWidth * 7 + horizontalGap * 6;
        const tableauStartX = (screenWidth - tableauTotalWidth) / 2;
        const tableauStartY = margin;
        return {
          x: tableauStartX + index * (cardWidth + horizontalGap),
          y: tableauStartY,
        };

      default:
        return { x: 0, y: 0 };
    }
  }
}
