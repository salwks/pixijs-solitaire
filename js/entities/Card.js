// PixiJS 솔리테어 - 카드 클래스 (수정됨)

import { CONSTANTS } from "../core/Constants.js";

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = false;
    this.isDragging = false;
    this.isSelected = false;
    this.isDraggable = false;
    this.isHovered = false;

    // 화면 크기에 맞는 스케일 계산
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    this.scale = Math.min(screenWidth / 1024, screenHeight / 720);

    // 드래그 관련 변수들
    this.dragStart = null;
    this.originalPosition = null;
    this.lastClickTime = 0;
    this.doubleClickDelay = 300;

    // 스택 관련 변수들
    this.currentStack = null;
    this.stackIndex = -1;

    // 컨테이너 생성
    this.container = new PIXI.Container();

    // PixiJS 스프라이트들
    this.frontSprite = null;
    this.backSprite = null;

    // 카드 위치 및 스택 정보
    this.createSprites();
    this.setupInteraction();
  }

  createSprites() {
    // 앞면 스프라이트 - 프로그래밍 방식으로 생성
    this.frontSprite = this.createCardFront();
    this.frontSprite.visible = this.faceUp;
    this.container.addChild(this.frontSprite);

    // 뒷면 스프라이트 - 프로그래밍 방식으로 생성
    this.backSprite = this.createCardBack();
    this.backSprite.visible = !this.faceUp;
    this.container.addChild(this.backSprite);

    // 컨테이너가 보이도록 설정
    this.container.visible = true;
  }

  // 카드 앞면 생성 (PixiJS API 활용)
  createCardFront() {
    const cardContainer = new PIXI.Container();

    // 카드 크기
    const cardWidth = 70 * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight = 98 * CONSTANTS.CARD_SCALE * this.scale;

    // 그림자 효과 (조명과 어울리게)
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.25);
    shadow.drawRoundedRect(4, -4, cardWidth, cardHeight, 6);

    // 그림자에 blur 효과 추가
    shadow.filters = [new PIXI.BlurFilter(2)];

    shadow.endFill();
    cardContainer.addChild(shadow);

    // 카드 배경 (둥근 모서리)
    const cardBackground = new PIXI.Graphics();
    cardBackground.beginFill(0xffffff);
    cardBackground.lineStyle(2, 0x000000, 1);
    cardBackground.drawRoundedRect(0, 0, cardWidth, cardHeight, 6);
    cardBackground.endFill();
    cardContainer.addChild(cardBackground);

    // 카드 색상 결정
    const cardColor = this.isRed() ? 0xff0000 : 0x000000;

    // 카드 크기에 따른 폰트 크기 계산
    const fontSize = Math.max(12, Math.floor(14 * this.scale));
    const smallFontSize = Math.max(8, Math.floor(10 * this.scale));

    // 여백 설정
    const margin = Math.max(3, Math.floor(4 * this.scale));

    // 왼쪽 상단 숫자와 문양
    const topLeftText = new PIXI.Text(this.rank, {
      fontFamily: "Arial, sans-serif",
      fontSize: fontSize,
      fill: cardColor,
      fontWeight: "bold",
    });
    topLeftText.x = margin;
    topLeftText.y = margin;
    cardContainer.addChild(topLeftText);

    const topLeftSuit = new PIXI.Text(this.getSuitSymbol(), {
      fontFamily: "Arial, sans-serif",
      fontSize: smallFontSize,
      fill: cardColor,
    });
    topLeftSuit.x = margin;
    topLeftSuit.y = topLeftText.y + fontSize + 1;
    cardContainer.addChild(topLeftSuit);

    // 오른쪽 하단 숫자와 문양 (180도 회전)
    const bottomRightText = new PIXI.Text(this.rank, {
      fontFamily: "Arial, sans-serif",
      fontSize: fontSize,
      fill: cardColor,
      fontWeight: "bold",
    });
    bottomRightText.anchor.set(0.5, 0.5);
    bottomRightText.x = cardWidth - margin - fontSize / 2;
    bottomRightText.y = cardHeight - margin - fontSize / 2;
    bottomRightText.rotation = Math.PI;
    cardContainer.addChild(bottomRightText);

    const bottomRightSuit = new PIXI.Text(this.getSuitSymbol(), {
      fontFamily: "Arial, sans-serif",
      fontSize: smallFontSize,
      fill: cardColor,
    });
    bottomRightSuit.anchor.set(0.5, 0.5);
    bottomRightSuit.x = cardWidth - margin - fontSize / 2;
    bottomRightSuit.y = cardHeight - margin - fontSize - smallFontSize / 2;
    bottomRightSuit.rotation = Math.PI;
    cardContainer.addChild(bottomRightSuit);

    // 중앙 문양 (큰 크기)
    const centerSuit = new PIXI.Text(this.getSuitSymbol(), {
      fontFamily: "Arial, sans-serif",
      fontSize: fontSize * 1.8,
      fill: cardColor,
    });
    centerSuit.anchor.set(0.5, 0.5);
    centerSuit.x = cardWidth / 2;
    centerSuit.y = cardHeight / 2;
    cardContainer.addChild(centerSuit);

    return cardContainer;
  }

  // 카드 뒷면 생성 (PixiJS API 활용)
  createCardBack() {
    const cardContainer = new PIXI.Container();

    // 카드 크기
    const cardWidth = 70 * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight = 98 * CONSTANTS.CARD_SCALE * this.scale;

    // 그림자 효과 (조명과 어울리게)
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.25);
    shadow.drawRoundedRect(4, -4, cardWidth, cardHeight, 6);

    // 그림자에 blur 효과 추가
    shadow.filters = [new PIXI.BlurFilter(2)];

    shadow.endFill();
    cardContainer.addChild(shadow);

    // 카드 배경 (둥근 모서리)
    const cardBackground = new PIXI.Graphics();
    cardBackground.beginFill(0xffffff);
    cardBackground.lineStyle(2, 0x000000, 1);
    cardBackground.drawRoundedRect(0, 0, cardWidth, cardHeight, 6);
    cardBackground.endFill();
    cardContainer.addChild(cardBackground);

    // 보라색 영역 (마진 적용)
    const purpleArea = new PIXI.Graphics();
    purpleArea.beginFill(0x800080);
    purpleArea.drawRoundedRect(4, 4, cardWidth - 8, cardHeight - 8, 4);
    purpleArea.endFill();
    cardContainer.addChild(purpleArea);

    return cardContainer;
  }

  // 문양 심볼 반환
  getSuitSymbol() {
    switch (this.suit) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
    }
  }

  setupInteraction() {
    this.container.interactive = true;
    this.container.cursor = "grab";

    // 마우스 이벤트 리스너
    this.container.on("pointerdown", this.onPointerDown.bind(this));
    this.container.on("pointermove", this.onPointerMove.bind(this));
    this.container.on("pointerup", this.onPointerUp.bind(this));
    this.container.on("pointerupoutside", this.onPointerUp.bind(this));
    this.container.on("pointerover", this.onHover.bind(this));
    this.container.on("pointerout", this.onHoverOut.bind(this));
    this.container.on("doubleclick", this.onDoubleClick.bind(this));
  }

  // 카드 뒤집기
  flip(faceUp = null) {
    if (faceUp !== null) {
      this.faceUp = faceUp;
    } else {
      this.faceUp = !this.faceUp;
    }

    if (this.frontSprite && this.backSprite) {
      this.frontSprite.visible = this.faceUp;
      this.backSprite.visible = !this.faceUp;
    }

    // 카드가 뒤집힐 때 드래그 가능 상태 업데이트
    if (this.currentStack) {
      this.currentStack.updateAllCardsDraggable();
    }

    console.log(
      `카드 ${this.toString()} ${this.faceUp ? "앞면" : "뒷면"}으로 뒤집힘`
    );
  }

  // 카드 선택 하이라이트
  setSelected(selected) {
    this.isSelected = selected;
    if (selected) {
      // 선택된 카드 강조 - 틴트만 사용
      this.container.tint = 0xffff99;
    } else {
      this.container.tint = 0xffffff;
    }
  }

  // 드래그 가능 상태 표시
  setDraggable(draggable) {
    this.isDraggable = draggable;

    if (draggable && this.faceUp) {
      this.container.cursor = "grab";
    } else {
      this.container.cursor = this.faceUp ? "pointer" : "default";
    }
  }

  // 호버 효과 - 수정된 부분
  onHover() {
    if (this.faceUp && !this.isDragging && !this.isSelected) {
      this.isHovered = true;
    }
  }

  onHoverOut() {
    if (!this.isDragging && !this.isSelected) {
      this.isHovered = false;

      // 원래 위치로 복원
      if (this.currentStack) {
        this.updatePosition();
      }
    }
  }

  // 위치 설정
  setPosition(x, y) {
    if (!this.container) {
      console.warn("카드 컨테이너가 없습니다:", this.toString());
      return;
    }

    try {
      this.container.x = x;
      this.container.y = y;
    } catch (error) {
      console.warn("카드 위치 설정 실패:", error, this.toString());
    }
  }

  // 카드 스케일 설정 (고정 스케일 사용)
  setScale(scale) {
    // 고정 스케일 사용 - 리사이즈 시 스케일 변경하지 않음
    console.log(`[Card setScale] 스케일 변경 요청 무시: ${scale}`);
  }

  getPosition() {
    return { x: this.container.x, y: this.container.y };
  }

  // 스택 내에서의 올바른 위치로 업데이트
  updatePosition() {
    if (!this.currentStack) return;

    const stackPos = this.currentStack.getCardPosition(this.stackIndex);
    this.setPosition(stackPos.x, stackPos.y);
  }

  // 드래그 이벤트 핸들러들 - 수정된 부분
  onPointerDown(event) {
    // 더블클릭 확인
    const currentTime = Date.now();
    const isDoubleClick =
      currentTime - this.lastClickTime < this.doubleClickDelay;
    this.lastClickTime = currentTime;

    if (isDoubleClick) {
      this.onDoubleClick();
      return;
    }

    // 뒷면 카드 클릭 시 뒤집기 (Tableau 맨 위 카드만)
    if (!this.faceUp && this.canFlip()) {
      this.flip(true);
      this.dispatchEvent("cardflipped", { card: this });
      return;
    }

    // 드래그 시작
    if (this.faceUp && this.isDraggable) {
      this.startDrag(event);
    }
  }

  // 드래그 시작
  startDrag(event) {
    console.log(`[startDrag] 시작`);
    this.isDragging = true;

    // 클릭 위치와 카드의 글로벌 좌표 오프셋 계산
    const mousePos = event.data.global; // stage 기준
    console.log(`[startDrag] 마우스 위치:`, mousePos);
    console.log(`[startDrag] container.parent:`, this.container.parent);
    console.log(
      `[startDrag] container.x, y:`,
      this.container.x,
      this.container.y
    );

    let cardGlobal;
    try {
      cardGlobal = this.container.parent.toGlobal(
        new PIXI.Point(this.container.x, this.container.y)
      );
      console.log(`[startDrag] cardGlobal 계산 성공:`, cardGlobal);
    } catch (error) {
      console.error(`[startDrag] cardGlobal 계산 실패:`, error);
      // fallback: 원본 카드 위치 사용
      cardGlobal = { x: this.container.x, y: this.container.y };
    }

    this.dragOffset = {
      x: mousePos.x - cardGlobal.x,
      y: mousePos.y - cardGlobal.y,
    };
    this.dragStart = mousePos.clone();
    this.originalPosition = { x: cardGlobal.x, y: cardGlobal.y };

    // 드래그할 카드들 결정 (Tableau에서는 연속된 카드들)
    let draggedCards = [this];
    if (this.currentStack?.type === "tableau") {
      draggedCards = this.currentStack.getCardsFromIndex(this.stackIndex);
      console.log(
        `[startDrag] Tableau에서 ${draggedCards.length}장의 카드 드래그:`,
        draggedCards.map((c) => c.toString())
      );
    }

    // 모든 드래그할 카드들을 숨기고 프록시 생성
    this.dragProxies = [];

    // 먼저 모든 원본 카드를 숨기기
    draggedCards.forEach((card) => {
      card.container.visible = false;
    });

    // 그 다음 모든 프록시를 순서대로 생성 (9, 8, 7 순서로)
    draggedCards.forEach((card, index) => {
      const proxy = this.createCardProxy(
        card,
        cardGlobal.x,
        cardGlobal.y + index * CONSTANTS.STACK_OFFSET_Y * this.scale,
        index === 0 // 첫 번째 프록시에만 이벤트 리스너 추가
      );
      this.dragProxies.push(proxy);
    });

    console.log(`[startDrag] ${this.dragProxies.length}개의 프록시 생성됨`);

    // 드래그 시작 시각적 효과
    if (this.dragProxies[0]) {
      this.dragProxies[0].cursor = "grabbing";
      this.dragProxies[0].alpha = 1; // 반투명 효과 제거

      // 최상단으로 이동
      if (this.dragProxies[0].parent) {
        this.dragProxies[0].parent.setChildIndex(
          this.dragProxies[0],
          this.dragProxies[0].parent.children.length - 1
        );
      }
    }

    // 드래그 시작 이벤트 발생
    this.dispatchEvent("dragstart", {
      card: this,
      cards: draggedCards, // 연속된 카드들 전달
      event: event,
    });

    console.log(
      `[startDrag] 카드 글로벌 좌표:`,
      cardGlobal,
      "마우스:",
      mousePos,
      "오프셋:",
      this.dragOffset
    );
  }

  // 개별 카드 프록시 생성
  createCardProxy(card, globalX, globalY, isFirst = false) {
    console.log(
      `[createCardProxy] 프록시 생성:`,
      card.toString(),
      "위치:",
      globalX,
      globalY
    );

    const proxy = new PIXI.Container();

    // 카드 앞면 또는 뒷면 복사
    if (card.faceUp && card.frontSprite) {
      // 앞면 카드 복사
      const frontCopy = card.createCardFront();
      proxy.addChild(frontCopy);
    } else if (card.backSprite) {
      // 뒷면 카드 복사
      const backCopy = card.createCardBack();
      proxy.addChild(backCopy);
    }

    // stage 기준 좌표로 위치
    proxy.x = globalX;
    proxy.y = globalY;

    // 레이어 순서 제어: 나중에 생성된 프록시가 위에 오도록
    proxy.zIndex = 9999 + this.dragProxies.length;

    // 첫 번째 프록시에만 마우스 이벤트 리스너 추가
    if (isFirst) {
      proxy.interactive = true;
      proxy.cursor = "grabbing";
      proxy.on("pointermove", this.onPointerMove.bind(this));
      proxy.on("pointerup", this.onPointerUp.bind(this));
      proxy.on("pointerupoutside", this.onPointerUp.bind(this));
    }

    // stage에 추가
    if (window.PIXI_APP && window.PIXI_APP.stage) {
      window.PIXI_APP.stage.addChild(proxy);
    } else if (this.container.parent && this.container.parent.parent) {
      this.container.parent.parent.addChild(proxy);
    }

    return proxy;
  }

  // 드래그 중 이동
  onPointerMove(event) {
    if (this.isDragging && this.dragProxies && this.dragProxies.length > 0) {
      const mousePos = event.data.global;
      // 모든 프록시를 함께 이동
      this.dragProxies.forEach((proxy, index) => {
        proxy.x = mousePos.x - this.dragOffset.x;
        proxy.y =
          mousePos.y -
          this.dragOffset.y +
          index * CONSTANTS.STACK_OFFSET_Y * this.scale;
      });
      this.dispatchEvent("dragmove", {
        card: this,
        event: event,
        deltaX: mousePos.x - this.dragStart.x,
        deltaY: mousePos.y - this.dragStart.y,
      });
    }
  }

  // 마우스 업 이벤트 핸들러
  onPointerUp(event) {
    if (!this.isDragging) return;

    console.log(`[onPointerUp] 드래그 종료`);

    // 드래그 종료 처리
    this.isDragging = false;
    this.lastMousePos = null;

    // 드롭 가능한 스택 찾기
    const dropStack = this.findDropStack(event.data.global);

    if (dropStack && this.canDropOnStack(dropStack)) {
      // 성공적인 드롭
      console.log(`[onPointerUp] 성공적인 드롭: ${dropStack.type} 스택`);

      // 드롭 애니메이션
      this.animateDrop(dropStack);
    } else {
      // 실패한 드롭 - 원래 위치로 돌아가기
      console.log(`[onPointerUp] 드롭 실패 - 원래 위치로 복귀`);

      // 원래 위치로 돌아가기
      this.animateReturn();
    }

    // 드래그 종료 이벤트 발생
    this.dispatchEvent("dragend", {
      card: this,
      event: event,
      dropStack: dropStack,
    });
  }

  // 드롭 애니메이션 (즉시 이동)
  animateDrop(targetStack) {
    if (!this.dragProxies || this.dragProxies.length === 0) return;
    const targetPos = targetStack.getCardPosition(targetStack.getCardCount());
    const globalTargetPos = targetStack.container.parent.toGlobal(
      new PIXI.Point(targetPos.x, targetPos.y)
    );
    this.dragProxies.forEach((proxy, index) => {
      proxy.x = globalTargetPos.x;
      proxy.y =
        globalTargetPos.y + index * CONSTANTS.STACK_OFFSET_Y * this.scale;
    });
    this.completeDrop(targetStack);
  }

  // 원래 위치로 복귀 (즉시 이동)
  animateReturn() {
    if (!this.dragProxies || this.dragProxies.length === 0) return;
    this.dragProxies.forEach((proxy, index) => {
      proxy.x = this.originalPosition.x;
      proxy.y =
        this.originalPosition.y + index * CONSTANTS.STACK_OFFSET_Y * this.scale;
    });
    this.cleanupDragProxies();
  }

  // 더블클릭 처리
  onDoubleClick() {
    if (this.faceUp) {
      this.dispatchEvent("doubleclick", { card: this });
      console.log(`카드 ${this.toString()} 더블클릭`);
    }
  }

  // 이벤트 발생
  dispatchEvent(eventType, data) {
    const event = new CustomEvent(`card${eventType}`, {
      detail: data,
    });
    document.dispatchEvent(event);
  }

  // 카드 정보 반환
  toString() {
    return `${this.rank}_${this.suit}`;
  }

  // 카드 색상 확인
  isRed() {
    return this.suit === "hearts" || this.suit === "diamonds";
  }

  isBlack() {
    return this.suit === "clubs" || this.suit === "spades";
  }

  // 카드 값 반환 (A=1, J=11, Q=12, K=13)
  getValue() {
    if (this.rank === "A") return 1;
    if (this.rank === "J") return 11;
    if (this.rank === "Q") return 12;
    if (this.rank === "K") return 13;
    return parseInt(this.rank);
  }

  // 메모리 정리
  destroy() {
    // 이벤트 리스너 제거
    this.container.removeAllListeners();

    // 컨테이너 파괴
    this.container.destroy({ children: true });

    // 참조 정리
    this.frontSprite = null;
    this.backSprite = null;
    this.currentStack = null;
  }

  // 드롭 가능한 스택 찾기
  findDropStack(globalPoint) {
    // 모든 스택들 확인
    const allStacks = [
      ...(this.currentStack?.gameController?.foundationStacks || []),
      ...(this.currentStack?.gameController?.tableauStacks || []),
    ];

    for (const stack of allStacks) {
      if (stack.containsPoint(globalPoint)) {
        return stack;
      }
    }
    return null;
  }

  // 스택에 드롭 가능한지 확인
  canDropOnStack(targetStack) {
    if (!targetStack || !this.currentStack) return false;

    // 같은 스택에는 드롭 불가
    if (targetStack === this.currentStack) return false;

    // 드롭할 카드들 결정
    let draggedCards = [this];
    if (this.currentStack.type === "tableau") {
      draggedCards = this.currentStack.getCardsFromIndex(this.stackIndex);
    }

    // 첫 번째 카드가 대상 스택에 올 수 있는지 확인
    return targetStack.canAcceptCard(draggedCards[0]);
  }

  // 드롭 완료 처리
  completeDrop(targetStack) {
    if (!this.currentStack) return;

    // 드롭할 카드들 결정
    let draggedCards = [this];
    if (this.currentStack.type === "tableau") {
      draggedCards = this.currentStack.getCardsFromIndex(this.stackIndex);
    }

    // 실제 카드 이동
    this.currentStack.gameController.handleMultiCardMove(
      draggedCards,
      this.currentStack,
      targetStack
    );

    // 프록시 정리
    this.cleanupDragProxies();
  }

  // 드래그 프록시 정리
  cleanupDragProxies() {
    if (this.dragProxies) {
      this.dragProxies.forEach((proxy) => {
        if (proxy.parent) {
          proxy.parent.removeChild(proxy);
        }
        proxy.destroy({ children: true });
      });
      this.dragProxies = [];
    }

    // 모든 원본 카드 다시 보이기
    if (this.currentStack?.type === "tableau") {
      const draggedCards = this.currentStack.getCardsFromIndex(this.stackIndex);
      draggedCards.forEach((card) => {
        card.container.visible = true;
      });
    } else {
      this.container.visible = true;
    }

    // 물리 효과 정리
    this.physics = null;
    this.physicsAnimationId = null;
  }

  // 카드 뒤집기 가능 여부 확인
  canFlip() {
    if (!this.currentStack || this.currentStack.type !== "tableau") {
      return false;
    }
    // Tableau의 맨 위 카드만 뒤집기 가능
    return this.currentStack.getTopCard() === this;
  }
}
