// PixiJS 솔리테어 - 메인 애플리케이션

import { CONSTANTS } from "./Constants.js";
import { AssetLoader } from "./AssetLoader.js";
import { GameBoard } from "../ui/GameBoard.js";
import { GameController } from "../game/GameController.js";
import { ToastUI } from "../ui/ToastUI.js";

export class GameApplication {
  constructor() {
    this.app = null;
    this.assetLoader = null;
    this.gameBoard = null;
    this.gameController = null;
    this.toastUI = null;
    this.isLoaded = false;
  }

  async init() {
    try {
      console.log("PixiJS 솔리테어 게임 초기화 시작...");

      // 화면 크기 가져오기
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // PixiJS 애플리케이션 생성
      this.app = new PIXI.Application();

      // v8 스타일 초기화 - fullscreen
      await this.app.init({
        width: screenWidth,
        height: screenHeight,
        backgroundColor: CONSTANTS.COLORS.BACKGROUND,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window, // 자동 resize 설정
      });

      // 캔버스를 DOM에 추가
      const gameContainer = document.getElementById("gameContainer");
      gameContainer.appendChild(this.app.canvas);
      this.app.canvas.id = "gameCanvas";

      // 전역에서 접근 가능하도록 설정
      window.PIXI_APP = this.app;

      // 로딩 텍스트 업데이트
      document.getElementById("loading").textContent = "에셋 로딩 중...";

      // 에셋 로더 초기화 및 로딩
      this.assetLoader = new AssetLoader(this.app);
      const assetsLoaded = await this.assetLoader.loadAssets();

      if (!assetsLoaded) {
        throw new Error("에셋 로딩 실패");
      }

      // 게임보드 초기화
      document.getElementById("loading").textContent = "게임판 설정 중...";
      this.gameBoard = new GameBoard(this.app);
      await this.gameBoard.init();

      // 게임 컨트롤러 초기화
      document.getElementById("loading").textContent =
        "게임 시스템 초기화 중...";
      this.gameController = new GameController(this.app, this.gameBoard);
      this.gameBoard.setGameController(this.gameController);

      // 토스트 UI 초기화
      this.toastUI = new ToastUI(this.app);
      this.gameController.setToastUI(this.toastUI);

      // UI 이벤트 설정
      this.setupUI();

      // Resize 이벤트 설정
      this.setupResizeHandler();

      // 로딩 완료
      document.getElementById("loading").style.display = "none";

      this.isLoaded = true;
      console.log("PixiJS 솔리테어 게임이 성공적으로 로드되었습니다!");
    } catch (error) {
      console.error("게임 초기화 중 오류:", error);
      document.getElementById("loading").textContent =
        "로딩 중 오류가 발생했습니다: " + error.message;
    }
  }

  setupUI() {
    // 새 게임 버튼
    document.getElementById("newGameBtn").addEventListener("click", () => {
      if (this.gameController) {
        this.gameController.newGame();
      }
    });

    // 되돌리기 버튼
    document.getElementById("undoBtn").addEventListener("click", () => {
      if (this.gameController) {
        this.gameController.undoLastMove();
      }
    });

    // 힌트 버튼
    document.getElementById("hintBtn").addEventListener("click", () => {
      if (this.gameController) {
        this.gameController.showHint();
      }
    });
  }

  setupResizeHandler() {
    let resizeTimeout;
    let isResizing = false;

    // 화면 크기 변경 시 게임보드와 카드 크기 조정
    window.addEventListener("resize", () => {
      if (this.gameBoard && this.gameController) {
        // 리사이즈 시작 시 게임 일시정지
        if (!isResizing) {
          isResizing = true;

          // 게임이 진행 중이면 일시정지
          if (this.gameController.gameState.isPlaying()) {
            this.gameController.gameState.isPaused = true;
            console.log("리사이즈 중: 게임 일시정지");
          }
        }

        // 기존 타이머 클리어
        clearTimeout(resizeTimeout);

        // 리사이즈 완료 후 실행할 작업
        resizeTimeout = setTimeout(() => {
          isResizing = false;

          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;

          // 게임보드 resize
          this.gameBoard.resize(newWidth, newHeight);

          // 토스트 UI resize
          if (this.toastUI) {
            this.toastUI.resize(newWidth, newHeight);
          }

          // 게임 재개
          if (this.gameController.gameState.isPaused) {
            this.gameController.gameState.isPaused = false;
            console.log("리사이즈 완료: 게임 재개");
          }
        }, 300); // 300ms 후 리사이즈 완료로 간주
      }
    });
  }

  // 게임 상태 확인
  isReady() {
    return (
      this.isLoaded &&
      this.gameBoard &&
      this.gameBoard.isInitialized() &&
      this.gameController
    );
  }

  // 애플리케이션 정리
  destroy() {
    if (this.gameController) {
      this.gameController.destroy();
    }
    if (this.app) {
      this.app.destroy(true, true);
    }
  }
}
