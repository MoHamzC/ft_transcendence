export function randomDirection() {
  return Math.random() < 0.5 ? -1 : 1;
}
export function randomFloatBetween(min, max) {
  return Math.random() * (max - min) + min;
}

