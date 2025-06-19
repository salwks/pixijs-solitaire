// PixiJS 솔리테어 - 덱 관리 클래스

import { CONSTANTS } from "../core/Constants.js";
import { Card } from "./Card.js";
import { Utils } from "../utils/Utils.js";

export class Deck {
  constructor() {
    this.cards = [];
    this.originalOrder = [];
    this.createDeck();
  }

  // 52장 카드 덱 생성
  createDeck() {
    this.cards = [];

    CONSTANTS.SUITS.forEach((suit) => {
      CONSTANTS.RANKS.forEach((rank) => {
        const card = new Card(suit, rank);
        this.cards.push(card);
      });
    });

    // 원본 순서 저장
    this.originalOrder = [...this.cards];

    console.log(`${this.cards.length}장의 카드 덱이 생성되었습니다.`);
  }

  // 덱 셔플
  shuffle() {
    const cardData = this.cards.map((card) => ({
      suit: card.suit,
      rank: card.rank,
    }));

    const shuffledData = Utils.shuffle(cardData);

    // 기존 카드들 정리
    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    // 셔플된 순서로 새 카드들 생성
    shuffledData.forEach((data) => {
      const card = new Card(data.suit, data.rank);
      this.cards.push(card);
    });

    console.log("덱이 셔플되었습니다.");
    return this;
  }

  // 카드 뽑기
  dealCard() {
    if (this.cards.length === 0) {
      console.warn("덱에 카드가 없습니다.");
      return null;
    }

    const card = this.cards.pop();
    console.log(`카드 ${card.toString()}가 딜되었습니다.`);
    return card;
  }

  // 솔리테어 초기 배치용 카드 딜링
  dealForSolitaire() {
    const dealResult = {
      tableau: [[], [], [], [], [], [], []], // 7개 컬럼
      stock: [],
    };

    // Tableau 배치: 첫 번째 컬럼에 1장, 두 번째에 2장... 일곱 번째에 7장
    for (let col = 0; col < CONSTANTS.GAME.TABLEAU_COLUMNS; col++) {
      for (let row = 0; row <= col; row++) {
        const card = this.dealCard();
        if (card) {
          // 맨 위 카드만 앞면으로
          card.flip(row === col);
          dealResult.tableau[col].push(card);
        }
      }
    }

    // 나머지 카드들은 Stock으로
    while (this.cards.length > 0) {
      const card = this.dealCard();
      if (card) {
        card.flip(false); // 뒷면으로
        dealResult.stock.push(card);
      }
    }

    console.log("솔리테어 초기 배치 완료:", {
      tableau: dealResult.tableau.map((col) => col.length),
      stock: dealResult.stock.length,
    });

    return dealResult;
  }

  // 특정 카드 찾기
  findCard(suit, rank) {
    return this.cards.find((card) => card.suit === suit && card.rank === rank);
  }

  // 남은 카드 수
  getCount() {
    return this.cards.length;
  }

  // 덱이 비어있는지 확인
  isEmpty() {
    return this.cards.length === 0;
  }

  // 덱 리셋 (원본 순서로)
  reset() {
    // 기존 카드들 정리
    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    // 원본 순서로 새 카드들 생성
    this.originalOrder.forEach((originalCard) => {
      const card = new Card(originalCard.suit, originalCard.rank);
      this.cards.push(card);
    });

    console.log("덱이 리셋되었습니다.");
    return this;
  }

  // 카드 추가 (되돌리기나 특수 상황용)
  addCard(card) {
    this.cards.push(card);
  }

  // 덱 상태 정보
  getInfo() {
    return {
      totalCards: this.cards.length,
      topCard:
        this.cards.length > 0
          ? this.cards[this.cards.length - 1].toString()
          : "none",
      isEmpty: this.isEmpty(),
    };
  }

  // 테스트용: 특정 패턴으로 덱 배치
  setTestPattern(pattern = "sorted") {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];

    switch (pattern) {
      case "sorted":
        // 수트별로 정렬된 순서
        CONSTANTS.SUITS.forEach((suit) => {
          CONSTANTS.RANKS.forEach((rank) => {
            const card = new Card(suit, rank);
            this.cards.push(card);
          });
        });
        break;

      case "reverse":
        // 역순
        const reversedSuits = [...CONSTANTS.SUITS].reverse();
        const reversedRanks = [...CONSTANTS.RANKS].reverse();
        reversedSuits.forEach((suit) => {
          reversedRanks.forEach((rank) => {
            const card = new Card(suit, rank);
            this.cards.push(card);
          });
        });
        break;

      case "alternating":
        // 색상이 번갈아가는 패턴
        const redSuits = ["hearts", "diamonds"];
        const blackSuits = ["clubs", "spades"];

        for (let i = 0; i < CONSTANTS.RANKS.length; i++) {
          const rank = CONSTANTS.RANKS[i];
          // 빨강, 검정, 빨강, 검정 순으로
          [redSuits[i % 2], blackSuits[i % 2]].forEach((suit) => {
            const card = new Card(suit, rank);
            this.cards.push(card);
          });
        }
        break;
    }

    console.log(`덱이 ${pattern} 패턴으로 설정되었습니다.`);
    return this;
  }

  // 메모리 정리
  destroy() {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.originalOrder = [];
  }
}
