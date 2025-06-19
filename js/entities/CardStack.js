// PixiJS 솔리테어 - 카드 스택 클래스 (수정됨)

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "../utils/Utils.js";

export class CardStack {
  constructor(type, index = 0, scale = 1, gameController = null) {
    this.type = type; // 'stock', 'waste', 'foundation', 'tableau'
    this.index = index; // foundation이나 tableau의 인덱스
    this.scale = scale;
    this.gameController = gameController;
    this.cards = [];
    this.container = new PIXI.Container();
    this.dropZoneAnimation = null;

    // 스택 위치
    this.position = Utils.getStackPosition(type, index, this.scale);
    this.container.x = this.position.x;
    this.container.y = this.position.y;

    // 드롭존 설정
    this.setupDropZone();

    // Stock 타입일 때 카드가 없어도 클릭 가능하도록 추가 이벤트 리스너
    if (this.type === "stock") {
      this.container.interactive = true;
      this.container.cursor = "pointer";
      this.container.on("pointerdown", (event) => {
        // Stock 클릭 시 GameController의 handleStockClick 호출
        if (this.gameController) {
          this.gameController.handleStockClick();
        }
      });
    }
  }

  setupDropZone() {
    // 드롭존 영역 (투명한 사각형)
    this.dropZone = new PIXI.Graphics();

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    if (this.type === "tableau") {
      // 초기에는 단일 카드 크기로 설정, 카드가 추가되면 업데이트됨
      this.dropZone.rect(0, 0, cardWidth, cardHeight);
    } else {
      this.dropZone.rect(0, 0, cardWidth, cardHeight);
    }

    this.dropZone.fill({ color: 0x000000, alpha: 0 }); // 투명

    this.dropZone.interactive = true;
    this.dropZone.on("pointerover", this.onDropZoneEnter.bind(this));
    this.dropZone.on("pointerout", this.onDropZoneLeave.bind(this));

    this.container.addChild(this.dropZone);
  }

  // 카드 추가
  addCard(card) {
    if (!card || !card.container) {
      console.warn("유효하지 않은 카드입니다:", card);
      return;
    }

    this.cards.push(card);

    // 컨테이너가 유효한지 확인
    if (this.container && card.container) {
      this.container.addChild(card.container);

      // 카드가 보이도록 설정
      card.container.visible = true;
      if (card.frontSprite) card.frontSprite.visible = card.faceUp;
      if (card.backSprite) card.backSprite.visible = !card.faceUp;
    }

    card.currentStack = this;
    card.stackIndex = this.cards.length - 1;

    // 카드 위치 업데이트 (안전하게)
    try {
      this.updateCardPosition(card);
    } catch (error) {
      console.warn("카드 위치 업데이트 실패:", error);
    }

    // 카드 드래그 가능 상태 설정
    this.updateCardDraggable(card);

    // Tableau의 경우 드롭존 크기 업데이트
    if (this.type === "tableau") {
      this.updateDropZoneSize();
    }

    console.log(`카드 ${card.toString()}가 ${this.type} 스택에 추가됨`);
  }

  // 카드 드래그 가능 상태 업데이트
  updateCardDraggable(card) {
    let draggable = false;

    switch (this.type) {
      case "tableau":
        // Tableau에서는 맨 위 카드만 드래그 가능
        draggable = this.getTopCard() === card && card.faceUp;
        break;
      case "waste":
        // Waste에서는 맨 위 카드만 드래그 가능
        draggable = this.getTopCard() === card && card.faceUp;
        break;
      case "foundation":
        // Foundation에서는 맨 위 카드만 드래그 가능
        draggable = this.getTopCard() === card && card.faceUp;
        break;
      case "stock":
        // Stock은 클릭만 가능, 드래그 불가
        draggable = false;
        break;
    }

    card.setDraggable(draggable);
  }

  // 모든 카드의 드래그 가능 상태 업데이트
  updateAllCardsDraggable() {
    this.cards.forEach((card) => {
      this.updateCardDraggable(card);
    });
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

      // 남은 카드들의 드래그 가능 상태 업데이트
      this.updateAllCardsDraggable();

      // Tableau의 경우 드롭존 크기 업데이트
      if (this.type === "tableau") {
        this.updateDropZoneSize();
      }

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
        y = cardIndex * CONSTANTS.STACK_OFFSET_Y * this.scale;
        break;
    }

    return { x, y };
  }

  // 카드 위치 업데이트
  updateCardPosition(card) {
    const cardIndex = this.cards.indexOf(card);
    if (cardIndex === -1 || !card || !card.container) return;

    try {
      const position = this.getCardPosition(cardIndex);
      card.setPosition(position.x, position.y);
      card.stackIndex = cardIndex;
    } catch (error) {
      console.warn(`카드 ${card.toString()} 위치 설정 실패:`, error);
    }
  }

  // 모든 카드 위치 업데이트
  updateAllCardPositions() {
    this.cards.forEach((card, index) => {
      if (card && card.container) {
        try {
          card.stackIndex = index;
          this.updateCardPosition(card);
        } catch (error) {
          console.warn(`카드 ${card.toString()} 위치 업데이트 실패:`, error);
        }
      }
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

  // 점이 이 스택 위에 있는지 확인 (카드 그룹 전체 크기 고려)
  containsPoint(globalPoint) {
    const localPoint = this.container.toLocal(globalPoint);

    // 기본 카드 크기
    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이 계산
    if (this.type === "tableau" && this.cards.length > 0) {
      const totalHeight =
        cardHeight +
        (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

      return (
        localPoint.x >= 0 &&
        localPoint.x <= cardWidth &&
        localPoint.y >= 0 &&
        localPoint.y <= totalHeight
      );
    }

    // 다른 스택들은 단일 카드 크기
    return (
      localPoint.x >= 0 &&
      localPoint.x <= cardWidth &&
      localPoint.y >= 0 &&
      localPoint.y <= cardHeight
    );
  }

  // 드롭존 이벤트 핸들러
  onDropZoneEnter() {
    // 유효한 드롭존임을 시각적으로 표시
    this.dropZone.clear();

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    if (this.type === "tableau" && this.cards.length > 0) {
      const totalHeight =
        cardHeight +
        (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

      this.dropZone.roundRect(0, 0, cardWidth, totalHeight, 6 * this.scale);
    } else {
      this.dropZone.roundRect(0, 0, cardWidth, cardHeight, 6 * this.scale);
    }

    // 반투명 배경만 설정 (테두리 제거)
    this.dropZone.fill({ color: CONSTANTS.COLORS.VALID_DROP, alpha: 0.1 });

    // 테두리 효과 제거
    // this.dropZone.stroke({ color: CONSTANTS.COLORS.VALID_DROP, width: 3 * this.scale });

    // 애니메이션 효과
    this.animateDropZone();
  }

  onDropZoneLeave() {
    // 원래 상태로 되돌리기
    this.dropZone.clear();

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    if (this.type === "tableau" && this.cards.length > 0) {
      const totalHeight =
        cardHeight +
        (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

      this.dropZone.rect(0, 0, cardWidth, totalHeight);
    } else {
      this.dropZone.rect(0, 0, cardWidth, cardHeight);
    }

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

  // 드롭존 크기 업데이트 (Tableau용)
  updateDropZoneSize() {
    if (this.type !== "tableau") return;

    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;

    // Tableau의 경우 카드 그룹의 전체 길이로 드롭존 크기 설정
    const totalHeight =
      cardHeight +
      (this.cards.length - 1) * CONSTANTS.STACK_OFFSET_Y * this.scale;

    this.dropZone.clear();
    this.dropZone.rect(0, 0, cardWidth, totalHeight);
    this.dropZone.fill({ color: 0x000000, alpha: 0 });
  }

  // 스케일 설정 (고정 스케일 사용)
  setScale(scale) {
    // 고정 스케일 사용 - 리사이즈 시 스케일 변경하지 않음
    console.log(`[setScale] 스케일 변경 요청 무시: ${scale}`);
  }
}
