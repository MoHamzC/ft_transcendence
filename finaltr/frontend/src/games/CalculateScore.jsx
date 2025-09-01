import winScreen from './winScreen.jsx';
export function calculateScore(xBall, canvasWidth, leftScore, rightScore) {
  let goal = false;

  if (xBall < 0) {
    rightScore.current += 1;
    goal = true;
  } else if (xBall > canvasWidth) {
    leftScore.current += 1;
    goal = true;
  }

  return goal;
}
