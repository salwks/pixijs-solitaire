// PixiJS 솔리테어 - 게임 상태 관리

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "../utils/Utils.js";

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // 게임 기본 정보
    this.isGameStarted = false;
    this.isGameCompleted = false;
    this.isPaused = false;

    // 시간 관리
    this.startTime = null;
    this.currentTime = 0;
    this.pausedTime = 0;

    // 점수 시스템
    this.score = 0;
    this.moves = 0;
    this.foundationCards = 0;

    // 이동 기록 (되돌리기용)
    this.moveHistory = [];
    this.maxHistorySize = 100;

    // 통계
    this.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalTime: 0,
      totalMoves: 0,
      bestTime: null,
      bestScore: 0,
    };

    // 게임 설정
    this.settings = {
      drawCount: 3, // Stock에서 한 번에 뽑는 카드 수 (1 or 3)
      allowUndo: true,
      showTimer: true,
      autoComplete: true,
      hintEnabled: true,
    };

    console.log("게임 상태가 초기화되었습니다.");
  }

  // 게임 시작
  startGame() {
    if (this.isGameStarted) return;

    this.isGameStarted = true;
    this.startTime = Date.now();
    this.currentTime = 0;
    this.pausedTime = 0;

    console.log("게임이 시작되었습니다.");
    this.updateUI();
  }

  // 게임 완료
  completeGame() {
    if (this.isGameCompleted) return;

    this.isGameCompleted = true;
    this.isGameStarted = false;

    // 최종 점수 계산
    this.score = Utils.calculateScore(
      this.moves,
      this.currentTime,
      this.foundationCards
    );

    // 통계 업데이트
    this.updateStats(true);

    console.log(
      `게임 완료! 점수: ${this.score}, 시간: ${Utils.formatTime(
        this.currentTime
      )}, 이동: ${this.moves}`
    );
    this.updateUI();
  }

  // 게임 일시정지/재개
  togglePause() {
    if (!this.isGameStarted || this.isGameCompleted) return;

    if (this.isPaused) {
      // 재개
      this.isPaused = false;
      this.pausedTime += Date.now() - this.pauseStartTime;
      console.log("게임 재개");
    } else {
      // 일시정지
      this.isPaused = true;
      this.pauseStartTime = Date.now();
      console.log("게임 일시정지");
    }

    this.updateUI();
  }

  // 시간 업데이트
  updateTime() {
    if (!this.isGameStarted || this.isPaused || this.isGameCompleted) return;

    const now = Date.now();
    this.currentTime = Math.floor(
      (now - this.startTime - this.pausedTime) / 1000
    );
    this.updateUI();
  }

  // 이동 기록
  recordMove(moveData) {
    if (!this.isGameStarted) return;

    this.moves++;

    // 이동 히스토리에 추가
    this.moveHistory.push({
      ...moveData,
      timestamp: Date.now(),
      moveNumber: this.moves,
    });

    // 히스토리 크기 제한
    if (this.moveHistory.length > this.maxHistorySize) {
      this.moveHistory.shift();
    }

    console.log(`이동 ${this.moves}: ${moveData.type}`);
    this.updateUI();
  }

  // 되돌리기
  undoLastMove() {
    if (!this.settings.allowUndo || this.moveHistory.length === 0) {
      console.log("되돌릴 수 있는 이동이 없습니다.");
      return null;
    }

    const lastMove = this.moveHistory.pop();
    this.moves = Math.max(0, this.moves - 1);

    console.log(`이동 되돌리기: ${lastMove.type}`);
    this.updateUI();

    return lastMove;
  }

  // Foundation에 카드 추가
  addToFoundation(card) {
    this.foundationCards++;

    // Foundation 완성 체크 (13장)
    if (this.foundationCards === CONSTANTS.GAME.TOTAL_CARDS) {
      this.completeGame();
      return true; // 게임 완료
    }

    this.updateScore();
    return false; // 게임 계속
  }

  // Foundation에서 카드 제거
  removeFromFoundation(card) {
    this.foundationCards = Math.max(0, this.foundationCards - 1);
    this.updateScore();
  }

  // 점수 업데이트
  updateScore() {
    if (!this.isGameStarted) return;

    this.score = Utils.calculateScore(
      this.moves,
      this.currentTime,
      this.foundationCards
    );
    this.updateUI();
  }

  // 통계 업데이트
  updateStats(gameWon = false) {
    this.stats.gamesPlayed++;
    this.stats.totalTime += this.currentTime;
    this.stats.totalMoves += this.moves;

    if (gameWon) {
      this.stats.gamesWon++;

      // 최고 기록 업데이트
      if (!this.stats.bestTime || this.currentTime < this.stats.bestTime) {
        this.stats.bestTime = this.currentTime;
      }

      if (this.score > this.stats.bestScore) {
        this.stats.bestScore = this.score;
      }
    }

    // 로컬 스토리지에 저장
    this.saveStats();
  }

  // 통계 저장
  saveStats() {
    try {
      localStorage.setItem("solitaire_stats", JSON.stringify(this.stats));
      localStorage.setItem("solitaire_settings", JSON.stringify(this.settings));
    } catch (error) {
      console.warn("통계 저장 실패:", error);
    }
  }

  // 통계 로드
  loadStats() {
    try {
      const savedStats = localStorage.getItem("solitaire_stats");
      if (savedStats) {
        this.stats = { ...this.stats, ...JSON.parse(savedStats) };
      }

      const savedSettings = localStorage.getItem("solitaire_settings");
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }

      console.log("저장된 통계를 불러왔습니다.");
    } catch (error) {
      console.warn("통계 로드 실패:", error);
    }
  }

  // UI 업데이트
  updateUI() {
    // 점수 업데이트
    const scoreElement = document.getElementById("score");
    if (scoreElement) {
      scoreElement.textContent = this.score;
    }

    // 시간 업데이트
    const timerElement = document.getElementById("timer");
    if (timerElement && this.settings.showTimer) {
      timerElement.textContent = Utils.formatTime(this.currentTime);
    }

    // 되돌리기 버튼 상태
    const undoButton = document.getElementById("undoBtn");
    if (undoButton) {
      undoButton.disabled = !this.canUndo();
    }
  }

  // 게임 상태 확인 메서드들
  canUndo() {
    return (
      this.settings.allowUndo &&
      this.moveHistory.length > 0 &&
      this.isGameStarted &&
      !this.isGameCompleted
    );
  }

  isPlaying() {
    return this.isGameStarted && !this.isPaused && !this.isGameCompleted;
  }

  getProgress() {
    return this.foundationCards / CONSTANTS.GAME.TOTAL_CARDS;
  }

  getWinRate() {
    return this.stats.gamesPlayed > 0
      ? ((this.stats.gamesWon / this.stats.gamesPlayed) * 100).toFixed(1)
      : 0;
  }

  getAverageTime() {
    return this.stats.gamesWon > 0
      ? Math.floor(this.stats.totalTime / this.stats.gamesWon)
      : 0;
  }

  // 설정 변경
  updateSetting(key, value) {
    if (key in this.settings) {
      this.settings[key] = value;
      this.saveStats();
      console.log(`설정 변경: ${key} = ${value}`);
    }
  }

  // 게임 상태 정보 반환
  getGameInfo() {
    return {
      isStarted: this.isGameStarted,
      isCompleted: this.isGameCompleted,
      isPaused: this.isPaused,
      score: this.score,
      moves: this.moves,
      time: this.currentTime,
      foundationCards: this.foundationCards,
      progress: this.getProgress(),
      canUndo: this.canUndo(),
    };
  }

  // 상세 통계 반환
  getDetailedStats() {
    return {
      ...this.stats,
      winRate: this.getWinRate(),
      averageTime: this.getAverageTime(),
      currentStreak: this.calculateCurrentStreak(),
    };
  }

  // 현재 연승 계산
  calculateCurrentStreak() {
    // TODO: 연승 기록 구현
    return 0;
  }

  // 디버그 정보
  debug() {
    console.log("=== 게임 상태 ===");
    console.log("진행중:", this.isPlaying());
    console.log("점수:", this.score);
    console.log("이동:", this.moves);
    console.log("시간:", Utils.formatTime(this.currentTime));
    console.log("Foundation 카드:", this.foundationCards);
    console.log("진행률:", (this.getProgress() * 100).toFixed(1) + "%");
    console.log("================");
  }

  // 게임 상태 저장
  saveGameState() {
    if (!this.isGameStarted || this.isGameCompleted) return null;

    const gameState = {
      // 기본 게임 정보
      isGameStarted: this.isGameStarted,
      isGameCompleted: this.isGameCompleted,
      isPaused: this.isPaused,

      // 시간 정보
      startTime: this.startTime,
      currentTime: this.currentTime,
      pausedTime: this.pausedTime,
      pauseStartTime: this.pauseStartTime,

      // 게임 진행 정보
      score: this.score,
      moves: this.moves,
      foundationCards: this.foundationCards,

      // 이동 기록
      moveHistory: [...this.moveHistory],

      // 설정
      settings: { ...this.settings },

      // 저장 시간
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem("solitaire_game_state", JSON.stringify(gameState));
      console.log("게임 상태가 저장되었습니다.");
      return gameState;
    } catch (error) {
      console.error("게임 상태 저장 실패:", error);
      return null;
    }
  }

  // 게임 상태 복원
  loadGameState() {
    try {
      const savedState = localStorage.getItem("solitaire_game_state");
      if (!savedState) return false;

      const gameState = JSON.parse(savedState);

      // 저장된 상태가 너무 오래된 경우 (24시간) 무시
      const now = Date.now();
      const savedAt = gameState.savedAt || 0;
      if (now - savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("solitaire_game_state");
        return false;
      }

      // 상태 복원
      this.isGameStarted = gameState.isGameStarted;
      this.isGameCompleted = gameState.isGameCompleted;
      this.isPaused = gameState.isPaused;

      this.startTime = gameState.startTime;
      this.currentTime = gameState.currentTime;
      this.pausedTime = gameState.pausedTime;
      this.pauseStartTime = gameState.pauseStartTime;

      this.score = gameState.score;
      this.moves = gameState.moves;
      this.foundationCards = gameState.foundationCards;

      this.moveHistory = gameState.moveHistory || [];
      this.settings = { ...this.settings, ...gameState.settings };

      console.log("게임 상태가 복원되었습니다.");
      this.updateUI();
      return true;
    } catch (error) {
      console.error("게임 상태 복원 실패:", error);
      localStorage.removeItem("solitaire_game_state");
      return false;
    }
  }

  // 저장된 게임 상태 삭제
  clearSavedGameState() {
    try {
      localStorage.removeItem("solitaire_game_state");
      console.log("저장된 게임 상태가 삭제되었습니다.");
    } catch (error) {
      console.error("게임 상태 삭제 실패:", error);
    }
  }

  // 저장된 게임이 있는지 확인
  hasSavedGame() {
    try {
      const savedState = localStorage.getItem("solitaire_game_state");
      if (!savedState) return false;

      const gameState = JSON.parse(savedState);
      const now = Date.now();
      const savedAt = gameState.savedAt || 0;

      // 24시간 이내의 저장된 게임만 유효
      return (
        now - savedAt <= 24 * 60 * 60 * 1000 &&
        gameState.isGameStarted &&
        !gameState.isGameCompleted
      );
    } catch (error) {
      return false;
    }
  }
}
