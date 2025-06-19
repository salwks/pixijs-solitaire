// PixiJS 솔리테어 - 게임보드

import { CONSTANTS } from "../core/Constants.js";

export class GameBoard {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // 게임 영역들
    this.stockPile = null;
    this.wastePile = null;
    this.foundations = [];
    this.tableaus = [];
    this.initialized = false;

    // 현재 화면 크기
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.scale = Math.min(this.screenWidth / 1024, this.screenHeight / 720);
  }

  async init() {
    console.log("게임보드 초기화 시작...");

    this.setupBackground();
    this.setupGameAreas();
    this.setupCards();

    this.initialized = true;
    console.log("게임보드 초기화 완료");
  }

  setupBackground() {
    // 기본 배경 - fullscreen
    const background = new PIXI.Graphics();
    background.rect(0, 0, this.screenWidth, this.screenHeight);
    background.fill({ color: CONSTANTS.COLORS.BACKGROUND });
    this.container.addChild(background);

    // 조명 효과 (그라데이션)
    this.addLightingGradient();

    // 테이블 질감 효과
    this.addTableTexture();

    // 카드 영역 표시를 위한 가이드라인
    this.drawCardSlots();
  }

  // 조명 그라데이션 효과 추가
  addLightingGradient() {
    // 캔버스에 그라데이션 생성
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = this.screenWidth;
    canvas.height = this.screenHeight;

    // 방사형 그라데이션 생성
    const gradient = ctx.createRadialGradient(
      this.screenWidth / 2,
      this.screenHeight / 2,
      0,
      this.screenWidth / 2,
      this.screenHeight / 2,
      Math.max(this.screenWidth, this.screenHeight) * 0.5
    );

    gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.08)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.03)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    // 그라데이션 그리기
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // 캔버스를 텍스처로 변환
    const texture = PIXI.Texture.from(canvas);
    const lighting = new PIXI.Sprite(texture);

    this.container.addChild(lighting);
  }

  // 테이블 질감 추가
  addTableTexture() {
    const texture = new PIXI.Graphics();

    // 미세한 격자 패턴
    for (let x = 0; x < this.screenWidth; x += 20 * this.scale) {
      for (let y = 0; y < this.screenHeight; y += 20 * this.scale) {
        texture.circle(x, y, 0.5 * this.scale);
        texture.fill({ color: 0x1a6b54, alpha: 0.3 });
      }
    }

    // 나무 결 패턴
    for (let i = 0; i < 10; i++) {
      const y = (this.screenHeight / 10) * i;
      texture.moveTo(0, y);
      texture.lineTo(this.screenWidth, y + Math.sin(i) * 5 * this.scale);
      texture.stroke({ color: 0x0f4c3a, width: 1 * this.scale, alpha: 0.2 });
    }

    this.container.addChild(texture);
  }

  drawCardSlots() {
    const margin = CONSTANTS.MARGIN * this.scale;
    const cardWidth = CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE * this.scale;
    const cardHeight =
      CONSTANTS.CARD_HEIGHT * CONSTANTS.CARD_SCALE * this.scale;
    const gap = 10 * this.scale;
    const cornerRadius = 8 * this.scale; // 카드와 동일한 모서리 둥글기

    // 패널을 그리는 함수
    const createSlot = (x, y) => {
      const slot = new PIXI.Graphics();
      slot.roundRect(0, 0, cardWidth, cardHeight, cornerRadius);
      slot.fill({ color: CONSTANTS.COLORS.EMPTY_SLOT, alpha: 0.3 });
      // 테두리 라인 제거
      slot.position.set(x, y);
      return slot;
    };

    // Stock Pile 위치 (좌하단)
    const stockSlot = createSlot(
      margin,
      this.screenHeight - margin - cardHeight
    );
    this.container.addChild(stockSlot);

    // Waste Pile 위치 (Stock 옆, 좌하단)
    const wasteSlot = createSlot(
      margin + cardWidth + gap,
      this.screenHeight - margin - cardHeight
    );
    this.container.addChild(wasteSlot);

    // Foundation 위치들 (우하단 4개)
    const foundationStartX = this.screenWidth - margin - (cardWidth + gap) * 4;
    for (let i = 0; i < CONSTANTS.GAME.FOUNDATION_PILES; i++) {
      const foundationSlot = createSlot(
        foundationStartX + i * (cardWidth + gap),
        this.screenHeight - margin - cardHeight
      );
      this.container.addChild(foundationSlot);
    }

    // Tableau 위치들 (상단 중앙 7개)
    const tableauTotalWidth = cardWidth * 7 + gap * 6;
    const tableauStartX = (this.screenWidth - tableauTotalWidth) / 2;
    const tableauStartY = margin;

    for (let i = 0; i < CONSTANTS.GAME.TABLEAU_COLUMNS; i++) {
      const tableauSlot = createSlot(
        tableauStartX + i * (cardWidth + gap),
        tableauStartY
      );
      this.container.addChild(tableauSlot);
    }
  }

  setupGameAreas() {
    // 각 게임 영역 초기화 (나중에 CardStack 클래스로 대체)
    console.log("게임 영역 설정 완료");
  }

  setupCards() {
    // 게임 컨트롤러가 카드를 관리하므로 더 이상 샘플 카드를 생성하지 않음
    console.log("게임보드 카드 영역 준비 완료");
  }

  // 게임 컨트롤러 설정
  setGameController(gameController) {
    this.gameController = gameController;
    console.log("게임 컨트롤러가 게임보드에 연결되었습니다.");
  }

  newGame() {
    if (this.gameController) {
      this.gameController.newGame();
    } else {
      console.log("게임 컨트롤러가 연결되지 않았습니다.");
    }
  }

  isInitialized() {
    return this.initialized;
  }

  // 화면 크기 변경 시 호출
  resize(width, height) {
    try {
      // 유효한 크기인지 확인
      if (!width || !height || width < 800 || height < 600) {
        console.warn("유효하지 않은 화면 크기:", width, height);
        return;
      }

      console.log(`게임보드 리사이즈: ${width}x${height}`);

      this.screenWidth = width;
      this.screenHeight = height;
      this.scale = Math.min(width / 1024, height / 720);

      // 스케일이 너무 작거나 큰 경우 제한
      this.scale = Math.max(0.5, Math.min(this.scale, 2.0));

      // 기존 배경 제거
      if (this.container && this.container.children) {
        this.container.removeChildren();
      }

      // 새로운 배경 설정
      this.setupBackground();

      console.log(`게임보드 리사이즈 완료. 스케일: ${this.scale}`);
    } catch (error) {
      console.error("게임보드 리사이즈 중 오류:", error);
      // 에러 발생 시 기본값으로 복구
      this.screenWidth = window.innerWidth;
      this.screenHeight = window.innerHeight;
      this.scale = Math.min(this.screenWidth / 1024, this.screenHeight / 720);
    }
  }

  // 현재 스케일 반환
  getScale() {
    return this.scale;
  }
}
