// PixiJS 솔리테어 - 입력 처리 클래스

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "./Utils.js";

export class InputHandler {
  constructor(app, gameBoard) {
    this.app = app;
    this.gameBoard = gameBoard;

    // 드래그 상태
    this.isDragging = false;
    this.draggedCard = null;
    this.draggedCards = []; // 여러 카드 동시 드래그 (Tableau용)
    this.dragStartPosition = null;
    this.originalPositions = [];

    // 더블클릭 처리
    this.lastClickTime = 0;
    this.lastClickedCard = null;
    this.doubleClickDelay = 300; // ms

    // 유효한 드롭존들
    this.validDropZones = [];

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 전역 마우스 이벤트
    this.app.stage.interactive = true;
    this.app.stage.on("pointermove", this.onGlobalPointerMove.bind(this));
    this.app.stage.on("pointerup", this.onGlobalPointerUp.bind(this));
    this.app.stage.on("pointerupoutside", this.onGlobalPointerUp.bind(this));

    console.log("입력 이벤트 리스너가 설정되었습니다.");
  }

  // 카드 클릭 처리
  onCardClick(card, event) {
    const currentTime = Date.now();
    const isDoubleClick =
      currentTime - this.lastClickTime < this.doubleClickDelay &&
      this.lastClickedCard === card;

    if (isDoubleClick) {
      this.handleDoubleClick(card);
    } else {
      this.handleSingleClick(card);
    }

    this.lastClickTime = currentTime;
    this.lastClickedCard = card;
  }

  // 단일 클릭 처리
  handleSingleClick(card) {
    console.log(`카드 ${card.toString()} 단일 클릭`);

    // Stock pile 클릭 시 카드 뽑기
    if (card.currentStack && card.currentStack.type === "stock") {
      this.handleStockClick();
      return;
    }

    // 뒷면 카드 클릭 시 뒤집기 (Tableau의 마지막 카드인 경우)
    if (!card.faceUp && this.canFlipCard(card)) {
      card.flip(true);
      return;
    }
  }

  // 더블클릭 처리
  handleDoubleClick(card) {
    console.log(`카드 ${card.toString()} 더블클릭 - 자동 이동 시도`);

    if (!card.faceUp) return;

    // Foundation으로 자동 이동 시도
    const targetFoundation = this.findValidFoundation(card);
    if (targetFoundation) {
      this.moveCardToStack(card, targetFoundation);
      return;
    }

    // 다른 Tableau로 자동 이동 시도
    const targetTableau = this.findValidTableau(card);
    if (targetTableau) {
      this.moveCardToStack(card, targetTableau);
    }
  }

  // 드래그 시작
  onCardDragStart(card, event) {
    if (!card.faceUp) return; // 뒷면 카드는 드래그 불가

    this.isDragging = true;
    this.draggedCard = card;
    this.dragStartPosition = event.data.global.clone();

    // Tableau에서 여러 카드 선택 처리
    if (card.currentStack && card.currentStack.type === "tableau") {
      this.draggedCards = card.currentStack.getCardsFromIndex(card.stackIndex);
    } else {
      this.draggedCards = [card];
    }

    // 원래 위치 저장
    this.originalPositions = this.draggedCards.map((c) => ({
      card: c,
      position: { x: c.container.x, y: c.container.y },
    }));

    // 드래그 중인 카드들을 최상단으로
    this.draggedCards.forEach((dragCard) => {
      if (dragCard.container.parent) {
        dragCard.container.parent.setChildIndex(
          dragCard.container,
          dragCard.container.parent.children.length - 1
        );
      }
    });

    // 유효한 드롭존 하이라이트
    this.highlightValidDropZones();

    console.log(`카드 드래그 시작: ${this.draggedCards.length}장`);
  }

  // 전역 포인터 이동
  onGlobalPointerMove(event) {
    if (!this.isDragging || !this.dragStartPosition) return;

    const currentPosition = event.data.global;
    const deltaX = currentPosition.x - this.dragStartPosition.x;
    const deltaY = currentPosition.y - this.dragStartPosition.y;

    // 드래그 중인 모든 카드 이동
    this.draggedCards.forEach((dragCard, index) => {
      const original = this.originalPositions[index];
      dragCard.container.x = original.position.x + deltaX;
      dragCard.container.y = original.position.y + deltaY;
    });
  }

  // 전역 포인터 릴리즈
  onGlobalPointerUp(event) {
    if (!this.isDragging) return;

    this.isDragging = false;

    // 드롭존 하이라이트 해제
    this.clearDropZoneHighlights();

    // 유효한 드롭 위치 찾기
    const dropTarget = this.findDropTarget(event.data.global);

    if (dropTarget && this.canDropCards(this.draggedCards, dropTarget)) {
      // 유효한 위치에 드롭
      this.dropCards(dropTarget);
    } else {
      // 원래 위치로 되돌리기
      this.returnCardsToOriginalPosition();
    }

    // 드래그 상태 초기화
    this.draggedCard = null;
    this.draggedCards = [];
    this.dragStartPosition = null;
    this.originalPositions = [];

    console.log("카드 드래그 종료");
  }

  // Stock pile 클릭 처리
  handleStockClick() {
    // TODO: GameController와 연동하여 Stock에서 Waste로 카드 이동
    console.log("Stock pile 클릭 - 카드 뽑기");
  }

  // 카드 뒤집기 가능 여부 확인
  canFlipCard(card) {
    if (!card.currentStack || card.currentStack.type !== "tableau") {
      return false;
    }

    // Tableau의 맨 위 카드이고 뒷면인 경우만 뒤집기 가능
    const topCard = card.currentStack.getTopCard();
    return topCard === card && !card.faceUp;
  }

  // Foundation으로 이동 가능한 곳 찾기
  findValidFoundation(card) {
    // TODO: GameBoard의 foundation 스택들을 확인
    // 임시로 null 반환
    return null;
  }

  // Tableau로 이동 가능한 곳 찾기
  findValidTableau(card) {
    // TODO: GameBoard의 tableau 스택들을 확인
    // 임시로 null 반환
    return null;
  }

  // 카드를 특정 스택으로 이동
  moveCardToStack(card, targetStack) {
    if (!targetStack.canAcceptCard(card)) return false;

    // 현재 스택에서 제거
    if (card.currentStack) {
      card.currentStack.removeCard(card);
    }

    // 타겟 스택에 추가
    targetStack.addCard(card);

    console.log(`카드 ${card.toString()}가 ${targetStack.type}로 이동됨`);
    return true;
  }

  // 드롭 타겟 찾기
  findDropTarget(position) {
    // TODO: 모든 스택의 드롭존과 충돌 검사
    // 임시로 null 반환
    return null;
  }

  // 카드들을 드롭할 수 있는지 확인
  canDropCards(cards, targetStack) {
    if (cards.length === 0) return false;

    // 첫 번째 카드가 드롭 가능한지 확인
    return targetStack.canAcceptCard(cards[0]);
  }

  // 카드들을 드롭
  dropCards(targetStack) {
    this.draggedCards.forEach((card) => {
      if (card.currentStack) {
        card.currentStack.removeCard(card);
      }
      targetStack.addCard(card);
    });

    console.log(
      `${this.draggedCards.length}장의 카드가 ${targetStack.type}에 드롭됨`
    );
  }

  // 카드들을 원래 위치로 복귀
  returnCardsToOriginalPosition() {
    this.originalPositions.forEach(({ card, position }) => {
      card.container.x = position.x;
      card.container.y = position.y;
    });

    console.log("카드들이 원래 위치로 복귀됨");
  }

  // 유효한 드롭존 하이라이트
  highlightValidDropZones() {
    // TODO: 유효한 드롭존들을 시각적으로 강조
    console.log("유효한 드롭존 하이라이트");
  }

  // 드롭존 하이라이트 해제
  clearDropZoneHighlights() {
    // TODO: 모든 드롭존 하이라이트 해제
    console.log("드롭존 하이라이트 해제");
  }

  // 입력 핸들러 활성화/비활성화
  setEnabled(enabled) {
    this.app.stage.interactive = enabled;
    console.log(`입력 처리 ${enabled ? "활성화" : "비활성화"}`);
  }

  // 메모리 정리
  destroy() {
    this.app.stage.removeAllListeners();
    this.isDragging = false;
    this.draggedCard = null;
    this.draggedCards = [];
  }
}
