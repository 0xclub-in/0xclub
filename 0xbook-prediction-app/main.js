const fixtureList = [
  "MI vs CSK - Apr 02, 2026",
  "RCB vs KKR - Apr 04, 2026",
  "GT vs RR - Apr 06, 2026",
  "LSG vs DC - Apr 08, 2026",
  "PBKS vs SRH - Apr 10, 2026",
  "CSK vs RCB - Apr 13, 2026",
  "MI vs GT - Apr 15, 2026",
  "KKR vs RR - Apr 18, 2026",
  "DC vs PBKS - Apr 20, 2026",
  "SRH vs LSG - Apr 22, 2026"
];

const state = {
  coins: 1000
};

const coinBalance = document.getElementById("coinBalance");
const fixtureSelect = document.getElementById("fixtureSelect");
const walletMessage = document.getElementById("walletMessage");
const predictionMessage = document.getElementById("predictionMessage");
const multiplierMessage = document.getElementById("multiplierMessage");
const activityFeed = document.getElementById("activityFeed");

function updateBalance() {
  coinBalance.textContent = String(state.coins);
}

function addActivity(text, statusClass = "") {
  const item = document.createElement("li");
  item.textContent = `${new Date().toLocaleTimeString()} - ${text}`;
  if (statusClass) item.classList.add(statusClass);
  activityFeed.prepend(item);
}

function setMessage(el, text, statusClass = "") {
  el.textContent = text;
  el.classList.remove("win", "loss");
  if (statusClass) el.classList.add(statusClass);
}

function hasEnoughCoins(amount) {
  return Number.isFinite(amount) && amount > 0 && amount <= state.coins;
}

function warnLowFunds(targetEl, requested) {
  setMessage(
    targetEl,
    `You are low on funds. You have ${state.coins} coins but need ${requested}. Use Add Funds.`,
    "loss"
  );
}

function seedFixtures() {
  fixtureList.forEach((fixture) => {
    const option = document.createElement("option");
    option.value = fixture;
    option.textContent = fixture;
    fixtureSelect.appendChild(option);
  });
}

function placePrediction() {
  const selectedFixture = fixtureSelect.value;
  const predictionType = document.getElementById("predictionType").value;
  const predictionInput = document.getElementById("predictionInput").value.trim();
  const betAmount = Number(document.getElementById("betAmount").value);

  if (!predictionInput) {
    setMessage(predictionMessage, "Enter your prediction first.");
    return;
  }

  if (!hasEnoughCoins(betAmount)) {
    warnLowFunds(predictionMessage, betAmount || 0);
    return;
  }

  state.coins -= betAmount;
  updateBalance();

  // Fun demo result simulation: about 55% win chance.
  const isWin = Math.random() < 0.55;
  const payout = isWin ? Math.floor(betAmount * 1.8) : 0;
  if (isWin) {
    state.coins += payout;
  }
  updateBalance();

  const outcomeText = isWin
    ? `Nice call! ${predictionType} prediction won on ${selectedFixture}. +${payout} coins`
    : `Prediction missed for ${selectedFixture}. Try another match.`;

  setMessage(predictionMessage, outcomeText, isWin ? "win" : "loss");
  addActivity(`Fixture: ${selectedFixture} | Bet ${betAmount} | ${outcomeText}`, isWin ? "win" : "loss");
}

function playMultiplier() {
  const guess = Number(document.getElementById("multiplierGuess").value);
  const bet = Number(document.getElementById("multiplierBet").value);

  if (guess < 1 || guess > 5) {
    setMessage(multiplierMessage, "Guess must be between 1.00x and 5.00x.");
    return;
  }

  if (!hasEnoughCoins(bet)) {
    warnLowFunds(multiplierMessage, bet || 0);
    return;
  }

  state.coins -= bet;
  updateBalance();

  const target = Number((Math.random() * 4 + 1).toFixed(2));
  const isWin = guess >= target;

  if (isWin) {
    const winAmount = Math.floor(bet * guess);
    state.coins += winAmount;
    setMessage(
      multiplierMessage,
      `Target was ${target}x. You guessed ${guess}x, so you win ${winAmount} coins!`,
      "win"
    );
    addActivity(`Multiplier win: guessed ${guess}x vs ${target}x | +${winAmount}`, "win");
  } else {
    setMessage(
      multiplierMessage,
      `Target was ${target}x. You guessed ${guess}x, so this round is a loss.`,
      "loss"
    );
    addActivity(`Multiplier loss: guessed ${guess}x vs ${target}x | -${bet}`, "loss");
  }

  updateBalance();
}

document.getElementById("addFundsBtn").addEventListener("click", () => {
  state.coins += 500;
  updateBalance();
  setMessage(walletMessage, "500 demo coins added to your account.", "win");
  addActivity("Added demo funds (+500).", "win");
});

document.getElementById("resetBtn").addEventListener("click", () => {
  state.coins = 1000;
  updateBalance();
  setMessage(walletMessage, "Demo wallet reset to 1000 coins.");
  setMessage(predictionMessage, "");
  setMessage(multiplierMessage, "");
  addActivity("Wallet reset to 1000 coins.");
});

document.getElementById("placePredictionBtn").addEventListener("click", placePrediction);
document.getElementById("playMultiplierBtn").addEventListener("click", playMultiplier);

seedFixtures();
updateBalance();
addActivity("Welcome to 0xbook IPL 2026 prediction demo.");
