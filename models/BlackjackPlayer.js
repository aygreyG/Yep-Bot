const { Cards } = require("../constants/cards.json");

module.exports = class Player {
  constructor(name, id) {
    this.id = id;
    this.name = name;
    this.card = [];
    this.done = false;
    this.doneReason = "";
  }

  get cardVal() {
    return this.calcCardVal();
  }

  /**
   * @returns value of the player's cards
   */
  calcCardVal() {
    let val = 0;
    this.card.forEach((card) => {
      val += Cards[card].value;
    });

    if (
      val > 21 &&
      (this.card.includes(49) ||
        this.card.includes(50) ||
        this.card.includes(51) ||
        this.card.includes(48))
    ) {
      this.card.forEach((card) => {
        if (Cards[card].value == 11) {
          val -= 10;
        }
        if (val <= 21) return val;
      });
    }

    return val;
  }

  get writeCards() {
    return this.calcWriteCards();
  }

  /**
   * @returns a string representation of the player's cards
   */
  calcWriteCards() {
    let string = "";
    this.card.forEach((card) => {
      if (!(this.card.indexOf(card) == this.card.length - 1)) {
        string = string + Cards[card].name + " & ";
      } else {
        string += Cards[card].name;
      }
    });
    return string;
  }

  get valueCheck() {
    return this.calcValueCheck();
  }

  /**
   * 0 == bust
   * 1 == ok
   * 2 == blackjack
   * @returns a number from 0 to 2 depending on the cards' value
   */
  calcValueCheck() {
    let val = 0;
    this.card.forEach((card) => {
      val += Cards[card].value;
    });
    if (val == 21 && this.card.length == 2) {
      return 2;
    }
    if (val <= 21) return 1;
    if (
      val > 21 &&
      (this.card.includes(49) ||
        this.card.includes(50) ||
        this.card.includes(51) ||
        this.card.includes(48))
    ) {
      for (const card of this.card) {
        if (Cards[card].value === 11) {
          val -= 10;
          if (val <= 21) {
            return 1;
          }
        }
      }
    }
    return 0;
  }
}