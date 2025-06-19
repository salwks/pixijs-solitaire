// PixiJS 솔리테어 - 카드 스택 클래스 (수정됨)

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "../utils/Utils.js";

export class CardStack {
  constructor(type, index = 0) {
    this.type = type; // 'stock', 'waste', 'foundation', 'tableau'
    this.index = index; // foundation이나 tableau의 인덱스
    this.cards = [];
    this.container = new PIXI.Container();
    this.dropZoneAnimation = null;

    // 스택 위치
    this.position = Utils.getStackPosition(type, index);
    this.container.x = this.position.x;
    this.container.y = this.position.y;

    // 드롭존 설정
    this.setupDropZone();
  }

  setupDropZone() {
    // 드롭존 영역 (투명한 사각형)
    this.dropZone = new PIXI.Graphics();
    this.dropZone.rect(
      0,
      0,
      CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE,
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE
    );
    this.dropZone.fill({ color: 0x000000, alpha: 0 }); // 투명

    this.dropZone.interactive = true;
    this.dropZone.on("pointerover", this.onDropZoneEnter.bind(this));
    this.dropZone.on("pointerout", this.onDropZoneLeave.bind(this));

    this.container.addChild(this.dropZone);
  }

  // 카드 추가
  addCard(card) {
    this.cards.push(card);
    this.container.addChild(card.container);
    card.currentStack = this;
    card.stackIndex = this.cards.length - 1;

    this.updateCardPosition(card);

    console.log(`카드 ${card.toString()}가 ${this.type} 스택에 추가됨`);
  }

  // 카드 제거
  removeCard(card) {
    const index = this.cards.indexOf(card);
    if (index !== -1) {
      this.cards.splice(index, 1);
      this.container.removeChild(card.container);
      card.currentStack = null;
      card.stackIndex = -1;

      // 남은 카드들의 인덱스 업데이트
      this.updateAllCardPositions();

      console.log(`카드 ${card.toString()}가 ${this.type} 스택에서 제거됨`);
    }
  }

  // 맨 위 카드 가져오기
  getTopCard() {
    return this.cards.length > 0 ? this.cards[this.cards.length - 1] : null;
  }

  // 카드 개수
  getCardCount() {
    return this.cards.length;
  }

  // 스택이 비어있는지 확인
  isEmpty() {
    return this.cards.length === 0;
  }

  // 특정 인덱스의 카드 위치 계산 - 수정된 부분
  getCardPosition(cardIndex) {
    let x = 0;
    let y = 0;

    switch (this.type) {
      case "stock":
      case "waste":
      case "foundation":
        // 이들은 같은 위치에 겹쳐서 배치
        x = 0;
        y = 0;
        break;

      case "tableau":
        // Tableau는 계단식으로 배치
        x = 0;
        y = cardIndex * CONSTANTS.STACK_OFFSET_Y;
        break;
    }

    return { x, y };
  }

  // 카드 위치 업데이트
  updateCardPosition(card) {
    const cardIndex = this.cards.indexOf(card);
    if (cardIndex === -1) return;

    const position = this.getCardPosition(cardIndex);
    card.setPosition(position.x, position.y);
    card.stackIndex = cardIndex;
  }

  // 모든 카드 위치 업데이트
  updateAllCardPositions() {
    this.cards.forEach((card, index) => {
      card.stackIndex = index;
      this.updateCardPosition(card);
    });
  }

  // 카드가 이 스택에 올 수 있는지 확인 - 수정된 부분
  canAcceptCard(card) {
    switch (this.type) {
      case "foundation":
        return this.canPlaceOnFoundation(card);

      case "tableau":
        return this.canPlaceOnTableau(card);

      case "waste":
        return false; // Waste는 직접 카드를 받을 수 없음

      case "stock":
        return false; // Stock은 직접 카드를 받을 수 없음

      default:
        return false;
    }
  }

  // Foundation 규칙 확인
  canPlaceOnFoundation(card) {
    if (this.isEmpty()) {
      return card.getValue() === 1; // 빈 Foundation에는 A만
    }

    const topCard = this.getTopCard();
    const isSameSuit = card.suit === topCard.suit;
    const isOneMore = card.getValue() === topCard.getValue() + 1;

    return isSameSuit && isOneMore;
  }

  // Tableau 규칙 확인
  canPlaceOnTableau(card) {
    if (this.isEmpty()) {
      return card.getValue() === 13; // 빈 Tableau에는 King만
    }

    const topCard = this.getTopCard();

    // 뒷면 카드 위에는 올 수 없음
    if (!topCard.faceUp) return false;

    // 다른 색깔이고 1 작은 값이어야 함
    return (
      card.isRed() !== topCard.isRed() &&
      card.getValue() === topCard.getValue() - 1
    );
  }

  // 여러 카드를 한 번에 이동 (Tableau에서 사용)
  moveCards(cards, targetStack) {
    if (!targetStack) return false;

    // 이동 가능한지 확인
    if (cards.length === 0) return false;
    const bottomCard = cards[0];
    if (!targetStack.canAcceptCard(bottomCard)) return false;

    // 카드들을 현재 스택에서 제거
    cards.forEach((card) => {
      this.removeCard(card);
    });

    // 타겟 스택에 카드들 추가
    cards.forEach((card) => {
      targetStack.addCard(card);
    });

    return true;
  }

  // 특정 카드부터 끝까지의 카드들 가져오기 (Tableau용) - 수정된 부분
  getCardsFromIndex(startIndex) {
    if (startIndex < 0 || startIndex >= this.cards.length) {
      return [];
    }

    const cardsFromIndex = this.cards.slice(startIndex);

    // 연속된 유효한 카드들만 반환 (Tableau 규칙)
    if (this.type === "tableau") {
      return this.getValidSequence(cardsFromIndex);
    }

    return cardsFromIndex;
  }

  // 유효한 연속 카드 시퀀스 확인
  getValidSequence(cards) {
    if (cards.length <= 1) return cards;

    const validCards = [cards[0]];

    for (let i = 1; i < cards.length; i++) {
      const prevCard = cards[i - 1];
      const currCard = cards[i];

      // 모든 카드가 앞면이어야 함
      if (!prevCard.faceUp || !currCard.faceUp) break;

      // 색상이 번갈아가야 함
      if (prevCard.isRed() === currCard.isRed()) break;

      // 값이 연속적으로 감소해야 함
      if (prevCard.getValue() !== currCard.getValue() + 1) break;

      validCards.push(currCard);
    }

    return validCards;
  }

  // 점이 이 스택 위에 있는지 확인
  containsPoint(globalPoint) {
    const localPoint = this.container.toLocal(globalPoint);
    return (
      localPoint.x >= 0 &&
      localPoint.x <= CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE &&
      localPoint.y >= 0 &&
      localPoint.y <= CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE
    );
  }

  // 드롭존 이벤트 핸들러
  onDropZoneEnter() {
    // 유효한 드롭존임을 시각적으로 표시
    this.dropZone.clear();

    this.dropZone.roundRect(
      0,
      0,
      CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE,
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE,
      6
    );

    // 반투명 배경
    this.dropZone.fill({ color: CONSTANTS.COLORS.VALID_DROP, alpha: 0.2 });

    // 발광 테두리 효과
    this.dropZone.stroke({ color: CONSTANTS.COLORS.VALID_DROP, width: 3 });

    // 애니메이션 효과
    this.animateDropZone();
  }

  onDropZoneLeave() {
    // 원래 상태로 되돌리기
    this.dropZone.clear();
    this.dropZone.rect(
      0,
      0,
      CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE,
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE
    );
    this.dropZone.fill({ color: 0x000000, alpha: 0 });

    // 애니메이션 중지
    this.stopDropZoneAnimation();
  }

  // 드롭존 애니메이션
  animateDropZone() {
    if (this.dropZoneAnimation) return; // 이미 애니메이션 중

    let scale = 1;
    let growing = true;

    this.dropZoneAnimation = setInterval(() => {
      if (growing) {
        scale += 0.02;
        if (scale >= 1.1) growing = false;
      } else {
        scale -= 0.02;
        if (scale <= 1) growing = true;
      }

      this.dropZone.scale.set(scale);
    }, 50);
  }

  stopDropZoneAnimation() {
    if (this.dropZoneAnimation) {
      clearInterval(this.dropZoneAnimation);
      this.dropZoneAnimation = null;
      this.dropZone.scale.set(1);
    }
  }

  // 스택 정보 반환
  getInfo() {
    return {
      type: this.type,
      index: this.index,
      cardCount: this.cards.length,
      topCard: this.getTopCard()?.toString() || "none",
    };
  }

  // 메모리 정리
  destroy() {
    this.stopDropZoneAnimation();

    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
