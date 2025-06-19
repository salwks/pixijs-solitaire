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
    // 앞면 스프라이트
    const frontTexture = PIXI.Assets.cache.get(`${this.rank}_${this.suit}`);
    if (frontTexture) {
      this.frontSprite = new PIXI.Sprite(frontTexture);
      this.frontSprite.scale.set(CONSTANTS.CARD_SCALE * this.scale);
      this.frontSprite.visible = this.faceUp;
      this.container.addChild(this.frontSprite);
    }

    // 뒷면 스프라이트
    const backTexture = PIXI.Assets.cache.get("card_back");
    if (backTexture) {
      this.backSprite = new PIXI.Sprite(backTexture);
      this.backSprite.scale.set(CONSTANTS.CARD_SCALE * this.scale);
      this.backSprite.visible = !this.faceUp;
      this.container.addChild(this.backSprite);
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
    this.container.x = x;
    this.container.y = y;
  }

  // 카드 스케일 설정
  setScale(scale) {
    this.scale = scale;
    if (this.frontSprite) {
      this.frontSprite.scale.set(CONSTANTS.CARD_SCALE * scale);
    }
    if (this.backSprite) {
      this.backSprite.scale.set(CONSTANTS.CARD_SCALE * scale);
    }
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

    // Stock 카드 클릭 처리
    if (this.currentStack?.type === "stock") {
      this.handleStockClick();
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

  // Stock 클릭 처리
  handleStockClick() {
    this.dispatchEvent("stockclicked", { card: this });
  }

  // 카드 뒤집기 가능 여부 확인
  canFlip() {
    if (!this.currentStack || this.currentStack.type !== "tableau") {
      return false;
    }
    // Tableau의 맨 위 카드만 뒤집기 가능
    return this.currentStack.getTopCard() === this;
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

    if (card.faceUp && card.frontSprite) {
      const front = new PIXI.Sprite(card.frontSprite.texture);
      front.scale.set(card.frontSprite.scale.x, card.frontSprite.scale.y);
      proxy.addChild(front);
    } else if (card.backSprite) {
      const back = new PIXI.Sprite(card.backSprite.texture);
      back.scale.set(card.backSprite.scale.x, card.backSprite.scale.y);
      proxy.addChild(back);
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

      console.log(
        `[onPointerMove] ${this.dragProxies.length}개 프록시 이동:`,
        this.dragProxies[0].x,
        this.dragProxies[0].y,
        "마우스:",
        mousePos,
        "오프셋:",
        this.dragOffset
      );

      this.dispatchEvent("dragmove", {
        card: this,
        event: event,
        deltaX: mousePos.x - this.dragStart.x,
        deltaY: mousePos.y - this.dragStart.y,
      });
    }
  }

  // 드래그 종료
  onPointerUp(event) {
    if (this.isDragging) {
      console.log(`[onPointerUp] 드래그 종료`);
      this.isDragging = false;

      // 모든 프록시 제거
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
        const draggedCards = this.currentStack.getCardsFromIndex(
          this.stackIndex
        );
        draggedCards.forEach((card) => {
          card.container.visible = true;
        });
      } else {
        this.container.visible = true;
      }

      this.container.cursor = "grab";
      this.container.alpha = 1.0;
      this.dispatchEvent("dragend", { card: this, event: event });
      console.log(`카드 ${this.toString()} 드래그 종료`);
    }
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

    // 부모에서 제거
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }

    // 컨테이너 파괴
    this.container.destroy({ children: true });

    // 참조 정리
    this.frontSprite = null;
    this.backSprite = null;
    this.currentStack = null;
  }
}
