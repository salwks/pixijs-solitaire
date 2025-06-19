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
    // 기본 배경
    const background = new PIXI.Graphics();
    background.rect(0, 0, CONSTANTS.GAME_WIDTH, CONSTANTS.GAME_HEIGHT);
    background.fill({ color: CONSTANTS.COLORS.BACKGROUND });
    this.container.addChild(background);

    // 테이블 질감 효과
    this.addTableTexture();

    // 조명 효과
    this.addLightingEffect();

    // 카드 영역 표시를 위한 가이드라인
    this.drawCardSlots();
  }

  // 테이블 질감 추가
  addTableTexture() {
    const texture = new PIXI.Graphics();

    // 미세한 격자 패턴
    for (let x = 0; x < CONSTANTS.GAME_WIDTH; x += 20) {
      for (let y = 0; y < CONSTANTS.GAME_HEIGHT; y += 20) {
        texture.circle(x, y, 0.5);
        texture.fill({ color: 0x1a6b54, alpha: 0.3 });
      }
    }

    // 나무 결 패턴
    for (let i = 0; i < 10; i++) {
      const y = (CONSTANTS.GAME_HEIGHT / 10) * i;
      texture.moveTo(0, y);
      texture.lineTo(CONSTANTS.GAME_WIDTH, y + Math.sin(i) * 5);
      texture.stroke({ color: 0x0f4c3a, width: 1, alpha: 0.2 });
    }

    this.container.addChild(texture);
  }

  // 조명 효과 추가
  addLightingEffect() {
    const lighting = new PIXI.Graphics();

    // 중앙에서 퍼져나가는 방사형 그라데이션 효과
    const centerX = CONSTANTS.GAME_WIDTH / 2;
    const centerY = CONSTANTS.GAME_HEIGHT / 2;
    const radius = Math.max(CONSTANTS.GAME_WIDTH, CONSTANTS.GAME_HEIGHT) / 2;

    // 여러 개의 동심원으로 그라데이션 시뮬레이션
    for (let i = 0; i < 20; i++) {
      const currentRadius = (radius / 20) * (i + 1);
      const alpha = 0.1 * (1 - i / 20);

      lighting.circle(centerX, centerY, currentRadius);
      lighting.fill({ color: 0xffffff, alpha: alpha });
    }

    this.container.addChild(lighting);
  }

  drawCardSlots() {
    const slotTexture = PIXI.Assets.cache.get("empty_slot");

    // Stock Pile 위치 (좌상단)
    const stockSlot = new PIXI.Sprite(slotTexture);
    stockSlot.position.set(CONSTANTS.MARGIN, CONSTANTS.MARGIN);
    stockSlot.scale.set(CONSTANTS.CARD_SCALE);
    this.container.addChild(stockSlot);

    // Waste Pile 위치 (Stock 옆)
    const wasteSlot = new PIXI.Sprite(slotTexture);
    wasteSlot.position.set(
      CONSTANTS.MARGIN + CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE + 20,
      CONSTANTS.MARGIN
    );
    wasteSlot.scale.set(CONSTANTS.CARD_SCALE);
    this.container.addChild(wasteSlot);

    // Foundation 위치들 (우상단 4개)
    for (let i = 0; i < CONSTANTS.GAME.FOUNDATION_PILES; i++) {
      const foundationSlot = new PIXI.Sprite(slotTexture);
      foundationSlot.position.set(
        CONSTANTS.FOUNDATION_START_X +
          i * (CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE + 10),
        CONSTANTS.MARGIN
      );
      foundationSlot.scale.set(CONSTANTS.CARD_SCALE);
      this.container.addChild(foundationSlot);
    }

    // Tableau 위치들 (하단 7개)
    for (let i = 0; i < CONSTANTS.GAME.TABLEAU_COLUMNS; i++) {
      const tableauSlot = new PIXI.Sprite(slotTexture);
      tableauSlot.position.set(
        CONSTANTS.MARGIN +
          i * (CONSTANTS.CARD_WIDTH * CONSTANTS.CARD_SCALE + 10),
        CONSTANTS.TABLEAU_START_Y
      );
      tableauSlot.scale.set(CONSTANTS.CARD_SCALE);
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
}
