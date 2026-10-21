const spirit = document.querySelector('.spirit');
const world = document.querySelector('.world');
const secondPageElements = [...document.querySelectorAll('.second-page-element')];
const fireworkLauncher = document.querySelector('.firework-launcher');
const fireworkLayer = document.querySelector('.firework-layer');
const fireworkMatchCursor = document.querySelector('.firework-match-cursor');
const partyGirl = document.querySelector('.page-two-character');
const partyGirlImage = document.querySelector('.party-girl-image');
let awakened = false;

function toggleSpirit() {
  awakened = !awakened;
  spirit.classList.toggle('transformed', awakened);
  spirit.setAttribute('aria-label', awakened ? '魔丸，点击切换回灵珠' : '灵珠，点击切换为魔丸');
}

spirit.addEventListener('click', toggleSpirit);

const palmTrees = [...document.querySelectorAll('.palm-tree')];
const palmRustleSound = document.querySelector('.palm-rustle-sound');
const leftPalmTree = document.querySelector('.palm-tree-2');
const easterEgg = document.querySelector('.easter-egg');
const eggDialog = document.querySelector('.egg-dialog');
const eggEatButton = document.querySelector('.egg-eat');
const fishingExclamation = document.querySelector('.fishing-exclamation');
const necklaceDialog = document.querySelector('.necklace-dialog');
const necklaceWearButton = document.querySelector('.necklace-wear');
const pageTwoFisher = document.querySelector('.page-two-fisher');
const pageTwoNecklace = document.querySelector('.page-two-necklace');
const pageTwoRewardFarmer = document.querySelector('.page-two-reward-farmer');
const rewardFarmerImage = pageTwoRewardFarmer.querySelector('img');
const pageTwoCat = document.querySelector('.page-two-cat');
const blackCatImage = document.querySelector('.black-cat-image');
const catMeowSound = document.querySelector('.cat-meow-sound');
const birthdayDialog = document.querySelector('.birthday-dialog');
const birthdayDismiss = document.querySelector('.birthday-dismiss');
const birthdayGirlSource = '素材/Fig.8.3像素少女温柔撸猫.png';
const birthdayFarmerSource = '素材/Fig.10.1像素风花束围巾少年.png';
// Warm the two portraits while the earlier scenes are playing.
[birthdayGirlSource, birthdayFarmerSource].forEach(source => {
  const portrait = new Image();
  portrait.src = source;
});
let palmShakeInProgress = false;
let completedPalmShakes = 0;
let easterEggReleased = false;
let easterEggLanded = false;
let easterEggEaten = false;
let necklaceRevealStarted = false;
let necklaceReady = false;
let necklaceClaimed = false;
let catSettled = false;
let birthdaySurpriseStarted = false;
let catMeowGeneration = 0;
let catMeowTimeout = 0;

function stopCatMeow() {
  catMeowGeneration += 1;
  clearTimeout(catMeowTimeout);
  if (!catMeowSound) return;
  catMeowSound.pause();
  try { catMeowSound.currentTime = 0; } catch {}
}

function playCatMeow() {
  if (!catMeowSound || document.hidden) return;
  const token = ++catMeowGeneration;
  try {
    catMeowSound.currentTime = 0;
    catMeowSound.volume = .65;
    // Skip a late download rather than meow after the entrance has finished.
    catMeowTimeout = window.setTimeout(() => {
      if (token === catMeowGeneration) stopCatMeow();
    }, 700);
    // Start in the necklace button's gesture, together with the cat's entrance.
    Promise.resolve(catMeowSound.play()).then(() => {
      if (token !== catMeowGeneration || document.hidden) catMeowSound.pause();
      else clearTimeout(catMeowTimeout);
    }).catch(() => {
      if (token === catMeowGeneration) clearTimeout(catMeowTimeout);
    });
  } catch {
    clearTimeout(catMeowTimeout);
    // A missing sound or denied playback must never interrupt the story.
  }
}

function playPalmRustle() {
  if (!palmRustleSound) return;
  try {
    // One shared player keeps rapid clicks and the two trees from layering audio.
    palmRustleSound.currentTime = 0;
    palmRustleSound.volume = .6;
    palmRustleSound.play()?.catch(() => {});
  } catch {
    // Audio availability must not interrupt the tree animation or egg counter.
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    palmRustleSound?.pause();
    stopCatMeow();
  }
});
window.addEventListener('pagehide', () => {
  palmRustleSound?.pause();
  stopCatMeow();
});

function shakePalms() {
  if (palmShakeInProgress) return;
  palmShakeInProgress = true;
  playPalmRustle();
  palmTrees.forEach(tree => {
    tree.classList.remove('shaking');
    void tree.offsetWidth;
    tree.classList.add('shaking');
  });
}

palmTrees.forEach(tree => {
  tree.addEventListener('click', shakePalms);
  tree.addEventListener('animationend', event => {
    if (event.animationName !== 'tree-shake') return;
    tree.classList.remove('shaking');
    if (!palmShakeInProgress || palmTrees.some(palm => palm.classList.contains('shaking'))) return;
    palmShakeInProgress = false;
    if (!pageTwoStarted || easterEggReleased) return;

    completedPalmShakes += 1;
    palmTrees.forEach(palm => palm.setAttribute('aria-label', `摇晃棕榈树，${completedPalmShakes}/6`));
    if (completedPalmShakes === 6) releaseEasterEgg();
  });
});

async function releaseEasterEgg() {
  if (easterEggReleased) return;
  easterEggReleased = true;

  const worldBounds = world.getBoundingClientRect();
  const treeBounds = leftPalmTree.getBoundingClientRect();
  const eggBounds = easterEgg.getBoundingClientRect();
  const startX = treeBounds.left - worldBounds.left + world.scrollLeft + treeBounds.width * .5;
  const startY = treeBounds.top - worldBounds.top + world.scrollTop + treeBounds.height * .16;
  const baseX = treeBounds.left - worldBounds.left + world.scrollLeft + treeBounds.width * .5;
  const baseY = Math.min(
    treeBounds.bottom - worldBounds.top + world.scrollTop - eggBounds.height / 2,
    worldBounds.height - eggBounds.height / 2 - 2
  );
  const targetX = worldBounds.width * .68;
  const targetY = Math.min(
    worldBounds.height - eggBounds.height / 2 - 2,
    worldBounds.height * .90 + eggBounds.height * 2
  );
  const dropX = -worldBounds.width * .012;
  const dropY = Math.max(0, baseY - startY - worldBounds.height * .025);
  const rollX = targetX - baseX - dropX;
  const rollY = targetY - baseY + worldBounds.height * .025;
  const startLeft = startX - eggBounds.width / 2;
  const startTop = startY - eggBounds.height / 2;
  const landedLeft = startLeft + dropX;
  const landedTop = startTop + dropY;
  const targetLeft = targetX - eggBounds.width / 2;
  const targetTop = targetY - eggBounds.height / 2;

  easterEgg.style.left = `${startLeft}px`;
  easterEgg.style.top = `${startTop}px`;
  easterEgg.style.rotate = '0deg';
  easterEgg.classList.add('released');
  easterEgg.setAttribute('aria-hidden', 'false');

  const fall = easterEgg.animate([
    { left: `${startLeft}px`, top: `${startTop}px`, rotate: '0deg', scale: '1', offset: 0 },
    { left: `${startLeft + dropX * .35}px`, top: `${startTop + dropY * .78}px`, rotate: '65deg', scale: '1', offset: .76 },
    { left: `${landedLeft}px`, top: `${landedTop}px`, rotate: '105deg', scale: '1.08 .9', offset: .93 },
    { left: `${landedLeft}px`, top: `${landedTop}px`, rotate: '105deg', scale: '1', offset: 1 }
  ], { duration: 1080, easing: 'cubic-bezier(.18,.66,.28,1)', fill: 'forwards' });
  await fall.finished;
  easterEgg.style.left = `${landedLeft}px`;
  easterEgg.style.top = `${landedTop}px`;
  easterEgg.style.rotate = '105deg';
  fall.cancel();

  const roll = easterEgg.animate([
    { left: `${landedLeft}px`, top: `${landedTop}px`, rotate: '105deg', scale: '1', offset: 0 },
    { left: `${landedLeft + rollX * .08}px`, top: `${landedTop + rollY * .08}px`, rotate: '145deg', scale: '1.04 .96', offset: .12 },
    { left: `${landedLeft + rollX * .28}px`, top: `${landedTop + rollY * .28}px`, rotate: '250deg', scale: '1', offset: .32 },
    { left: `${targetLeft}px`, top: `${targetTop}px`, rotate: '465deg', scale: '1', offset: 1 }
  ], { duration: 3200, easing: 'cubic-bezier(.16,.58,.28,1)', fill: 'forwards' });
  await roll.finished;
  easterEgg.style.left = `${targetLeft}px`;
  easterEgg.style.top = `${targetTop}px`;
  easterEgg.style.rotate = '465deg';
  roll.cancel();
  easterEgg.classList.add('glowing');
  easterEgg.classList.add('landed');
  easterEggLanded = true;
  easterEgg.tabIndex = 0;
}

function openEggDialog() {
  if (!easterEggLanded) return;
  eggDialog.classList.add('open');
  eggDialog.setAttribute('aria-hidden', 'false');
  eggEatButton.focus();
}

function closeEggDialog({ focusEgg = true } = {}) {
  eggDialog.classList.remove('open');
  eggDialog.setAttribute('aria-hidden', 'true');
  if (focusEgg && easterEgg.classList.contains('landed')) {
    easterEgg.focus({ preventScroll: true });
  }
}

function eatEasterEgg() {
  if (easterEggEaten) return;
  easterEggEaten = true;
  closeEggDialog({ focusEgg: false });
  partyGirlImage.src = '素材/Fig.8.1戴生日帽的吃蛋少女.png?v=20261017203310';
  partyGirlImage.alt = '正在吃彩蛋的派对少女';
  partyGirl.classList.add('egg-eaten');
  partyGirl.setAttribute('aria-label', '正在吃彩蛋的少女');
  easterEgg.classList.remove('landed', 'glowing');
  easterEgg.classList.add('eaten');
  easterEgg.setAttribute('aria-hidden', 'true');
  easterEgg.tabIndex = -1;
  window.setTimeout(showFishingExclamation, 1000);
}

function showFishingExclamation() {
  if (!pageTwoStarted || necklaceRevealStarted) return;
  fishingExclamation.disabled = false;
  fishingExclamation.classList.add('visible');
  fishingExclamation.setAttribute('aria-hidden', 'false');
}

function revealNecklace() {
  if (!pageTwoStarted || necklaceRevealStarted || fishingExclamation.disabled) return;
  necklaceRevealStarted = true;
  const worldBounds = world.getBoundingClientRect();
  const fisherBounds = pageTwoFisher.getBoundingClientRect();
  const sourceX = (fisherBounds.left - worldBounds.left + fisherBounds.width * .19) / worldBounds.width * 100;
  const sourceY = (fisherBounds.top - worldBounds.top + fisherBounds.height * .84) / worldBounds.height * 100;

  fishingExclamation.classList.remove('visible');
  fishingExclamation.setAttribute('aria-hidden', 'true');
  fishingExclamation.disabled = true;
  pageTwoFisher.classList.add('caught');
  pageTwoFisher.setAttribute('aria-hidden', 'true');
  pageTwoRewardFarmer.classList.add('earned');
  pageTwoRewardFarmer.setAttribute('aria-hidden', 'false');

  pageTwoNecklace.classList.add('flying');
  pageTwoNecklace.setAttribute('aria-hidden', 'false');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flight = pageTwoNecklace.animate([
    { left: `${sourceX}%`, top: `${sourceY}%`, transform: 'translate(-50%, -50%) scale(.08)' },
    { left: '66%', top: '49%', transform: 'translate(-50%, -50%) scale(1)' }
  ], { duration: reducedMotion ? 1 : 1350, easing: 'cubic-bezier(.2,.68,.24,1)', fill: 'both' });
  flight.addEventListener('finish', () => {
    pageTwoNecklace.classList.remove('flying');
    pageTwoNecklace.classList.add('visible');
    flight.cancel();
    necklaceReady = true;
    necklaceDialog.classList.add('open');
    necklaceDialog.setAttribute('aria-hidden', 'false');
    necklaceWearButton.focus({ preventScroll: true });
  }, { once: true });
}

function wearNecklace() {
  if (!necklaceReady || necklaceClaimed) return;
  necklaceClaimed = true;
  necklaceWearButton.blur();
  necklaceDialog.classList.remove('open');
  necklaceDialog.setAttribute('aria-hidden', 'true');
  pageTwoNecklace.classList.remove('flying', 'visible');
  pageTwoNecklace.setAttribute('aria-hidden', 'true');

  partyGirl.classList.remove('egg-eaten');
  partyGirlImage.src = '素材/Fig.8.2像素风女孩与蓝宝石项链.png?v=20261017202554';
  partyGirlImage.alt = '戴上蓝宝石项链的派对少女';
  partyGirl.classList.add('necklace-reveal');
  partyGirl.setAttribute('aria-label', '戴上蓝宝石项链的派对少女');

  pageTwoCat.classList.add('walking');
  pageTwoCat.setAttribute('aria-hidden', 'false');
  playCatMeow();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const catWalk = pageTwoCat.animate([
    { left: '81%', top: '79%', opacity: 0, transform: 'translateY(0)' },
    { left: '75%', top: '78%', opacity: 1, transform: 'translateY(-4px)', offset: .17 },
    { left: '64%', top: '79%', opacity: 1, transform: 'translateY(0)', offset: .36 },
    { left: '52%', top: '78%', opacity: 1, transform: 'translateY(-4px)', offset: .56 },
    { left: '40%', top: '79%', opacity: 1, transform: 'translateY(0)', offset: .78 },
    { left: '26%', top: '78%', opacity: 1, transform: 'translateY(0)' }
  ], { duration: reducedMotion ? 1 : 3000, easing: 'linear', fill: 'both' });
  catWalk.addEventListener('finish', () => {
    pageTwoCat.style.left = '26%';
    pageTwoCat.style.top = '78%';
    pageTwoCat.style.width = '22%';
    pageTwoCat.style.transform = 'none';
    pageTwoCat.classList.remove('walking');
    blackCatImage.src = '素材/Fig.11.2像素风黑猫与金铃铛.png';
    blackCatImage.alt = '坐在女孩和农场少年身旁的黑猫';
    pageTwoCat.classList.add('sitting');
    catWalk.cancel();
    catSettled = true;
    pageTwoCat.disabled = false;
  }, { once: true });
}

function petBirthdayCat() {
  if (!pageTwoStarted || !necklaceClaimed || !catSettled || birthdaySurpriseStarted) return;
  birthdaySurpriseStarted = true;
  stopCatMeow();
  catSettled = false;
  pageTwoCat.disabled = true;
  pageTwoCat.classList.remove('sitting');
  pageTwoCat.classList.add('petted');
  pageTwoCat.setAttribute('aria-hidden', 'true');

  partyGirlImage.src = birthdayGirlSource;
  partyGirlImage.alt = '戴着蓝宝石项链、温柔抚摸黑猫的生日少女';
  partyGirl.classList.remove('necklace-reveal');
  partyGirl.classList.add('cat-petted');
  partyGirl.setAttribute('aria-label', '温柔抚摸黑猫的生日少女');

  rewardFarmerImage.src = birthdayFarmerSource;
  rewardFarmerImage.alt = '捧着冰蓝花束和奶油色围巾的草帽少年';
  pageTwoRewardFarmer.classList.add('gift-reveal');
  pageTwoRewardFarmer.setAttribute('aria-label', '送上花束和围巾的草帽少年');

  birthdayDialog.classList.add('open');
  birthdayDialog.setAttribute('aria-hidden', 'false');
  birthdayDialog.focus({ preventScroll: true });
  window.launchBirthdayCakeFirework({ world, layer: fireworkLayer, launcher: fireworkLauncher });
}

function closeBirthdayDialog() {
  birthdayDialog.classList.remove('open');
  birthdayDialog.setAttribute('aria-hidden', 'true');
  fireworkLauncher.focus({ preventScroll: true });
}

pageTwoCat.addEventListener('click', petBirthdayCat);
birthdayDismiss.addEventListener('click', closeBirthdayDialog);
birthdayDialog.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeBirthdayDialog();
  }
});

easterEgg.addEventListener('click', openEggDialog);
easterEgg.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && easterEggLanded) {
    event.preventDefault();
    openEggDialog();
  }
});
eggEatButton.addEventListener('click', eatEasterEgg);
fishingExclamation.addEventListener('click', revealNecklace);
necklaceWearButton.addEventListener('click', wearNecklace);

const messageBottle = document.querySelector('.message-bottle');
const mysteryLetter = document.querySelector('.mystery-letter');
const letterDismiss = document.querySelector('.letter-dismiss');
let sequenceUnlocked = false;
let letterVisible = false;

function openLetter() {
  if (letterVisible) return;
  sequenceUnlocked = true;
  letterVisible = true;
  mysteryLetter.classList.add('open');
  mysteryLetter.setAttribute('aria-hidden', 'false');
  messageBottle.classList.add('opened');
  messageBottle.setAttribute('aria-label', '漂流瓶中的神秘来信已打开');
}

messageBottle.addEventListener('click', openLetter);
letterDismiss.addEventListener('click', () => {
  letterVisible = false;
  mysteryLetter.classList.remove('open');
  mysteryLetter.setAttribute('aria-hidden', 'true');
});

const calendarSheet = document.querySelector('.calendar-sheet');
let sheetGesture = null;
let sheetDropped = false;
let pageTwoStarted = false;

function enterSecondPage() {
  if (pageTwoStarted) return;
  world.scrollLeft = 0;
  world.scrollTop = 0;
  pageTwoStarted = true;
  world.classList.add('page-two');
  window.islandMusic?.setScene('festival');
  world.setAttribute('aria-label', '海岛奇缘第二页');
  secondPageElements.forEach(element => element.setAttribute('aria-hidden', 'false'));
  fireworkLauncher.disabled = false;
}

function dropCalendarSheet() {
  if (sheetDropped) return;
  sheetDropped = true;
  sheetGesture = null;
  enterSecondPage();
  calendarSheet.classList.remove('dragging');
  calendarSheet.classList.add('falling');
}

calendarSheet.addEventListener('pointerdown', event => {
  if (!sequenceUnlocked || sheetDropped || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const bounds = calendarSheet.getBoundingClientRect();
  const startsAtBottomRight = event.clientX >= bounds.left + bounds.width * .68 &&
    event.clientY >= bounds.top + bounds.height * .68;
  if (!startsAtBottomRight) return;
  sheetGesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  calendarSheet.classList.add('dragging');
  calendarSheet.setPointerCapture(event.pointerId);
  event.preventDefault();
});

calendarSheet.addEventListener('pointermove', event => {
  if (!sheetGesture || event.pointerId !== sheetGesture.id) return;
  const distance = Math.hypot(event.clientX - sheetGesture.x, event.clientY - sheetGesture.y);
  if (distance >= 26) dropCalendarSheet();
});

calendarSheet.addEventListener('pointerup', event => {
  if (sheetGesture && event.pointerId === sheetGesture.id) {
    sheetGesture = null;
    calendarSheet.classList.remove('dragging');
  }
});

calendarSheet.addEventListener('pointercancel', () => {
  sheetGesture = null;
  calendarSheet.classList.remove('dragging');
});

calendarSheet.addEventListener('animationend', event => {
  if (event.animationName === 'calendar-drop') {
    world.classList.add('page-two-ready');
  }
});

function launchFirework() {
  window.launchIslandFirework?.({ world, layer: fireworkLayer, launcher: fireworkLauncher });
}

function hideFireworkMatchCursor() {
  world.classList.remove('match-cursor-active');
}

function updateFireworkMatchCursor(event) {
  if (!pageTwoStarted || event.pointerType === 'touch') {
    hideFireworkMatchCursor();
    return;
  }

  const worldBounds = world.getBoundingClientRect();
  const launcherBounds = fireworkLauncher.getBoundingClientRect();
  const proximity = worldBounds.width * .04;
  const nearLauncher = event.clientX >= launcherBounds.left - proximity &&
    event.clientX <= launcherBounds.right + proximity &&
    event.clientY >= launcherBounds.top - proximity &&
    event.clientY <= launcherBounds.bottom + proximity;
  if (!nearLauncher) {
    hideFireworkMatchCursor();
    return;
  }

  fireworkMatchCursor.style.left = `${event.clientX - worldBounds.left}px`;
  fireworkMatchCursor.style.top = `${event.clientY - worldBounds.top}px`;
  world.classList.add('match-cursor-active');
}

world.addEventListener('pointermove', updateFireworkMatchCursor);
world.addEventListener('pointerleave', hideFireworkMatchCursor);
fireworkLauncher.addEventListener('click', launchFirework);
fireworkLauncher.addEventListener('animationend', event => {
  if (event.animationName === 'firework-box-ignite') fireworkLauncher.classList.remove('igniting');
});
