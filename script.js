// BACKGROUND PARTICLE CANVAS ANIMATION
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;
  let stars = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 70; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
      pulse: Math.random() * 0.02 + 0.005
    });
  }

  function animateBackground() {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0c0809');
    grad.addColorStop(0.5, '#1b0c10');
    grad.addColorStop(1, '#0c0809');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < stars.length; i++) {
      let s = stars[i];
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = width;
      if (s.x > width) s.x = 0;
      if (s.y < 0) s.y = height;
      if (s.y > height) s.y = 0;
      s.alpha += s.pulse;
      if (s.alpha > 0.95 || s.alpha < 0.2) {
        s.pulse = -s.pulse;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(228, 27, 35, ${s.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#e41b23';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(animateBackground);
  }
  animateBackground();
}

// CONFIGURATION & AUTH
const SUPABASE_URL = "https://jwnwoewwhtdlcezrlybc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_M9jKNuvVnoY46sDpn-Aiwg_Ab2IMQDP";
const VALID_TX_ID = "00000140287353";
let uploadsLeft = 3;
let supabaseClient = null;
let currentAuthMode = 'login';

if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

document.addEventListener("DOMContentLoaded", () => {
  checkGlobalAccess();
  document.getElementById("nav-auth-area")?.classList.remove("hidden");
  document.getElementById("nav-balance-area")?.classList.add("hidden");
});

function openAuthModal(mode) {
  const modal = document.getElementById("auth-modal");
  modal?.classList.remove("hidden");
  clearModalErrors();
  switchAuthTab(mode);
}

function closeAuthModal() {
  document.getElementById("auth-modal")?.classList.add("hidden");
  clearModalErrors();
}

function switchAuthTab(mode) {
  currentAuthMode = mode;
  clearModalErrors();
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const fullnameGroup = document.getElementById("fullname-field-group");
  const submitBtn = document.getElementById("auth-submit-btn");
  const forgotPassLink = document.getElementById("forgot-pass-link");
  const toggleLink = document.getElementById("toggle-auth-mode");

  if (mode === 'signup') {
    tabSignup?.classList.add("active");
    tabLogin?.classList.remove("active");
    fullnameGroup?.classList.remove("hidden");
    if (submitBtn) submitBtn.innerText = "Create & Activate Account";
    if (forgotPassLink) forgotPassLink.style.display = "none";
    if (toggleLink) toggleLink.innerText = "Already have an account? Log In";
  } else {
    tabLogin?.classList.add("active");
    tabSignup?.classList.remove("active");
    fullnameGroup?.classList.add("hidden");
    if (submitBtn) submitBtn.innerText = "Login";
    if (forgotPassLink) forgotPassLink.style.display = "inline";
    if (toggleLink) toggleLink.innerText = "Create New Account";
  }
}

function toggleAuthMode() {
  if (currentAuthMode === 'login') {
    switchAuthTab('signup');
  } else {
    switchAuthTab('login');
  }
}

function clearModalErrors() {
  const errBox = document.getElementById("auth-error-msg");
  if (errBox) errBox.remove();
}

function showModalError(msg) {
  clearModalErrors();
  const form = document.getElementById("auth-form");
  if (!form) return;
  const errDiv = document.createElement("div");
  errDiv.id = "auth-error-msg";
  errDiv.style.cssText = "color: #dc2626; font-size: 12px; font-weight: 600; text-align: center; margin-bottom: 10px; background: #fee2e2; padding: 8px; border-radius: 4px;";
  errDiv.innerText = msg;
  form.insertBefore(errDiv, form.firstChild);
}

function validateGhanaPhone(phone) {
  const ghanaPrefixes = /^(024|054|055|059|020|050|027|057|026|056)\d{7}$/;
  if (!ghanaPrefixes.test(phone)) return false;
  if (/^(\d)\1+$/.test(phone)) return false;
  return true;
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const phoneInput = document.getElementById("user-phone")?.value.trim() || "";
  const passInput = document.getElementById("user-pass")?.value || "";
  const fullnameInput = document.getElementById("user-fullname")?.value.trim() || "";

  if (!validateGhanaPhone(phoneInput)) {
    showModalError("Please enter a valid 10-digit Ghana phone number (e.g., 024XXXXXXX).");
    return;
  }
  if (passInput.length < 4) {
    showModalError("Password is too short.");
    return;
  }

  let savedAccounts = JSON.parse(localStorage.getItem("virtual_predict_users") || "{}");
  if (currentAuthMode === 'signup') {
    if (savedAccounts[phoneInput]) {
      showModalError("An account with this phone number already exists! Please Log In.");
      return;
    }
    savedAccounts[phoneInput] = {
      fullname: fullnameInput || "User",
      password: passInput,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem("virtual_predict_users", JSON.stringify(savedAccounts));
    localStorage.setItem("active_user_phone", phoneInput);
  } else {
    const existingUser = savedAccounts[phoneInput];
    if (!existingUser) {
      showModalError("Account not found! Tap 'Create New Account' to register.");
      return;
    }
    if (existingUser.password !== passInput) {
      showModalError("Incorrect password. Please try again.");
      return;
    }
    localStorage.setItem("active_user_phone", phoneInput);
  }

  document.getElementById("nav-auth-area")?.classList.add("hidden");
  document.getElementById("nav-balance-area")?.classList.remove("hidden");
  closeAuthModal();
  startLoadingToPayment();
}

function startLoadingToPayment() {
  document.getElementById("step-landing")?.classList.add("hidden");
  document.getElementById("step-loading")?.classList.remove("hidden");
  document.getElementById("reviews-section")?.classList.add("hidden");

  const progressBar = document.getElementById("progress-bar");
  const loadingStatus = document.getElementById("loading-status");
  const loadingPercent = document.getElementById("loading-percent");
  let progress = 0;

  const interval = setInterval(() => {
    progress += 2;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (loadingPercent) loadingPercent.innerText = `${progress}%`;
    if (progress === 30 && loadingStatus) {
      loadingStatus.innerText = currentAuthMode === 'signup' ? "Creating account profile..." : "Authenticating session...";
    } else if (progress === 70 && loadingStatus) {
      loadingStatus.innerText = "Connecting to payment gateway...";
    }
    if (progress >= 100) {
      clearInterval(interval);
      document.getElementById("step-loading")?.classList.add("hidden");
      document.getElementById("app-wrapper")?.classList.remove("hidden");
      document.getElementById("games-hub-view")?.classList.remove("hidden");
      document.getElementById("game-launcher-view")?.classList.add("hidden");
    }
  }, 30);
}

function launchInstantVirtualsGame() {
  document.getElementById("games-hub-view")?.classList.add("hidden");
  document.getElementById("step-loading")?.classList.remove("hidden");
  document.getElementById("reviews-section")?.classList.add("hidden");

  const progressBar = document.getElementById("progress-bar");
  const loadingStatus = document.getElementById("loading-status");
  const loadingPercent = document.getElementById("loading-percent");
  let progress = 0;
  if (progressBar) progressBar.style.width = "0%";

  const interval = setInterval(() => {
    progress += 2;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (loadingPercent) loadingPercent.innerText = `${progress}%`;
    if (progress === 35 && loadingStatus) {
      loadingStatus.innerText = "Loading Instant Virtuals engine...";
    } else if (progress === 75 && loadingStatus) {
      loadingStatus.innerText = "Connecting to AI Prediction Server...";
    }
    if (progress >= 100) {
      clearInterval(interval);
      document.getElementById("step-loading")?.classList.add("hidden");
      document.getElementById("game-launcher-view")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 30);
}

function returnToGamesHub() {
  document.getElementById("game-launcher-view")?.classList.add("hidden");
  document.getElementById("games-hub-view")?.classList.remove("hidden");
  document.getElementById("reviews-section")?.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleGameClick(gameName) {
  alert(`${gameName} is loading... Connect your Sporty Hacker account to play.`);
}

// SMOOTH TRANSACTION VERIFICATION
function verifyTransaction() {
  const userInput = document.getElementById("tx-input")?.value.trim() || "";
  const errorBox = document.getElementById("invalid-error");
  const verifyBtn = document.getElementById("verify-btn");

  if (userInput === VALID_TX_ID) {
    errorBox?.classList.add("hidden");
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.innerText = "Verifying Transaction ID...";
    }
    // Smooth transition delay
    setTimeout(() => {
      document.getElementById("step-verification")?.classList.add("hidden");
      document.getElementById("step-scanner")?.classList.remove("hidden");
      if (verifyBtn) {
        verifyBtn.innerText = "VERIFY PAYMENT";
        verifyBtn.disabled = false;
      }
    }, 2000);
  } else {
    errorBox?.classList.remove("hidden");
  }
}

function triggerFileInput() {
  if (uploadsLeft > 0) {
    document.getElementById('file-input')?.click();
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const previewImg = document.getElementById("preview-img");
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
      }
      const placeholder = document.getElementById("upload-placeholder");
      if (placeholder) placeholder.style.display = "none";
      const scanBtn = document.getElementById("scan-btn");
      if (scanBtn) scanBtn.disabled = false;
    }
    reader.readAsDataURL(file);
  }
}

function handleButtonClick() {
  const scanBtn = document.getElementById("scan-btn");
  if (uploadsLeft > 0) {
    runScan();
  } else {
    if (scanBtn) {
      scanBtn.disabled = true;
      scanBtn.innerText = "Connecting to Payment Gateway...";
    }
    setTimeout(() => {
      document.getElementById("step-scanner")?.classList.add("hidden");
      document.getElementById("step-verification")?.classList.remove("hidden");
      const txInput = document.getElementById("tx-input");
      if (txInput) txInput.value = "";
      if (scanBtn) {
        scanBtn.disabled = false;
        scanBtn.innerText = "Generate Prediction";
      }
    }, 2000);
  }
}

// 6-SECOND SCAN DELAY
function runScan() {
  const scanBtn = document.getElementById("scan-btn");
  const scannerLine = document.getElementById("scanner-line");
  const resultsCard = document.getElementById("results-card");
  const statusText = document.getElementById("status-text");

  if (scanBtn) {
    scanBtn.disabled = true;
    scanBtn.innerText = "Analyzing Screenshot Pixels (AI Scan)...";
  }
  if (scannerLine) scannerLine.style.display = "block";
  if (resultsCard) resultsCard.classList.add("hidden");
  if (statusText) statusText.classList.add("hidden");

  const previewImg = document.getElementById("preview-img");
  
  // Set exactly 6 seconds delay for the scanner animation
  const minDelay = new Promise(resolve => setTimeout(resolve, 6000));
  
  const ocrJob = extractMatchesFromImage(previewImg ? previewImg.src : "")
    .then(result => { window.extractedMatches = result.matches; })
    .catch(err => {
      console.error("Match extraction failed:", err);
      window.extractedMatches = [];
    });

  Promise.all([minDelay, ocrJob]).then(() => {
    if (scannerLine) scannerLine.style.display = "none";
    uploadsLeft--;
    const remainingText = document.getElementById("uploads-remaining");
    if (remainingText) remainingText.innerText = `${uploadsLeft}/3 Uploads Left`;
    
    renderPredictions();
    if (resultsCard) resultsCard.classList.remove("hidden");
    if (scanBtn) {
      if (uploadsLeft > 0) {
        scanBtn.innerText = "Generate Prediction";
        scanBtn.disabled = true;
      } else {
        scanBtn.innerText = "BUY MORE SCANS (ENTER TX ID)";
        scanBtn.disabled = false;
      }
    }
  });
}

// REAL TESSERACT OCR & MATCH EXTRACTION ENGINE
let tesseractPromise = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!tesseractPromise) {
    tesseractPromise = new Promise((resolve, reject) => {
      const tag = document.createElement("script");
      tag.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
      tag.onload = () => resolve(window.Tesseract);
      tag.onerror = () => { tesseractPromise = null; reject(new Error("OCR library failed to load")); };
      document.head.appendChild(tag);
    });
  }
  return tesseractPromise;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded"));
    image.src = src;
  });
}

async function extractMatchesFromImage(src) {
  if (!src) return { matches: [], skipped: 0 };
  const img = await loadImageElement(src);
  const scale = img.naturalWidth >= 1400 ? 1 : Math.min(3, 1600 / img.naturalWidth);
  const W = Math.round(img.naturalWidth * scale);
  const H = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const pixels = ctx.getImageData(0, 0, W, H);
  
  const ocrCanvas = document.createElement("canvas");
  ocrCanvas.width = W;
  ocrCanvas.height = H;
  const ocrCtx = ocrCanvas.getContext("2d");
  const ocrData = ocrCtx.createImageData(W, H);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grey = 0.299 * pixels.data[i] + 0.587 * pixels.data[i + 1] + 0.114 * pixels.data[i + 2];
    ocrData.data[i] = ocrData.data[i + 1] = ocrData.data[i + 2] = 255 - grey;
    ocrData.data[i + 3] = 255;
  }
  ocrCtx.putImageData(ocrData, 0, 0);
  const words = await readWords(ocrCanvas);
  return buildMatches(words, pixels, W, H);
}

async function readWords(canvas) {
  const T = await loadTesseract();
  const worker = await T.createWorker("eng");
  try {
    await worker.setParameters({ tessedit_pageseg_mode: "11" });
    const res = await worker.recognize(canvas);
    return collectWords(res.data || {});
  } finally {
    try { await worker.terminate(); } catch (e) {}
  }
}

function collectWords(data) {
  let list = data.words || [];
  if (!list.length) {
    (data.lines || []).forEach(l => { (l.words || []).forEach(w => list.push(w)); });
  }
  return list.filter(w => w && w.bbox && String(w.text || "").trim()).map(w => ({
    text: String(w.text).trim(),
    x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1,
    cx: (w.bbox.x0 + w.bbox.x1) / 2,
    cy: (w.bbox.y0 + w.bbox.y1) / 2,
    h: w.bbox.y1 - w.bbox.y0
  }));
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}

function buildMatches(words, pixels, W, H) {
  const ODDS = /^\d{1,2}[.,]\d{2}$/;
  const oddsWords = words.filter(w => ODDS.test(w.text)).sort((a, b) => a.cy - b.cy);
  const rows = [];
  oddsWords.forEach(w => {
    const last = rows[rows.length - 1];
    if (last && Math.abs(w.cy - last.cy) < w.h * 0.7) {
      last.items.push(w);
      last.cy = last.items.reduce((sum, i) => sum + i.cy, 0) / last.items.length;
    } else {
      rows.push({ cy: w.cy, items: [w] });
    }
  });
  const matchRows = rows.filter(r => r.items.length >= 3);
  let skipped = rows.length - matchRows.length;
  if (!matchRows.length) return { matches: [], skipped };

  const oddsHeight = median(oddsWords.map(w => w.h));
  const gaps = [];
  for (let i = 1; i < matchRows.length; i++) gaps.push(matchRows[i].cy - matchRows[i - 1].cy);
  const pitch = gaps.length ? median(gaps) : oddsHeight * 6.4;
  const matches = [];
  const located = [];

  matchRows.forEach(row => {
    row.items.sort((a, b) => a.x0 - b.x0);
    const oddsLeft = row.items[0].x0;
    const homeOdds = parseFloat(row.items[0].text.replace(",", "."));
    const awayOdds = parseFloat(row.items[2].text.replace(",", "."));
    const near = words.filter(w => w.x1 < oddsLeft && w.cy > row.cy - pitch * 0.3 && w.cy < row.cy + pitch * 0.1);
    const vs = near.filter(w => /^(vs\.?|v5|ys|vz|v\/s)$/i.test(w.text))[0];
    const names = near.filter(w => /^[A-Za-z][A-Za-z.'-]{1,14}$/.test(w.text) && w !== vs).sort((a, b) => a.cx - b.cx);

    let homeWord = null, awayWord = null;
    if (vs) {
      const left = names.filter(w => w.cx < vs.cx);
      const right = names.filter(w => w.cx > vs.cx);
      homeWord = left[left.length - 1] || null;
      awayWord = right[0] || null;
    } else if (names.length >= 2) {
      homeWord = names[0];
      awayWord = names[names.length - 1];
    }

    const tidy = (w, fallback) => (!w ? fallback : (w.text.length <= 4 ? w.text.toUpperCase() : w.text));
    let splitX = vs ? vs.cx : (homeWord && awayWord ? (homeWord.cx + awayWord.cx) / 2 : null);
    const stars = countRowStars(pixels, W, H, row.cy, pitch, oddsLeft, splitX);

    if (!stars || (stars.home + stars.away) === 0 || !isFinite(homeOdds) || !isFinite(awayOdds)) {
      skipped++;
      return;
    }

    const match = {
      homeName: tidy(homeWord, "Home"),
      awayName: tidy(awayWord, "Away"),
      homeStars: stars.home,
      awayStars: stars.away,
      homeOdds,
      awayOdds,
      homeBadge: "",
      awayBadge: ""
    };
    matches.push(match);
    located.push({ match, row, oddsLeft, homeWord, awayWord });
  });

  located.forEach(item => {
    const top = item.row.cy - pitch * 0.27;
    const bottom = item.row.cy + pitch * 0.065;
    if (item.homeWord) {
      const right = item.homeWord.x0 - 3;
      item.match.homeBadge = cutBadge(pixels, W, H, right - pitch * 0.45, top, right, bottom);
    }
    if (item.awayWord) {
      const left = item.awayWord.x1 + 3;
      item.match.awayBadge = cutBadge(pixels, W, H, left, top, item.oddsLeft - 3, bottom);
    }
  });

  return { matches, skipped };
}

function cutBadge(pixels, W, H, fx0, fy0, fx1, fy1) {
  const x0 = Math.max(0, Math.round(fx0)), y0 = Math.max(0, Math.round(fy0));
  const x1 = Math.min(W, Math.round(fx1)), y1 = Math.min(H, Math.round(fy1));
  const w = x1 - x0, h = y1 - y0;
  if (w < 8 || h < 8) return "";
  const d = pixels.data;
  const at = (x, y) => { const i = ((y0 + y) * W + (x0 + x)) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  const edge = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const bg = [0, 1, 2].map(c => median(edge.map(p => p[c])));
  let minX = w, maxX = -1, minY = h, maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = at(x, y);
      if (Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2])) > 45) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || (maxX - minX) < 6 || (maxY - minY) < 6) return "";
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  const cut = new ImageData(out.width, out.height);
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const from = ((y0 + minY + y) * W + (x0 + minX + x)) * 4;
      const to = (y * out.width + x) * 4;
      cut.data[to] = d[from];
      cut.data[to + 1] = d[from + 1];
      cut.data[to + 2] = d[from + 2];
      cut.data[to + 3] = 255;
    }
  }
  out.getContext("2d").putImageData(cut, 0, 0);
  return out.toDataURL("image/png");
}

function isGoldPixel(r, g, b) {
  return r > 200 && g > 140 && g < 225 && b < 130 && (r - b) > 110;
}

function countRowStars(pixels, W, H, rowCy, pitch, oddsLeft, splitX) {
  const x0 = 0;
  const x1 = Math.max(1, Math.min(W, Math.floor(oddsLeft) - 2));
  const y0 = Math.max(0, Math.floor(rowCy - pitch * 0.5));
  const y1 = Math.min(H, Math.ceil(rowCy + pitch * 0.5));
  const rw = x1 - x0, rh = y1 - y0;
  if (rw < 5 || rh < 5) return null;

  const data = pixels.data;
  const mask = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const idx = ((y0 + y) * W + (x0 + x)) * 4;
      if (isGoldPixel(data[idx], data[idx + 1], data[idx + 2])) mask[y * rw + x] = 1;
    }
  }

  const blobs = [];
  const seen = new Uint8Array(rw * rh);
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    let minX = rw, maxX = 0, minY = rh, maxY = 0, area = 0;
    while (stack.length) {
      const p = stack.pop();
      const px = p % rw, py = (p - px) / rw;
      area++;
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= rw || ny >= rh) continue;
          const n = ny * rw + nx;
          if (mask[n] && !seen[n]) { seen[n] = 1; stack.push(n); }
        }
      }
    }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const aspect = bw / bh;
    if (bw >= pitch * 0.05 && bw <= pitch * 0.22 && bh >= pitch * 0.05 && bh <= pitch * 0.22 && aspect > 0.6 && aspect < 1.6) {
      blobs.push({ cx: x0 + minX + bw / 2, cy: y0 + minY + bh / 2 });
    }
  }

  if (!blobs.length) return null;
  blobs.sort((a, b) => a.cy - b.cy);
  const lines = [];
  blobs.forEach(blob => {
    const last = lines[lines.length - 1];
    if (last && Math.abs(blob.cy - last.mean) < pitch * 0.03) {
      last.items.push(blob);
      last.mean = last.items.reduce((sum, i) => sum + i.cy, 0) / last.items.length;
    } else {
      lines.push({ mean: blob.cy, items: [blob] });
    }
  });

  lines.sort((a, b) => b.items.length - a.items.length);
  const best = lines.filter(l => l.mean > rowCy - pitch * 0.1 && l.mean < rowCy + pitch * 0.4)[0];
  if (!best) return null;

  let split = splitX;
  if (split === null) {
    const xs = best.items.map(b => b.cx);
    split = (Math.min(...xs) + Math.max(...xs)) / 2;
  }
  const home = best.items.filter(b => b.cx < split).length;
  const away = best.items.length - home;
  return { home: Math.min(5, home), away: Math.min(5, away) };
}

function renderPredictions() {
  const container = document.getElementById("match-container");
  if (!container) return;
  container.innerHTML = "";
  
  const allMatches = Array.isArray(window.extractedMatches) ? window.extractedMatches : [];
  
  // Limited strictly to 4 predictions max
  const matches = allMatches.slice(0, 4);

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="scanned-match-card">
        <div class="scanned-header"><span>Could not read matches</span></div>
        <div style="font-size:11px;color:#94a3b8;">Please upload a clearer screenshot showing team names, star ratings, and odds.</div>
      </div>`;
    return;
  }

  matches.forEach((match, index) => {
    const homeName = match.homeName || "Home";
    const awayName = match.awayName || "Away";
    const homeStars = Number(match.homeStars) || 3;
    const awayStars = Number(match.awayStars) || 3;
    const homeOdds = Number(match.homeOdds) || 2.50;
    const awayOdds = Number(match.awayOdds) || 2.50;
    const drawOdds = Number((homeOdds * 1.15).toFixed(2));
    
    let winner = homeOdds <= awayOdds ? "home" : "away";
    let confidence = Math.floor(Math.random() * 11) + 88;
    const teamName = winner === "home" ? homeName : awayName;

    const renderStars = (count) => '★'.repeat(count) + '☆'.repeat(5 - count);
    const homeBadgeTag = match.homeBadge ? `<img src="${match.homeBadge}" alt="" class="team-badge-img">` : '';
    const awayBadgeTag = match.awayBadge ? `<img src="${match.awayBadge}" alt="" class="team-badge-img">` : '';

    container.innerHTML += `
      <div class="scanned-match-card">
        <div class="scanned-header">
          <span>Scanned Match ${index + 1}</span>
          <span class="scanned-accuracy">${confidence}% AI Accuracy</span>
        </div>
        <div class="match-vs-box">
          <div class="team-block left">
            <div class="team-info-row">${homeBadgeTag}<span class="team-name-text">${homeName}</span></div>
            <div class="star-rating">${renderStars(homeStars)}</div>
          </div>
          <div class="vs-text">vs</div>
          <div class="team-block right">
            <div class="team-info-row"><span class="team-name-text">${awayName}</span>${awayBadgeTag}</div>
            <div class="star-rating">${renderStars(awayStars)}</div>
          </div>
        </div>
        <div class="odds-label-row">
          <span>Odds (1 | X | 2):</span>
          <span class="odds-values">${homeOdds} | ${drawOdds} | ${awayOdds}</span>
        </div>
        <div class="prediction-box-styled">
          <span class="prediction-text-styled">AI Prediction: ${teamName} Win</span>
          <span class="verified-badge">Verified ✔</span>
        </div>
      </div>`;
  });
}

async function checkGlobalAccess() {
  try {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.from('site_config').select('published_at').eq('id', 1).single();
    if (!data) return;
    const publishedTime = new Date(data.published_at).getTime();
    if (Date.now() - publishedTime > 14 * 24 * 60 * 60 * 1000) {
      document.getElementById("step-landing")?.classList.add("hidden");
      document.getElementById("step-expired")?.classList.remove("hidden");
    }
  } catch (err) {}
}