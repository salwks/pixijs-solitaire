// PixiJS 솔리테어 - 카드 클래스

import { CONSTANTS } from "../core/Constants.js";

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = false;
    this.isDragging = false;
    this.isSelected = false;
    this.isDraggable = true;

    // PixiJS 스프라이트들
    this.frontSprite = null;
    this.backSprite = null;
    this.container = new PIXI.Container();

    // 드래그 관련
    this.dragStart = null;
    this.originalPosition = { x: 0, y: 0 };

    // 카드 위치 및 스택 정보
    this.currentStack = null;
    this.stackIndex = 0;

    // 더블클릭 처리
    this.lastClickTime = 0;
    this.doubleClickDelay = 300;

    this.createSprites();
    this.setupInteraction();
  }

  createSprites() {
    // 앞면 스프라이트
    const frontTexture = PIXI.Assets.cache.get(`${this.rank}_${this.suit}`);
    if (frontTexture) {
      this.frontSprite = new PIXI.Sprite(frontTexture);
      this.frontSprite.scale.set(CONSTANTS.CARD_SCALE);
      this.frontSprite.visible = this.faceUp;
      this.container.addChild(this.frontSprite);
    }

    // 뒷면 스프라이트
    const backTexture = PIXI.Assets.cache.get("card_back");
    if (backTexture) {
      this.backSprite = new PIXI.Sprite(backTexture);
      this.backSprite.scale.set(CONSTANTS.CARD_SCALE);
      this.backSprite.visible = !this.faceUp;
      this.container.addChild(this.backSprite);
    }
  }

  setupInteraction() {
    this.container.interactive = true;
    this.container.cursor = "pointer";

    // 이벤트 바인딩
    this.container.on("pointerdown", this.onPointerDown.bind(this));
    this.container.on("pointermove", this.onPointerMove.bind(this));
    this.container.on("pointerup", this.onPointerUp.bind(this));
    this.container.on("pointerupoutside", this.onPointerUp.bind(this));

    // 호버 이벤트 설정
    this.setupHoverEffects();
  }

  setupHoverEffects() {
    this.container.on("pointerover", this.onHover.bind(this));
    this.container.on("pointerout", this.onHoverOut.bind(this));
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

      this.addFlipEffect();
    }

    console.log(
      `카드 ${this.toString()} ${this.faceUp ? "앞면" : "뒷면"}으로 뒤집힘`
    );
  }

  // 뒤집기 시각적 효과
  addFlipEffect() {
    this.container.tint = 0xffffaa;
    setTimeout(() => {
      this.container.tint = 0xffffff;
    }, 200);
  }

  // 카드 선택 하이라이트
  setSelected(selected) {
    this.isSelected = selected;

    if (selected) {
      // 글로우 효과 - PixiJS v8 호환
      try {
        this.container.filters = [
          new PIXI.filters.GlowFilter({
            distance: 10,
            outerStrength: 2,
            color: 0xffd700,
            quality: 0.5,
          }),
        ];
      } catch (error) {
        // 필터가 없으면 간단한 틴트 효과
        this.container.tint = 0xffff99;
      }
    } else {
      this.container.filters = [];
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

  // 호버 효과
  onHover() {
    if (this.faceUp && this.isDraggable && !this.isDragging) {
      this.container.scale.set(CONSTANTS.CARD_SCALE * 1.05);

      // 그림자 효과 - 안전한 방식
      try {
        this.container.filters = [
          new PIXI.filters.DropShadowFilter({
            distance: 5,
            angle: Math.PI / 4,
            color: 0x000000,
            alpha: 0.3,
            blur: 2,
          }),
        ];
      } catch (error) {
        // 필터가 없으면 위치 변경만
        this.container.y -= 3;
      }
    }
  }

  onHoverOut() {
    if (!this.isDragging && !this.isSelected) {
      this.container.scale.set(CONSTANTS.CARD_SCALE);
      this.container.filters = [];
      // 원래 위치로 복원 (hover에서 y 변경한 경우)
    }
  }

  // 위치 설정
  setPosition(x, y) {
    this.container.x = x;
    this.container.y = y;
  }

  getPosition() {
    return { x: this.container.x, y: this.container.y };
  }

  // 드래그 이벤트 핸들러들
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

    // 뒷면 카드나 드래그 불가 카드는 드래그 불가
    if (!this.faceUp || !this.isDraggable) {
      return;
    }

    this.isDragging = true;
    this.dragStart = event.data.global.clone();
    this.originalPosition = { x: this.container.x, y: this.container.y };

    // 드래그 시작 시각적 효과
    this.container.cursor = "grabbing";
    this.container.scale.set(CONSTANTS.CARD_SCALE * 1.1);
    this.container.alpha = 0.9;

    // 최상단으로 이동
    if (this.container.parent) {
      this.container.parent.setChildIndex(
        this.container,
        this.container.parent.children.length - 1
      );
    }

    // 드래그 시작 이벤트 발생
    this.dispatchEvent("dragstart", { card: this, event });

    console.log(`카드 ${this.toString()} 드래그 시작`);
  }

  onPointerMove(event) {
    if (this.isDragging) {
      const newPosition = event.data.global;
      this.container.x =
        this.originalPosition.x + (newPosition.x - this.dragStart.x);
      this.container.y =
        this.originalPosition.y + (newPosition.y - this.dragStart.y);

      // 드래그 중 이벤트 발생
      this.dispatchEvent("dragmove", { card: this, event });
    }
  }

  onPointerUp(event) {
    if (this.isDragging) {
      this.isDragging = false;

      // 드래그 종료 시각적 효과 복원
      this.container.cursor = "grab";
      this.container.scale.set(CONSTANTS.CARD_SCALE);
      this.container.alpha = 1.0;

      // 드래그 종료 이벤트 발생
      this.dispatchEvent("dragend", { card: this, event });

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

  // 카드 상태 정보
  getState() {
    return {
      suit: this.suit,
      rank: this.rank,
      faceUp: this.faceUp,
      isDragging: this.isDragging,
      isSelected: this.isSelected,
      isDraggable: this.isDraggable,
      position: this.getPosition(),
      stackInfo: {
        currentStack: this.currentStack?.type || null,
        stackIndex: this.stackIndex,
      },
    };
  }

  // 상태 복원
  setState(state) {
    this.faceUp = state.faceUp;
    this.isDragging = state.isDragging;
    this.isSelected = state.isSelected;
    this.isDraggable = state.isDraggable;

    this.setPosition(state.position.x, state.position.y);
    this.setSelected(state.isSelected);
    this.setDraggable(state.isDraggable);

    if (this.frontSprite && this.backSprite) {
      this.frontSprite.visible = this.faceUp;
      this.backSprite.visible = !this.faceUp;
    }
  }

  // 애니메이션 상태 확인
  isAnimating() {
    return (
      this.container.scale.x !== CONSTANTS.CARD_SCALE ||
      this.container.alpha !== 1.0 ||
      this.container.rotation !== 0
    );
  }

  // 메모리 정리
  destroy() {
    // 이벤트 리스너 제거
    this.container.removeAllListeners();

    // 필터 제거
    this.container.filters = [];

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
