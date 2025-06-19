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

  // 52장 카드 덱 생성
  static createDeck() {
    const deck = [];
    CONSTANTS.SUITS.forEach((suit) => {
      CONSTANTS.RANKS.forEach((rank) => {
        deck.push({ suit, rank });
      });
    });
    return deck;
  }

  // 카드가 다른 카드 위에 올릴 수 있는지 확인 (Tableau 규칙)
  static canPlaceOnTableau(card, targetCard) {
    if (!targetCard) return card.getValue() === 13; // 빈 공간에는 K만

    // 색상이 반대이고 값이 1 작아야 함
    const isDifferentColor = card.isRed() !== targetCard.isRed();
    const isOneLess = card.getValue() === targetCard.getValue() - 1;

    return isDifferentColor && isOneLess;
  }

  // Foundation에 카드를 올릴 수 있는지 확인
  static canPlaceOnFoundation(card, foundation) {
    if (foundation.length === 0) {
      return card.getValue() === 1; // 빈 Foundation에는 A만
    }

    const topCard = foundation[foundation.length - 1];
    const isSameSuit = card.suit === topCard.suit;
    const isOneMore = card.getValue() === topCard.getValue() + 1;

    return isSameSuit && isOneMore;
  }

  // 두 점 사이의 거리 계산
  static distance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 점이 사각형 안에 있는지 확인
  static isPointInRect(point, rect) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
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

  // 깊은 복사
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // 배열에서 랜덤 요소 선택
  static randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // 숫자를 범위 내로 제한
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // 선형 보간
  static lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // 이지징 함수 (부드러운 애니메이션)
  static easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // 카드 더미 위치 계산
  static getStackPosition(stackType, index = 0) {
    switch (stackType) {
      case "stock":
        return {
          x: CONSTANTS.MARGIN,
          y: CONSTANTS.MARGIN,
        };

      case "waste":
        return {
          x:
            CONSTANTS.MARGIN + CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE + 20,
          y: CONSTANTS.MARGIN,
        };

      case "foundation":
        return {
          x:
            CONSTANTS.FOUNDATION_START_X +
            index * (CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE + 10),
          y: CONSTANTS.MARGIN,
        };

      case "tableau":
        return {
          x:
            CONSTANTS.MARGIN +
            index * (CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE + 10),
          y: CONSTANTS.TABLEAU_START_Y,
        };

      default:
        return { x: 0, y: 0 };
    }
  }

  // 디버그 정보 출력
  static debug(message, data = null) {
    if (window.DEBUG_MODE) {
      console.log(`[DEBUG] ${message}`, data || "");
    }
  }
}
