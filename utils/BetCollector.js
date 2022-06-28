module.exports = class BetCollector {
  constructor(player, maxMoney, time = 10) {
    this.player = player;
    this.maxMoney = maxMoney;
    this.endReason = "";
    this.time = time;
    this.interval = undefined;
    this.stopped = false;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.interval = setInterval(() => {
        if (this.stopped) {
          this.endReason = "Stopped";
          clearInterval(this.interval);
          resolve();
        }
        if (this.time == 0) {
          this.endReason = "Timeout";
          resolve();
        }
        this.time--;
      }, 1000);
    });
  }

  stop() {
    this.stopped = true;
  }
};
