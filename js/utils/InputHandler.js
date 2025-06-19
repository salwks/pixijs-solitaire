// PixiJS 솔리테어 - 입력 처리 클래스 (수정됨)

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "./Utils.js";

export class InputHandler {
  constructor(app, gameBoard) {
    this.app = app;
    this.gameBoard = gameBoard;
    this.gameController = null; // GameController 참조 추가

    // 드래그 상태
    this.isDragging = false;
    this.draggedCard = null;
    this.draggedCards = []; // 여러 카드 동시 드래그
    this.dragStartPosition = null;
    this.originalPositions = [];

    // 유효한 드롭존들
    this.validDropZones = [];

    this.setupEventListeners();
  }

  // GameController 설정
  setGameController(gameController) {
    this.gameController = gameController;
  }

  setupEventListeners() {
    // 전역 마우스 이벤트
    this.app.stage.interactive = true;
    this.app.stage.on("pointermove", this.onGlobalPointerMove.bind(this));
    this.app.stage.on("pointerup", this.onGlobalPointerUp.bind(this));
    this.app.stage.on("pointerupoutside", this.onGlobalPointerUp.bind(this));

    // 카드 이벤트 리스너
    document.addEventListener("carddragstart", this.onCardDragStart.bind(this));
    document.addEventListener("carddragmove", this.onCardDragMove.bind(this));
    document.addEventListener("carddragend", this.onCardDragEnd.bind(this));
    document.addEventListener(
      "cardstockclicked",
      this.onStockClicked.bind(this)
    );
    document.addEventListener(
      "carddoubleclick",
      this.onCardDoubleClick.bind(this)
    );
    document.addEventListener("cardcardflipped", this.onCardFlipped.bind(this));

    console.log("입력 이벤트 리스너가 설정되었습니다.");
  }

  // 카드 드래그 시작
  onCardDragStart(event) {
    const { card, cards, event: pointerEvent } = event.detail;

    this.isDragging = true;
    this.draggedCard = card;
    this.draggedCards = cards || [card];
    this.dragStartPosition = pointerEvent.data.global.clone();

    // 원래 위치 저장
    this.originalPositions = this.draggedCards.map((c) => ({
      card: c,
      position: { x: c.container.x, y: c.container.y },
      stack: c.currentStack,
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

    console.log(`드래그 시작: ${this.draggedCards.length}장의 카드`);
  }

  // 카드 드래그 중
  onCardDragMove(event) {
    if (!this.isDragging) return;

    const { deltaX, deltaY } = event.detail;

    // 드래그 중인 모든 카드 이동
    this.draggedCards.forEach((dragCard, index) => {
      const original = this.originalPositions[index];
      dragCard.container.x = original.position.x + deltaX;
      dragCard.container.y = original.position.y + deltaY;
    });
  }

  // 카드 드래그 종료
  onCardDragEnd(event) {
    if (!this.isDragging) return;

    this.isDragging = false;

    // 드롭존 하이라이트 해제
    this.clearDropZoneHighlights();

    // 유효한 드롭 위치 찾기
    const dropTarget = this.findDropTarget(event.detail.event.data.global);

    if (dropTarget && this.canDropCards(this.draggedCards, dropTarget)) {
      // 유효한 위치에 드롭
      this.dropCards(dropTarget);
    } else {
      // 원래 위치로 되돌리기
      this.returnCardsToOriginalPosition();
    }

    // 드래그 상태 초기화
    this.resetDragState();

    console.log("드래그 종료");
  }

  // Stock 클릭 처리
  onStockClicked(event) {
    if (this.gameController) {
      this.gameController.handleStockClick();
    }
  }

  // 카드 더블클릭 처리
  onCardDoubleClick(event) {
    const { card } = event.detail;

    if (!card.faceUp || !this.gameController) return;

    // Foundation으로 자동 이동 시도
    const targetFoundation = this.findValidFoundation(card);
    if (targetFoundation) {
      this.gameController.handleCardMove(
        card,
        card.currentStack,
        targetFoundation
      );
      return;
    }

    // 다른 Tableau로 자동 이동 시도
    const targetTableau = this.findValidTableau(card);
    if (targetTableau) {
      this.gameController.handleCardMove(
        card,
        card.currentStack,
        targetTableau
      );
    }
  }

  // 카드 뒤집기 처리
  onCardFlipped(event) {
    const { card } = event.detail;

    if (this.gameController) {
      // 점수 업데이트 등의 처리
      this.gameController.onCardFlipped(card);
    }
  }

  // 드롭 타겟 찾기
  findDropTarget(globalPosition) {
    if (!this.gameController) return null;

    const allStacks = this.gameController.getAllStacks();

    for (const stack of allStacks) {
      if (stack.containsPoint(globalPosition)) {
        return stack;
      }
    }
    return null;
  }

  // 카드들을 드롭할 수 있는지 확인
  canDropCards(cards, targetStack) {
    if (cards.length === 0 || !targetStack) return false;

    // 같은 스택에는 드롭할 수 없음
    if (cards[0].currentStack === targetStack) return false;

    // 첫 번째 카드가 드롭 가능한지 확인
    return targetStack.canAcceptCard(cards[0]);
  }

  // 카드들을 드롭
  dropCards(targetStack) {
    const fromStack = this.draggedCards[0].currentStack;

    if (this.gameController) {
      // GameController를 통해 이동 처리
      if (this.draggedCards.length === 1) {
        this.gameController.handleCardMove(
          this.draggedCards[0],
          fromStack,
          targetStack
        );
      } else {
        this.gameController.handleMultiCardMove(
          this.draggedCards,
          fromStack,
          targetStack
        );
      }
    } else {
      // 직접 이동 (fallback)
      this.draggedCards.forEach((card) => {
        if (card.currentStack) {
          card.currentStack.removeCard(card);
        }
        targetStack.addCard(card);
      });
    }

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

  // 드래그 상태 리셋
  resetDragState() {
    this.draggedCard = null;
    this.draggedCards = [];
    this.dragStartPosition = null;
    this.originalPositions = [];
  }

  // Foundation으로 이동 가능한 곳 찾기
  findValidFoundation(card) {
    if (!this.gameController) return null;

    const foundationStacks = this.gameController.foundationStacks;

    for (const stack of foundationStacks) {
      if (stack.canAcceptCard(card)) {
        return stack;
      }
    }
    return null;
  }

  // Tableau로 이동 가능한 곳 찾기
  findValidTableau(card) {
    if (!this.gameController) return null;

    const tableauStacks = this.gameController.tableauStacks;

    for (const stack of tableauStacks) {
      if (stack !== card.currentStack && stack.canAcceptCard(card)) {
        return stack;
      }
    }
    return null;
  }

  // 유효한 드롭존 하이라이트
  highlightValidDropZones() {
    if (!this.gameController || this.draggedCards.length === 0) return;

    const firstCard = this.draggedCards[0];
    const allStacks = this.gameController.getAllStacks();

    this.validDropZones = [];

    allStacks.forEach((stack) => {
      if (stack !== firstCard.currentStack && stack.canAcceptCard(firstCard)) {
        this.validDropZones.push(stack);
        // 스택의 드롭존 하이라이트 활성화는 카드가 근처에 올 때 자동으로 됨
      }
    });

    console.log(`${this.validDropZones.length}개의 유효한 드롭존 발견`);
  }

  // 드롭존 하이라이트 해제
  clearDropZoneHighlights() {
    this.validDropZones.forEach((stack) => {
      stack.onDropZoneLeave();
    });
    this.validDropZones = [];
  }

  // 전역 포인터 이동
  onGlobalPointerMove(event) {
    if (this.isDragging && this.dragStartPosition) {
      const currentPosition = event.data.global;
      const deltaX = currentPosition.x - this.dragStartPosition.x;
      const deltaY = currentPosition.y - this.dragStartPosition.y;

      // 드래그 중인 모든 카드 이동
      this.draggedCards.forEach((dragCard, index) => {
        const original = this.originalPositions[index];
        dragCard.container.x = original.position.x + deltaX;
        dragCard.container.y = original.position.y + deltaY;
      });

      // 드롭존 하이라이트 업데이트
      this.updateDropZoneHighlights(currentPosition);
    }
  }

  // 드롭존 하이라이트 업데이트
  updateDropZoneHighlights(globalPosition) {
    this.validDropZones.forEach((stack) => {
      if (stack.containsPoint(globalPosition)) {
        stack.onDropZoneEnter();
      } else {
        stack.onDropZoneLeave();
      }
    });
  }

  // 전역 포인터 릴리즈
  onGlobalPointerUp(event) {
    if (this.isDragging) {
      // 카드의 onPointerUp이 먼저 호출되므로 여기서는 정리만
      this.clearDropZoneHighlights();
    }
  }

  // 입력 핸들러 활성화/비활성화
  setEnabled(enabled) {
    this.app.stage.interactive = enabled;
    console.log(`입력 처리 ${enabled ? "활성화" : "비활성화"}`);
  }

  // 메모리 정리
  destroy() {
    // 이벤트 리스너 제거
    this.app.stage.removeAllListeners();

    document.removeEventListener(
      "carddragstart",
      this.onCardDragStart.bind(this)
    );
    document.removeEventListener(
      "carddragmove",
      this.onCardDragMove.bind(this)
    );
    document.removeEventListener("carddragend", this.onCardDragEnd.bind(this));
    document.removeEventListener(
      "cardstockclicked",
      this.onStockClicked.bind(this)
    );
    document.removeEventListener(
      "carddoubleclick",
      this.onCardDoubleClick.bind(this)
    );
    document.removeEventListener(
      "cardcardflipped",
      this.onCardFlipped.bind(this)
    );

    this.resetDragState();
    this.clearDropZoneHighlights();
  }
}
