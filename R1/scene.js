const spirit = document.querySelector('.spirit');
let awakened = false;

function toggleSpirit() {
  awakened = !awakened;
  spirit.classList.toggle('transformed', awakened);
  spirit.setAttribute('aria-label', awakened ? '魔丸，点击切换回灵珠' : '灵珠，点击切换为魔丸');
}

spirit.addEventListener('click', toggleSpirit);

const palmTrees = [...document.querySelectorAll('.palm-tree')];

function shakePalms() {
  palmTrees.forEach(tree => {
    tree.classList.remove('shaking');
    void tree.offsetWidth;
    tree.classList.add('shaking');
  });
}

palmTrees.forEach(tree => {
  tree.addEventListener('click', shakePalms);
  tree.addEventListener('animationend', () => tree.classList.remove('shaking'));
});

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

function dropCalendarSheet() {
  if (sheetDropped) return;
  sheetDropped = true;
  sheetGesture = null;
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
