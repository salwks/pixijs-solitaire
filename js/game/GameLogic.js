// PixiJS 솔리테어 - 게임 로직 (수정됨)

import { CONSTANTS } from "../core/Constants.js";
import { Utils } from "../utils/Utils.js";

export class GameLogic {
  constructor(gameState) {
    this.gameState = gameState;
  }

  // 카드 이동 유효성 검사
  validateMove(card, fromStack, toStack) {
    if (!card || !toStack) return false;

    // 게임이 진행 중이 아니면 이동 불가
    if (!this.gameState.isPlaying()) return false;

    // 뒷면 카드는 이동 불가
    if (!card.faceUp) return false;

    switch (toStack.type) {
      case "foundation":
        return this.canMoveToFoundation(card, toStack);
      case "tableau":
        return this.canMoveToTableau(card, toStack);
      case "waste":
        return false; // Waste로는 직접 이동 불가
      case "stock":
        return false; // Stock으로는 직접 이동 불가
      default:
        return false;
    }
  }

  // Foundation으로 이동 가능 여부
  canMoveToFoundation(card, foundationStack) {
    const foundationCards = foundationStack.cards;

    if (foundationCards.length === 0) {
      // 빈 Foundation에는 Ace만 올 수 있음
      return card.getValue() === 1;
    }

    const topCard = foundationCards[foundationCards.length - 1];

    // 같은 수트이고 연속된 값이어야 함
    return (
      card.suit === topCard.suit && card.getValue() === topCard.getValue() + 1
    );
  }

  // Tableau로 이동 가능 여부
  canMoveToTableau(card, tableauStack) {
    const tableauCards = tableauStack.cards;

    if (tableauCards.length === 0) {
      // 빈 Tableau에는 King만 올 수 있음
      return card.getValue() === 13;
    }

    const topCard = tableauCards[tableauCards.length - 1];

    // 뒷면 카드 위에는 올 수 없음
    if (!topCard.faceUp) return false;

    // 다른 색깔이고 1 작은 값이어야 함
    return (
      card.isRed() !== topCard.isRed() &&
      card.getValue() === topCard.getValue() - 1
    );
  }

  // 여러 카드 이동 유효성 검사 (Tableau에서만 가능)
  validateMultiCardMove(cards, fromStack, toStack) {
    if (!cards || cards.length === 0) return false;
    if (fromStack.type !== "tableau") return false;

    // 카드들이 연속적이고 번갈아가는 색상인지 확인
    if (!this.areCardsSequential(cards)) return false;

    // 첫 번째 카드가 이동 가능한지 확인
    return this.validateMove(cards[0], fromStack, toStack);
  }

  // 카드들이 연속적인지 확인
  areCardsSequential(cards) {
    if (cards.length <= 1) return true;

    for (let i = 1; i < cards.length; i++) {
      const prevCard = cards[i - 1];
      const currCard = cards[i];

      // 모든 카드가 앞면이어야 함
      if (!prevCard.faceUp || !currCard.faceUp) return false;

      // 색상이 번갈아가야 함
      if (prevCard.isRed() === currCard.isRed()) return false;

      // 값이 연속적으로 감소해야 함
      if (prevCard.getValue() !== currCard.getValue() + 1) return false;
    }

    return true;
  }

  // Stock에서 카드 뽑기
  drawFromStock(stockStack, wasteStack) {
    if (stockStack.isEmpty()) {
      // Stock이 비어있으면 Waste의 카드들을 다시 Stock으로
      return this.recycleWasteToStock(stockStack, wasteStack);
    }

    const drawCount = Math.min(
      this.gameState.settings.drawCount,
      stockStack.getCardCount()
    );

    const drawnCards = [];
    for (let i = 0; i < drawCount; i++) {
      const card = stockStack.getTopCard();
      if (card) {
        stockStack.removeCard(card);
        card.flip(true); // 앞면으로
        wasteStack.addCard(card);
        drawnCards.push(card);
      }
    }

    // 이동 기록
    this.gameState.recordMove({
      type: "stock_to_waste",
      cards: drawnCards.map((c) => c.toString()),
      count: drawnCards.length,
    });

    return drawnCards;
  }

  // Waste를 Stock으로 재활용
  recycleWasteToStock(stockStack, wasteStack) {
    if (wasteStack.isEmpty()) return [];

    const cards = [...wasteStack.cards].reverse(); // 순서 뒤집기

    // Waste의 모든 카드를 Stock으로 이동
    cards.forEach((card) => {
      wasteStack.removeCard(card);
      card.flip(false); // 뒷면으로
      stockStack.addCard(card);
    });

    // 이동 기록
    this.gameState.recordMove({
      type: "waste_to_stock",
      count: cards.length,
    });

    console.log(
      `${cards.length}장의 카드가 Waste에서 Stock으로 재활용되었습니다.`
    );
    return cards;
  }

  // 자동으로 뒤집을 수 있는 카드 찾기
  findCardsToFlip(tableauStacks) {
    const cardsToFlip = [];

    tableauStacks.forEach((stack) => {
      const topCard = stack.getTopCard();
      if (topCard && !topCard.faceUp) {
        cardsToFlip.push(topCard);
      }
    });

    return cardsToFlip;
  }

  // 자동 카드 뒤집기 실행
  executeCardFlip(card) {
    if (!card || card.faceUp) return false;

    card.flip(true);

    // 이동 기록
    this.gameState.recordMove({
      type: "card_flip",
      card: card.toString(),
      stack: card.currentStack.type,
      stackIndex: card.currentStack.index || 0,
    });

    console.log(`카드 ${card.toString()}가 뒤집혔습니다.`);
    return true;
  }

  // 자동으로 뒤집을 수 있는 모든 카드 뒤집기
  executeAllCardFlips(tableauStacks) {
    const cardsToFlip = this.findCardsToFlip(tableauStacks);
    let flippedCount = 0;

    cardsToFlip.forEach((card) => {
      if (this.executeCardFlip(card)) {
        flippedCount++;
      }
    });

    if (flippedCount > 0) {
      console.log(`${flippedCount}장의 카드가 자동으로 뒤집혔습니다.`);
    }

    return flippedCount;
  }

  // 자동 완성 가능한 카드들 찾기
  findAutoCompletableCards(allStacks) {
    const completableCards = [];
    const foundationStacks = allStacks.filter((s) => s.type === "foundation");

    // 모든 스택에서 가능한 카드들 확인
    allStacks.forEach((stack) => {
      if (stack.type === "foundation") return;

      const topCard = stack.getTopCard();
      if (!topCard || !topCard.faceUp) return;

      // 어떤 Foundation에든 올릴 수 있는지 확인
      foundationStacks.forEach((foundationStack) => {
        if (this.canMoveToFoundation(topCard, foundationStack)) {
          completableCards.push({
            card: topCard,
            fromStack: stack,
            toStack: foundationStack,
          });
        }
      });
    });

    return completableCards;
  }

  // 힌트 찾기
  findHints(allStacks) {
    const hints = [];

    // Foundation으로 이동 가능한 카드들
    const autoCompletable = this.findAutoCompletableCards(allStacks);
    hints.push(...autoCompletable);

    // Tableau 간 이동 가능한 카드들
    const tableauStacks = allStacks.filter((s) => s.type === "tableau");
    const wasteStack = allStacks.find((s) => s.type === "waste");

    // Waste에서 Tableau로
    if (wasteStack && !wasteStack.isEmpty()) {
      const wasteTopCard = wasteStack.getTopCard();
      if (wasteTopCard && wasteTopCard.faceUp) {
        tableauStacks.forEach((tableauStack) => {
          if (this.canMoveToTableau(wasteTopCard, tableauStack)) {
            hints.push({
              card: wasteTopCard,
              fromStack: wasteStack,
              toStack: tableauStack,
            });
          }
        });
      }
    }

    // Tableau 간 이동
    tableauStacks.forEach((fromStack) => {
      const topCard = fromStack.getTopCard();
      if (!topCard || !topCard.faceUp) return;

      tableauStacks.forEach((toStack) => {
        if (fromStack === toStack) return;

        if (this.canMoveToTableau(topCard, toStack)) {
          hints.push({
            card: topCard,
            fromStack: fromStack,
            toStack: toStack,
          });
        }
      });
    });

    // 뒤집을 수 있는 카드들
    const cardsToFlip = this.findCardsToFlip(tableauStacks);
    cardsToFlip.forEach((card) => {
      hints.push({
        card: card,
        fromStack: card.currentStack,
        toStack: card.currentStack,
        type: "flip",
      });
    });

    return hints;
  }

  // 게임 완료 여부 확인
  isGameComplete(foundationStacks) {
    const totalCards = foundationStacks.reduce(
      (sum, stack) => sum + stack.getCardCount(),
      0
    );
    return totalCards === CONSTANTS.GAME.TOTAL_CARDS;
  }

  // 최적의 이동 제안 (게임 막힘 방지)
  suggestBestMove(allStacks) {
    const hints = this.findHints(allStacks);

    if (hints.length === 0) {
      // Stock에서 카드 뽑기 제안
      const stockStack = allStacks.find((s) => s.type === "stock");
      const wasteStack = allStacks.find((s) => s.type === "waste");

      if (stockStack && !stockStack.isEmpty()) {
        return {
          type: "draw_stock",
          fromStack: stockStack,
          toStack: wasteStack,
        };
      }

      // Waste 재활용 제안
      if (wasteStack && !wasteStack.isEmpty()) {
        return {
          type: "recycle_waste",
          fromStack: wasteStack,
          toStack: stockStack,
        };
      }

      // 정말로 할 수 있는 것이 없으면 null 반환
      return null;
    }

    // 게임 막힘 방지를 위한 스마트 우선순위
    return this.getSmartMovePriority(hints, allStacks);
  }

  // 스마트 이동 우선순위 결정 (게임 막힘 방지)
  getSmartMovePriority(hints, allStacks) {
    // 1. Foundation으로의 이동 (가장 높은 우선순위)
    const foundationMoves = hints.filter(
      (h) => h.toStack?.type === "foundation"
    );
    if (foundationMoves.length > 0) {
      // Ace나 2를 우선적으로 Foundation으로
      const aceOrTwoMoves = foundationMoves.filter(
        (h) => h.card.getValue() <= 2
      );
      if (aceOrTwoMoves.length > 0) {
        return aceOrTwoMoves[0];
      }
      return foundationMoves[0];
    }

    // 2. 카드 뒤집기 (게임 진행을 위해 중요)
    const flipMoves = hints.filter((h) => h.type === "flip");
    if (flipMoves.length > 0) {
      return flipMoves[0];
    }

    // 3. Tableau 이동 (게임 막힘 방지 우선순위)
    const tableauMoves = hints.filter((h) => h.toStack?.type === "tableau");
    if (tableauMoves.length > 0) {
      // 빈 Tableau로의 이동을 우선시 (King 이동)
      const emptyTableauMoves = tableauMoves.filter(
        (h) => h.toStack.cards.length === 0
      );
      if (emptyTableauMoves.length > 0) {
        return emptyTableauMoves[0];
      }

      // 막힌 카드를 해결하는 이동 우선
      const unblockingMoves = this.findUnblockingMoves(tableauMoves, allStacks);
      if (unblockingMoves.length > 0) {
        return unblockingMoves[0];
      }

      return tableauMoves[0];
    }

    return hints[0];
  }

  // 막힌 카드를 해결하는 이동 찾기
  findUnblockingMoves(tableauMoves, allStacks) {
    const tableauStacks = allStacks.filter((s) => s.type === "tableau");
    const unblockingMoves = [];

    tableauMoves.forEach((move) => {
      const fromStack = move.fromStack;
      const toStack = move.toStack;

      // 이동 후 뒤집을 수 있는 카드가 생기는지 확인
      const wouldUnblock = this.wouldUnblockCards(
        fromStack,
        toStack,
        move.card
      );
      if (wouldUnblock) {
        unblockingMoves.push(move);
      }
    });

    return unblockingMoves;
  }

  // 이동이 카드를 막힘 해결하는지 확인
  wouldUnblockCards(fromStack, toStack, movingCard) {
    // 이동 후 fromStack의 맨 위 카드가 뒤집힐 수 있는지 확인
    if (fromStack.type === "tableau") {
      const remainingCards = fromStack.cards.filter(
        (card) => card !== movingCard
      );
      if (remainingCards.length > 0) {
        const topCard = remainingCards[remainingCards.length - 1];
        if (!topCard.faceUp) {
          return true; // 뒷면 카드가 뒤집힐 수 있음
        }
      }
    }

    return false;
  }

  // 단일 카드 이동 실행
  executeSingleCardMove(card, fromStack, toStack) {
    if (!this.validateMove(card, fromStack, toStack)) {
      console.log("유효하지 않은 이동입니다.");
      return false;
    }

    // 카드 이동
    fromStack.removeCard(card);
    toStack.addCard(card);

    // Foundation으로 이동한 경우 점수 업데이트
    if (toStack.type === "foundation") {
      const isGameComplete = this.gameState.addToFoundation(card);
      if (isGameComplete) {
        console.log("게임 완료!");
        return true;
      }
    }

    // Foundation에서 제거한 경우
    if (fromStack.type === "foundation") {
      this.gameState.removeFromFoundation(card);
    }

    // 이동 기록
    this.gameState.recordMove({
      type: "card_move",
      card: card.toString(),
      from: fromStack.type,
      to: toStack.type,
      fromIndex: fromStack.index || 0,
      toIndex: toStack.index || 0,
    });

    console.log(
      `카드 ${card.toString()}가 ${fromStack.type}에서 ${toStack.type}로 이동됨`
    );
    return true;
  }

  // 여러 카드 이동 실행
  executeMultiCardMove(cards, fromStack, toStack) {
    if (!this.validateMultiCardMove(cards, fromStack, toStack)) {
      console.log("유효하지 않은 다중 카드 이동입니다.");
      return false;
    }

    // 모든 카드 이동
    cards.forEach((card) => {
      fromStack.removeCard(card);
      toStack.addCard(card);
    });

    // 이동 기록
    this.gameState.recordMove({
      type: "multi_card_move",
      cards: cards.map((c) => c.toString()),
      count: cards.length,
      from: fromStack.type,
      to: toStack.type,
      fromIndex: fromStack.index || 0,
      toIndex: toStack.index || 0,
    });

    console.log(
      `${cards.length}장의 카드가 ${fromStack.type}에서 ${toStack.type}로 이동됨`
    );
    return true;
  }

  // 이동 되돌리기
  undoMove(moveData) {
    if (!moveData) return false;

    switch (moveData.type) {
      case "card_move":
        return this.undoCardMove(moveData);
      case "multi_card_move":
        return this.undoMultiCardMove(moveData);
      case "stock_to_waste":
        return this.undoStockToWaste(moveData);
      case "waste_to_stock":
        return this.undoWasteToStock(moveData);
      case "card_flip":
        return this.undoCardFlip(moveData);
      default:
        console.log("알 수 없는 이동 타입:", moveData.type);
        return false;
    }
  }

  // 카드 이동 되돌리기
  undoCardMove(moveData) {
    // TODO: 실제 스택 참조를 통한 되돌리기 구현
    console.log("카드 이동 되돌리기:", moveData);
    return true;
  }

  // 다중 카드 이동 되돌리기
  undoMultiCardMove(moveData) {
    // TODO: 실제 스택 참조를 통한 되돌리기 구현
    console.log("다중 카드 이동 되돌리기:", moveData);
    return true;
  }

  // Stock to Waste 되돌리기
  undoStockToWaste(moveData) {
    // TODO: 실제 스택 참조를 통한 되돌리기 구현
    console.log("Stock to Waste 되돌리기:", moveData);
    return true;
  }

  // Waste to Stock 되돌리기
  undoWasteToStock(moveData) {
    // TODO: 실제 스택 참조를 통한 되돌리기 구현
    console.log("Waste to Stock 되돌리기:", moveData);
    return true;
  }

  // 카드 뒤집기 되돌리기
  undoCardFlip(moveData) {
    // TODO: 실제 카드 참조를 통한 되돌리기 구현
    console.log("카드 뒤집기 되돌리기:", moveData);
    return true;
  }

  // 자동 완성 실행
  executeAutoComplete(allStacks) {
    const completableCards = this.findAutoCompletableCards(allStacks);

    if (completableCards.length === 0) {
      console.log("자동 완성할 수 있는 카드가 없습니다.");
      return false;
    }

    // 모든 가능한 카드들을 Foundation으로 이동
    completableCards.forEach(({ card, fromStack, toStack }) => {
      this.executeSingleCardMove(card, fromStack, toStack);
    });

    return true;
  }

  // 게임 통계 분석
  analyzeGame(allStacks) {
    const analysis = {
      totalCards: 0,
      faceUpCards: 0,
      foundationCards: 0,
      blockedCards: 0,
      availableCards: 0,
      possibleMoves: 0,
    };

    allStacks.forEach((stack) => {
      analysis.totalCards += stack.getCardCount();

      if (stack.type === "foundation") {
        analysis.foundationCards += stack.getCardCount();
      }

      stack.cards.forEach((card) => {
        if (card.faceUp) {
          analysis.faceUpCards++;

          if (stack.getTopCard() === card) {
            analysis.availableCards++;
          }
        } else {
          analysis.blockedCards++;
        }
      });
    });

    // 가능한 이동 수 계산
    analysis.possibleMoves = this.findHints(allStacks).length;

    return analysis;
  }

  // 게임이 막혔는지 확인
  isGameBlocked(allStacks) {
    const hints = this.findHints(allStacks);
    const stockStack = allStacks.find((s) => s.type === "stock");
    const wasteStack = allStacks.find((s) => s.type === "waste");

    // Stock에서 뽑을 수 있는 카드가 있는지 확인
    const canDrawFromStock = stockStack && !stockStack.isEmpty();

    // Waste에서 뽑을 수 있는 카드가 있는지 확인
    const canDrawFromWaste = wasteStack && !wasteStack.isEmpty();

    // 가능한 이동이 없고, Stock에서도 뽑을 수 없으면 게임 막힘
    return hints.length === 0 && !canDrawFromStock && !canDrawFromWaste;
  }

  // 게임 막힘 해결 시도
  tryUnblockGame(allStacks) {
    console.log("게임 막힘 해결 시도 중...");

    // 1. 자동 카드 뒤집기 시도
    const tableauStacks = allStacks.filter((s) => s.type === "tableau");
    const flippedCount = this.executeAllCardFlips(tableauStacks);

    if (flippedCount > 0) {
      console.log("카드 뒤집기로 게임이 해결되었습니다.");
      return true;
    }

    // 2. Stock에서 카드 뽑기 시도
    const stockStack = allStacks.find((s) => s.type === "stock");
    const wasteStack = allStacks.find((s) => s.type === "waste");

    if (stockStack && !stockStack.isEmpty()) {
      const drawnCards = this.drawFromStock(stockStack, wasteStack);
      if (drawnCards.length > 0) {
        console.log("Stock에서 카드를 뽑아 게임이 해결되었습니다.");
        return true;
      }
    }

    // 3. Waste 재활용 시도
    if (wasteStack && !wasteStack.isEmpty()) {
      const recycledCards = this.recycleWasteToStock(stockStack, wasteStack);
      if (recycledCards.length > 0) {
        console.log("Waste 재활용으로 게임이 해결되었습니다.");
        return true;
      }
    }

    console.log("게임 막힘을 해결할 수 없습니다.");
    return false;
  }

  // 예방적 게임 막힘 해결 (게임 진행 중 주기적으로 호출)
  preventGameBlock(allStacks) {
    const tableauStacks = allStacks.filter((s) => s.type === "tableau");

    // 1. 자동 카드 뒤집기
    const flippedCount = this.executeAllCardFlips(tableauStacks);

    // 2. 막힌 카드가 있는지 확인하고 해결 시도
    const blockedCards = this.findBlockedCards(tableauStacks);
    if (blockedCards.length > 0) {
      console.log(`${blockedCards.length}장의 막힌 카드 발견`);
      this.tryUnblockSpecificCards(blockedCards, allStacks);
    }

    return flippedCount > 0 || blockedCards.length > 0;
  }

  // 막힌 카드들 찾기
  findBlockedCards(tableauStacks) {
    const blockedCards = [];

    tableauStacks.forEach((stack) => {
      stack.cards.forEach((card, index) => {
        if (!card.faceUp && index < stack.cards.length - 1) {
          // 뒷면 카드이고 맨 위가 아니면 막힌 상태
          blockedCards.push({
            card: card,
            stack: stack,
            index: index,
          });
        }
      });
    });

    return blockedCards;
  }

  // 특정 막힌 카드들 해결 시도
  tryUnblockSpecificCards(blockedCards, allStacks) {
    const tableauStacks = allStacks.filter((s) => s.type === "tableau");

    blockedCards.forEach(({ card, stack }) => {
      // 이 카드를 다른 곳으로 이동시킬 수 있는지 확인
      tableauStacks.forEach((targetStack) => {
        if (targetStack !== stack) {
          const cardsToMove = stack.getCardsFromIndex(
            stack.cards.indexOf(card)
          );
          if (this.validateMultiCardMove(cardsToMove, stack, targetStack)) {
            console.log(`막힌 카드 ${card.toString()} 해결 시도`);
            this.executeMultiCardMove(cardsToMove, stack, targetStack);
          }
        }
      });
    });
  }
}
