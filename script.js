const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const coinsText = document.getElementById("coins");

// صور
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/3GCz3im.png";

const bgImg = new Image();
bgImg.src = "https://i.imgur.com/k2mCiEd.png";

// متغيرات
let keys = {};
let cameraX = 0;
let coins = 0;
let bestScore = localStorage.getItem("bestScore") || 0;
let gameOver = false;
let message = "";
let explosion = null;

const gravity = 0.6;
const worldWidth = 2000;

let player;
let platforms;
let coinsArr;
let door;

// ===== بدء / إعادة =====
function initGame() {
  coins = 0;
  coinsText.textContent = coins + " | 🏆 أعلى نتيجة: " + bestScore;
  gameOver = false;
  message = "";
  cameraX = 0;
  explosion = null;

  player = {
    x: 50,
    y: 200,
    w: 40,
    h: 48,
    vx: 0,
    vy: 0,
    speed: 4,
    jump: -12,
    onGround: false
  };

  // 🟫 الأرض مع فجوات
  platforms = [
    { x: 0,   y: 360, w: 300, h: 40 },
    { x: 380, y: 360, w: 260, h: 40 },
    { x: 720, y: 360, w: 260, h: 40 },
    { x: 1100,y: 360, w: 260, h: 40 },
    { x: 1500,y: 360, w: 400, h: 40 },

    // منصات مرتفعة
    { x: 450, y: 300, w: 120, h: 20 },
    { x: 850, y: 260, w: 120, h: 20 },
    { x: 1250,y: 300, w: 120, h: 20 }
  ];

  // 🪙 العملات
  coinsArr = [
    { x: 480, y: 260, taken: false },
    { x: 880, y: 220, taken: false },
    { x: 1280,y: 260, taken: false }
  ];

  // 🚪 الباب
  door = { x: 1900, y: 300, w: 40, h: 60 };
}

// ===== التحكم =====
document.addEventListener("keydown", e => {
  if (gameOver) {
    initGame();
    return;
  }
  keys[e.code] = true;
});
document.addEventListener("keyup", e => keys[e.code] = false);

// أزرار الهاتف
["left", "right", "jump"].forEach(id => {
  const key = id === "left" ? "ArrowLeft" : id === "right" ? "ArrowRight" : "Space";
  const btn = document.getElementById(id);
  btn.ontouchstart = e => { e.preventDefault(); keys[key] = true; };
  btn.ontouchend   = e => { e.preventDefault(); keys[key] = false; };
});

// إعادة اللعب باللمس
canvas.addEventListener("touchstart", () => {
  if (gameOver) initGame();
});

// ===== تصادم =====
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ===== تحديث =====
function update() {
  if (gameOver) return;

  player.vx = 0;
  if (keys.ArrowRight) player.vx = player.speed;
  if (keys.ArrowLeft)  player.vx = -player.speed;

  if (keys.Space && player.onGround) {
    player.vy = player.jump;
    player.onGround = false;
  }

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;
  player.onGround = false;

  // تصادم المنصات
  platforms.forEach(p => {
    if (collide(player, p) && player.vy > 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  });

  // جمع العملات
  coinsArr.forEach(c => {
    if (!c.taken && Math.hypot(player.x - c.x, player.y - c.y) < 25) {
      c.taken = true;
      coins++;
      coinsText.textContent = coins + " | 🏆 أعلى نتيجة: " + bestScore;
    }
  });

  // الباب
  if (collide(player, door)) {
    endGame("🎉 ربحت! اضغط لإعادة اللعب");
  }

  // السقوط في فجوة
  if (player.y > canvas.height) {
    explosion = { x: player.x, y: 360, r: 10 };
    endGame("💥 سقطت! اضغط لإعادة اللعب");
  }

  cameraX = player.x - canvas.width / 2;
  cameraX = Math.max(0, Math.min(cameraX, worldWidth - canvas.width));
}

// ===== نهاية =====
function endGame(msg) {
  gameOver = true;
  message = msg;

  if (coins > bestScore) {
    bestScore = coins;
    localStorage.setItem("bestScore", bestScore);
  }
}

// ===== رسم =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // الخلفية
  if (bgImg.complete) {
    for (let x = -cameraX % canvas.width; x < canvas.width; x += canvas.width) {
      ctx.drawImage(bgImg, x, 0, canvas.width, canvas.height);
    }
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  // المنصات
  ctx.fillStyle = "#654321";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  // اللاعب
  if (!gameOver && playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  }

  // العملات
  coinsArr.forEach(c => {
    if (!c.taken) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "gold";
      ctx.fill();
    }
  });

  // الباب
  ctx.fillStyle = "brown";
  ctx.fillRect(door.x, door.y, door.w, door.h);

  // 💥 انفجار
  if (explosion) {
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.r, 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
    explosion.r += 3;
  }

  ctx.restore();

  // رسالة النهاية
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText(message, 160, 220);
  }
}

// ===== حلقة =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

initGame();
loop();
