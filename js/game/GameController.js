// PixiJS 솔리테어 - 게임 컨트롤러 (수정됨)

import { CONSTANTS } from "../core/Constants.js";
import { Deck } from "../entities/Deck.js";
import { CardStack } from "../entities/CardStack.js";
import { GameState } from "./GameState.js";
import { GameLogic } from "./GameLogic.js";
import { InputHandler } from "../utils/InputHandler.js";
import { CardAnimation } from "../utils/CardAnimation.js";
import { UIAnimation } from "../utils/UIAnimation.js";
import { ScoreUI } from "../ui/ScoreUI.js";
import { MenuUI } from "../ui/MenuUI.js";

export class GameController {
  constructor(app, gameBoard) {
    this.app = app;
    this.gameBoard = gameBoard;

    // 게임 시스템들
    this.gameState = new GameState();
    this.gameLogic = new GameLogic(this.gameState);
    this.inputHandler = new InputHandler(app, gameBoard);
    this.cardAnimation = new CardAnimation(app);
    this.uiAnimation = new UIAnimation(app);
    this.scoreUI = new ScoreUI(this.gameState, this.uiAnimation);
    this.menuUI = new MenuUI(this);

    // 게임 요소들
    this.deck = null;
    this.stockStack = null;
    this.wasteStack = null;
    this.foundationStacks = [];
    this.tableauStacks = [];

    // 상태
    this.isInitialized = false;
    this.currentHint = null;

    this.init();
  }

  async init() {
    console.log("게임 컨트롤러 초기화 시작...");

    // 게임 스택들 생성
    this.createGameStacks();

    // InputHandler에 GameController 참조 설정
    this.inputHandler.setGameController(this);

    // 통계 로드
    this.gameState.loadStats();

    // UI 초기화
    this.scoreUI.updateAll();
    this.menuUI.init();

    // 첫 게임 시작
    await this.newGame();

    this.isInitialized = true;
    console.log("게임 컨트롤러 초기화 완료");
  }

  // 게임 스택들 생성
  createGameStacks() {
    // 화면 크기에 맞는 스케일 계산
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const globalScale = Math.min(screenWidth / 1024, screenHeight / 720);

    // Stock & Waste 스택
    this.stockStack = new CardStack("stock", 0, globalScale);
    this.wasteStack = new CardStack("waste", 0, globalScale);

    // Foundation 스택들 (4개)
    this.foundationStacks = [];
    for (let i = 0; i < CONSTANTS.GAME.FOUNDATION_PILES; i++) {
      this.foundationStacks.push(new CardStack("foundation", i, globalScale));
    }

    // Tableau 스택들 (7개)
    this.tableauStacks = [];
    for (let i = 0; i < CONSTANTS.GAME.TABLEAU_COLUMNS; i++) {
      this.tableauStacks.push(new CardStack("tableau", i, globalScale));
    }

    // 게임보드에 스택들 추가
    this.gameBoard.container.addChild(this.stockStack.container);
    this.gameBoard.container.addChild(this.wasteStack.container);

    this.foundationStacks.forEach((stack) => {
      this.gameBoard.container.addChild(stack.container);
    });

    this.tableauStacks.forEach((stack) => {
      this.gameBoard.container.addChild(stack.container);
    });
  }

  // 새 게임 시작
  async newGame() {
    console.log("새 게임 시작...");

    // 기존 게임 정리
    this.clearGame();

    // 게임 상태 초기화
    this.gameState.reset();

    // 새 덱 생성 및 셔플
    this.deck = new Deck();
    this.deck.shuffle();

    // 카드 딜링
    const dealResult = this.deck.dealForSolitaire();

    // 카드들을 해당 스택에 배치
    await this.dealCards(dealResult);

    // 게임 시작
    this.gameState.startGame();

    // 힌트 초기화
    this.currentHint = null;

    console.log("새 게임 시작 완료");
    this.dispatchGameStateChanged();
  }

  // 카드 딜링
  async dealCards(dealResult) {
    // Stock 카드들
    dealResult.stock.forEach((card) => {
      this.stockStack.addCard(card);
    });

    // Tableau 카드들
    dealResult.tableau.forEach((columnCards, columnIndex) => {
      columnCards.forEach((card) => {
        this.tableauStacks[columnIndex].addCard(card);
      });
    });
  }

  // 기존 게임 정리
  clearGame() {
    // 기존 덱 정리
    if (this.deck) {
      this.deck.destroy();
      this.deck = null;
    }

    // 모든 스택에서 카드 제거
    [...this.getAllStacks()].forEach((stack) => {
      const cards = [...stack.cards];
      cards.forEach((card) => {
        stack.removeCard(card);
        card.destroy();
      });
    });

    // 힌트 제거
    this.clearHint();
  }

  // 모든 스택 반환
  getAllStacks() {
    return [
      this.stockStack,
      this.wasteStack,
      ...this.foundationStacks,
      ...this.tableauStacks,
    ];
  }

  // 모든 스택들의 스케일 업데이트
  updateStacksScale(scale) {
    if (this.stockStack) this.stockStack.setScale(scale);
    if (this.wasteStack) this.wasteStack.setScale(scale);

    this.foundationStacks.forEach((stack) => {
      stack.setScale(scale);
    });

    this.tableauStacks.forEach((stack) => {
      stack.setScale(scale);
    });
  }

  // Stock 클릭 처리
  handleStockClick() {
    if (!this.gameState.isPlaying()) return;

    const drawnCards = this.gameLogic.drawFromStock(
      this.stockStack,
      this.wasteStack
    );

    if (drawnCards.length > 0) {
      // 카드 이동 애니메이션
      this.animateStockDraw(drawnCards);
    }

    this.dispatchGameStateChanged();
  }

  // Stock 카드 뽑기 애니메이션
  async animateStockDraw(drawnCards) {
    for (const card of drawnCards) {
      await this.cardAnimation.animateCardMove(
        card,
        card.container.x,
        card.container.y,
        CONSTANTS.ANIMATION.DURATION * 0.5
      );
    }
  }

  // 단일 카드 이동 처리
  handleCardMove(card, fromStack, toStack) {
    if (!this.gameState.isPlaying()) return false;

    const moveData = {
      card: card,
      fromStack: fromStack,
      toStack: toStack,
    };

    if (this.gameLogic.executeSingleCardMove(card, fromStack, toStack)) {
      // 성공적인 이동
      this.onSuccessfulMove(card, toStack);
      return true;
    } else {
      // 실패한 이동
      this.onFailedMove(card);
      return false;
    }
  }

  // 다중 카드 이동 처리
  handleMultiCardMove(cards, fromStack, toStack) {
    if (!this.gameState.isPlaying()) return false;

    if (this.gameLogic.executeMultiCardMove(cards, fromStack, toStack)) {
      // 성공적인 이동
      this.onSuccessfulMove(cards[0], toStack);
      return true;
    } else {
      // 실패한 이동
      this.onFailedMove(cards[0]);
      return false;
    }
  }

  // 카드 뒤집기 처리
  onCardFlipped(card) {
    // 점수 업데이트
    this.gameState.updateScore();

    // 이동 기록
    this.gameState.recordMove({
      type: "card_flip",
      card: card.toString(),
    });

    this.dispatchGameStateChanged();
  }

  // 성공적인 이동 처리
  async onSuccessfulMove(card, toStack) {
    // 자동으로 뒤집을 수 있는 카드 확인
    const cardsToFlip = this.gameLogic.findCardsToFlip(this.tableauStacks);
    for (const cardToFlip of cardsToFlip) {
      await this.cardAnimation.animateCardFlip(cardToFlip, true);

      this.gameState.recordMove({
        type: "card_flip",
        card: cardToFlip.toString(),
      });
    }

    // 점수 업데이트
    if (toStack.type === "foundation") {
      this.gameState.addToFoundation(card);
    }

    // 게임 완료 확인
    if (this.gameLogic.isGameComplete(this.foundationStacks)) {
      this.onGameComplete();
    }

    this.dispatchGameStateChanged();
  }

  // 실패한 이동 처리
  async onFailedMove(card) {
    // 무효한 이동 애니메이션
    await this.cardAnimation.animateInvalidMove(card);
  }

  // 게임 완료 처리
  async onGameComplete() {
    console.log("게임 완료!");

    // 승리 애니메이션
    await this.uiAnimation.animateVictory(this.foundationStacks);

    // 게임 상태 업데이트
    this.gameState.completeGame();

    // 완료 UI 표시
    this.scoreUI.showGameComplete();
  }

  // 되돌리기
  undoLastMove() {
    if (!this.gameState.canUndo()) return false;

    const lastMove = this.gameState.undoLastMove();
    if (lastMove) {
      // 실제 이동 되돌리기 실행
      this.gameLogic.undoMove(lastMove);

      console.log("이동을 되돌렸습니다.");
      this.dispatchGameStateChanged();
      return true;
    }

    return false;
  }

  // 힌트 표시
  showHint() {
    if (!this.gameState.isPlaying() || !this.gameState.settings.hintEnabled) {
      if (this.toastUI) {
        this.toastUI.showToast(
          "게임이 진행 중이 아니거나 힌트가 비활성화되어 있습니다.",
          5000
        );
      }
      return;
    }

    // 기존 힌트 제거
    this.clearHint();

    // 새 힌트 찾기
    const bestMove = this.gameLogic.suggestBestMove(this.getAllStacks());

    if (bestMove) {
      this.currentHint = bestMove;

      if (bestMove.type === "draw_stock") {
        // Stock 클릭 힌트
        const message = "💡 힌트: Stock을 클릭하여 카드를 뽑으세요.";
        console.log("힌트: Stock을 클릭하여 카드를 뽑으세요.");

        if (this.toastUI) {
          this.toastUI.showToast(message, 5000);
        }

        // Stock 스택 하이라이트
        this.stockStack.onDropZoneEnter();
        setTimeout(() => {
          this.stockStack.onDropZoneLeave();
        }, 2000);
      } else if (bestMove.card) {
        // 카드 이동 힌트
        this.cardAnimation.animateHint(bestMove.card);
        const message = `💡 힌트: ${bestMove.card.toString()}를 ${
          bestMove.toStack?.type || ""
        }로 이동하세요.`;
        console.log(message);

        if (this.toastUI) {
          this.toastUI.showToast(message, 5000);
        }
      }
    } else {
      const message = "💡 사용 가능한 힌트가 없습니다.";
      console.log("사용 가능한 힌트가 없습니다.");

      if (this.toastUI) {
        this.toastUI.showToast(message, 5000);
      }
    }
  }

  // 힌트 제거
  clearHint() {
    if (this.currentHint) {
      // 힌트 애니메이션 중지
      if (this.currentHint.card) {
        this.currentHint.card.container.tint = 0xffffff;
      }
      this.currentHint = null;
    }
  }

  // 자동 완성
  autoComplete() {
    if (!this.gameState.settings.autoComplete || !this.gameState.isPlaying()) {
      return false;
    }

    const executed = this.gameLogic.executeAutoComplete(this.getAllStacks());

    if (executed) {
      console.log("자동 완성이 실행되었습니다.");
      this.dispatchGameStateChanged();
    }

    return executed;
  }

  // 게임 일시정지/재개
  togglePause() {
    this.gameState.togglePause();

    if (this.gameState.isPaused) {
      this.scoreUI.showPauseOverlay();
      this.inputHandler.setEnabled(false);
    } else {
      this.scoreUI.hidePauseOverlay();
      this.inputHandler.setEnabled(true);
    }

    this.dispatchGameStateChanged();
  }

  // 게임 재시작 (같은 덱으로)
  restartGame() {
    if (this.deck) {
      // 덱을 원래 순서로 리셋
      this.deck.reset();

      // 기존 게임 정리
      this.clearGame();

      // 같은 덱으로 다시 딜링
      this.deck.shuffle(); // 같은 패턴을 원하면 이 라인 제거
      const dealResult = this.deck.dealForSolitaire();
      this.dealCards(dealResult);

      // 게임 상태 초기화
      this.gameState.reset();
      this.gameState.startGame();

      this.dispatchGameStateChanged();
    }
  }

  // 게임 상태 변경 이벤트 발생
  dispatchGameStateChanged() {
    const event = new CustomEvent("gameStateChanged", {
      detail: this.gameState.getGameInfo(),
    });
    document.dispatchEvent(event);
  }

  // 게임 정보 반환
  getGameInfo() {
    return {
      gameState: this.gameState.getGameInfo(),
      stats: this.gameState.getDetailedStats(),
      stacks: this.getAllStacks().map((stack) => stack.getInfo()),
      hints: this.gameLogic.findHints(this.getAllStacks()).length,
    };
  }

  // 디버그 정보
  debug() {
    console.log("=== 게임 컨트롤러 상태 ===");
    console.log("초기화됨:", this.isInitialized);
    this.gameState.debug();

    console.log("스택 정보:");
    this.getAllStacks().forEach((stack) => {
      console.log(`${stack.type}:`, stack.getInfo());
    });

    const analysis = this.gameLogic.analyzeGame(this.getAllStacks());
    console.log("게임 분석:", analysis);
    console.log("======================");
  }

  // 메모리 정리
  destroy() {
    // 게임 정리
    this.clearGame();

    // 시스템들 정리
    if (this.inputHandler) this.inputHandler.destroy();
    if (this.cardAnimation) this.cardAnimation.destroy();
    if (this.uiAnimation) this.uiAnimation.destroy();
    if (this.scoreUI) this.scoreUI.destroy();
    if (this.menuUI) this.menuUI.destroy();

    // 스택들 정리
    this.getAllStacks().forEach((stack) => stack.destroy());

    console.log("게임 컨트롤러가 정리되었습니다.");
  }

  // 토스트 UI 설정
  setToastUI(toastUI) {
    this.toastUI = toastUI;
  }
}
