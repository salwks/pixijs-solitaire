// PixiJS 솔리테어 - 점수 UI 관리

import { Utils } from "../utils/Utils.js";

export class ScoreUI {
  constructor(gameState, uiAnimation = null) {
    this.gameState = gameState;
    this.uiAnimation = uiAnimation;
    this.elements = this.getUIElements();
    this.timerInterval = null;
    this.lastScore = 0;

    this.setupEventListeners();
    this.startTimer();
  }

  getUIElements() {
    return {
      score: document.getElementById("score"),
      timer: document.getElementById("timer"),
      gameInfo: document.getElementById("gameInfo"),
    };
  }

  setupEventListeners() {
    // 게임 상태 변경 시 UI 업데이트
    document.addEventListener("gameStateChanged", () => {
      this.updateAll();
    });
  }

  // 타이머 시작
  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.gameState.isPlaying()) {
        this.gameState.updateTime();
        this.updateTimer();
      }
    }, 1000);
  }

  // 타이머 중지
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // 점수 업데이트
  updateScore() {
    if (this.elements.score) {
      const newScore = this.gameState.score;

      // UI 애니메이션이 있으면 사용
      if (this.uiAnimation && newScore > this.lastScore) {
        this.uiAnimation.animateScoreIncrease(
          this.elements.score,
          this.lastScore,
          newScore
        );
      } else {
        this.elements.score.textContent = newScore.toLocaleString();
        this.animateScoreChange();
      }

      this.lastScore = newScore;
    }
  }

  // 타이머 업데이트
  updateTimer() {
    if (this.elements.timer) {
      const formattedTime = Utils.formatTime(this.gameState.currentTime);
      this.elements.timer.textContent = formattedTime;

      // 게임이 너무 오래 걸리면 색상 변경
      if (this.gameState.currentTime > 600) {
        // 10분
        this.elements.timer.style.color = "#ff6b6b";
      } else if (this.gameState.currentTime > 300) {
        // 5분
        this.elements.timer.style.color = "#ffa726";
      } else {
        this.elements.timer.style.color = "white";
      }
    }
  }

  // 게임 정보 업데이트
  updateGameInfo() {
    if (!this.elements.gameInfo) return;

    const info = this.gameState.getGameInfo();
    const stats = this.gameState.getDetailedStats();

    // 추가 정보 표시 (필요시)
    const additionalInfo = document.querySelector(".additional-info");
    if (additionalInfo) {
      additionalInfo.innerHTML = `
                <div>이동: ${info.moves}</div>
                <div>진행률: ${(info.progress * 100).toFixed(1)}%</div>
            `;
    }
  }

  // 모든 UI 요소 업데이트
  updateAll() {
    this.updateScore();
    this.updateTimer();
    this.updateGameInfo();
  }

  // 점수 변화 애니메이션
  animateScoreChange() {
    if (!this.elements.score) return;

    this.elements.score.style.transform = "scale(1.2)";
    this.elements.score.style.transition = "transform 0.2s ease";

    setTimeout(() => {
      this.elements.score.style.transform = "scale(1)";
    }, 200);
  }

  // 게임 완료 UI 표시
  showGameComplete() {
    const info = this.gameState.getGameInfo();
    const stats = this.gameState.getDetailedStats();

    // 게임 완료 모달 생성
    this.createGameCompleteModal(info, stats);

    // 점수 하이라이트
    this.highlightFinalScore();
  }

  // 게임 완료 모달 생성
  createGameCompleteModal(info, stats) {
    // 기존 모달 제거
    const existingModal = document.querySelector(".game-complete-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = "game-complete-modal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
        `;

    modalContent.innerHTML = `
            <h2 style="color: #2c3e50; margin-bottom: 20px;">🎉 축하합니다!</h2>
            <div style="color: #34495e; font-size: 18px; margin-bottom: 20px;">
                <div>최종 점수: <strong>${info.score.toLocaleString()}</strong></div>
                <div>소요 시간: <strong>${Utils.formatTime(
                  info.time
                )}</strong></div>
                <div>이동 횟수: <strong>${info.moves}</strong></div>
            </div>
            <div style="color: #7f8c8d; font-size: 14px; margin-bottom: 20px;">
                <div>승률: ${stats.winRate}%</div>
                <div>최고 점수: ${stats.bestScore.toLocaleString()}</div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="newGameFromModal" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">새 게임</button>
                <button id="closeModal" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">닫기</button>
            </div>
        `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 이벤트 리스너
    document
      .getElementById("newGameFromModal")
      .addEventListener("click", () => {
        modal.remove();
        document.getElementById("newGameBtn").click();
      });

    document.getElementById("closeModal").addEventListener("click", () => {
      modal.remove();
    });

    // 모달 외부 클릭 시 닫기
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 최종 점수 하이라이트
  highlightFinalScore() {
    if (!this.elements.score) return;

    this.elements.score.style.animation = "pulse 1s ease-in-out 3";

    // CSS 애니메이션 추가
    if (!document.querySelector("#scoreAnimation")) {
      const style = document.createElement("style");
      style.id = "scoreAnimation";
      style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); color: #f39c12; }
                    100% { transform: scale(1); }
                }
            `;
      document.head.appendChild(style);
    }
  }

  // 통계 모달 표시
  showStatsModal() {
    const stats = this.gameState.getDetailedStats();

    const modal = document.createElement("div");
    modal.className = "stats-modal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            max-width: 500px;
            width: 90%;
        `;

    modalContent.innerHTML = `
            <h2 style="color: #2c3e50; margin-bottom: 20px;">📊 게임 통계</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; color: #34495e;">
                <div>플레이한 게임: <strong>${stats.gamesPlayed}</strong></div>
                <div>승리한 게임: <strong>${stats.gamesWon}</strong></div>
                <div>승률: <strong>${stats.winRate}%</strong></div>
                <div>최고 점수: <strong>${stats.bestScore.toLocaleString()}</strong></div>
                <div>최단 시간: <strong>${
                  stats.bestTime ? Utils.formatTime(stats.bestTime) : "N/A"
                }</strong></div>
                <div>평균 시간: <strong>${Utils.formatTime(
                  stats.averageTime
                )}</strong></div>
                <div>총 이동: <strong>${stats.totalMoves.toLocaleString()}</strong></div>
                <div>총 시간: <strong>${Utils.formatTime(
                  stats.totalTime
                )}</strong></div>
            </div>
            <button id="closeStatsModal" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 20px;
            ">닫기</button>
        `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 닫기 이벤트
    document.getElementById("closeStatsModal").addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 일시정지 UI 표시
  showPauseOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "pauseOverlay";
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 500;
            color: white;
            font-size: 24px;
            font-weight: bold;
        `;
    overlay.textContent = "게임 일시정지";
    document.body.appendChild(overlay);
  }

  // 일시정지 UI 숨기기
  hidePauseOverlay() {
    const overlay = document.getElementById("pauseOverlay");
    if (overlay) {
      overlay.remove();
    }
  }

  // 메모리 정리
  destroy() {
    this.stopTimer();

    // 모든 모달 제거
    document
      .querySelectorAll(".game-complete-modal, .stats-modal")
      .forEach((modal) => {
        modal.remove();
      });

    this.hidePauseOverlay();
  }
}
