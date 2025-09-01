import { useRef, useEffect, useState } from 'react';
import { calculateScore } from './CalculateScore';
import { randomDirection, randomFloatBetween } from './utils.jsx';
import WinScreen from './winScreen.jsx';
import sendMatchResult from './send_result.jsx';

function PongGame() {
  const canvasRef = useRef(null);

  const leftScore = useRef(0);
  const rightScore = useRef(0);

  const leftPlayerY = useRef(300);
  const rightPlayerY = useRef(300);

  const keysPressed = useRef({});

  // ball init
  const xBall = useRef(0);
  const yBall = useRef(0);
  const vxBall = useRef(2);
  const vyBall = useRef(2);

  const goalScored = useRef(false);

  const [showWin, setShowWin] = useState(false);
  const [winner, setWinner] = useState(null);
  const gameRunning = useRef(true);

  const [playerLeft, setPlayerLeft] = useState(null);
  const [playerRight, setPlayerRight] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5001/api/info_2d")
      .then(res => res.json())
      .then(data => {
        setPlayerLeft(data.playerLeft);
        setPlayerRight(data.playerRight);
      })
      .catch(err => console.error("erreur reception joueur :", err));
  }, []);

  function restart() {
    window.location.reload();
  }

  // gestion des touches
  useEffect(() => {
    function handleKeyDown(e) { keysPressed.current[e.key] = true; }
    function handleKeyUp(e) { keysPressed.current[e.key] = false; }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // rezise du canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    function resizeCanvas() {
      canvas.width = window.innerWidth - 100;
      canvas.height = window.innerHeight;
      xBall.current = canvas.width / 2;
      yBall.current = canvas.height / 2;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // game loop
  useEffect(() => {
    if (!playerLeft || !playerRight) return; // attendre que les infos soient chargées

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const BallRadius = 10;
    const PlayerWidth = 10;
    const PlayerHeight = 100;
    const PlayerSpeed = 7;
    const FPS = 200;

    function rectIntersect(r1, r2) {
      return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
      );
    }

    const update = () => {
      // Déplacement joueurs
      if (keysPressed.current['w'] && leftPlayerY.current > 0) leftPlayerY.current -= PlayerSpeed;
      if (keysPressed.current['s'] && leftPlayerY.current < canvas.height - PlayerHeight) leftPlayerY.current += PlayerSpeed;
      if (keysPressed.current['ArrowUp'] && rightPlayerY.current > 0) rightPlayerY.current -= PlayerSpeed;
      if (keysPressed.current['ArrowDown'] && rightPlayerY.current < canvas.height - PlayerHeight) rightPlayerY.current += PlayerSpeed;

      // win condition
      if (leftScore.current >= 5 || rightScore.current >= 5) {
        let winnerId, loserId, scoreWinner, scoreLoser;

        if (leftScore.current >= 5) {
          setWinner(playerLeft.name);
          winnerId = playerLeft.id;
          loserId = playerRight.id;
          scoreWinner = leftScore.current;
          scoreLoser = rightScore.current;
        } else {
          setWinner(playerRight.name);
          winnerId = playerRight.id;
          loserId = playerLeft.id;
          scoreWinner = rightScore.current;
          scoreLoser = leftScore.current;
        }

        setShowWin(true);
        gameRunning.current = false;

        // envoi du resultat au backend
        sendMatchResult(winnerId, loserId, scoreWinner, scoreLoser);
      }

      // mouvement balle
      if (!goalScored.current) {
        xBall.current += vxBall.current;
        yBall.current += vyBall.current;

        if (vxBall.current < 0) { vxBall.current -= 0.003; vyBall.current -= 0.003; }
        else { vxBall.current += 0.003; vyBall.current += 0.003; }
      }

      // rebond mur
      if (yBall.current <= BallRadius || yBall.current >= canvas.height - BallRadius) vyBall.current *= -1;

      // hitboxes
      const ballHitbox = { x: xBall.current - BallRadius, y: yBall.current - BallRadius, width: BallRadius*2, height: BallRadius*2 };
      const leftPlayerBox = { x: 10, y: leftPlayerY.current, width: PlayerWidth, height: PlayerHeight };
      const rightPlayerBox = { x: canvas.width - PlayerWidth - 10, y: rightPlayerY.current, width: PlayerWidth, height: PlayerHeight };

      // collision ball
      if (rectIntersect(ballHitbox, leftPlayerBox)) { vxBall.current *= -1; xBall.current = leftPlayerBox.x + leftPlayerBox.width + BallRadius; }
      if (rectIntersect(ballHitbox, rightPlayerBox)) { vxBall.current *= -1; xBall.current = rightPlayerBox.x - BallRadius; }

      // but + reset
      if (!goalScored.current) {
        const goal = calculateScore(xBall.current, canvas.width, leftScore, rightScore);
        if (goal) {
          goalScored.current = true;
          xBall.current = canvas.width / 2;
          yBall.current = canvas.height / 2;

          setTimeout(() => {
            vxBall.current = 2 * randomDirection();
            vyBall.current = randomFloatBetween(-2, 2);
            if (Math.abs(vyBall.current) < 0.5) vyBall.current = vyBall.current < 0 ? -0.5 : 0.5;
            goalScored.current = false;
          }, 2000);
        }
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ball
      ctx.beginPath();
      ctx.arc(xBall.current, yBall.current, BallRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.closePath();
      // joueur
      ctx.fillStyle = playerLeft.color;
      ctx.fillRect(10, leftPlayerY.current, PlayerWidth, PlayerHeight);
      ctx.fillStyle = playerRight.color;
      ctx.fillRect(canvas.width - PlayerWidth - 10, rightPlayerY.current, PlayerWidth, PlayerHeight);
      // score
      ctx.fillStyle = 'white';
      ctx.font = '32px Arial';
      ctx.fillText(leftScore.current, canvas.width / 4, 50);
      ctx.fillText(rightScore.current, (3*canvas.width)/4, 50);
    };

    let lastTime = 0;
    const interval = 1000 / FPS;

    const gameLoop = (time=0) => {
      if (!gameRunning.current) return;
      if (time - lastTime > interval) { update(); render(); lastTime = time; }
      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, [playerLeft, playerRight]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ background: 'black', display: 'block', marginLeft: '48px', marginTop: '0px' }}
      />
      {showWin && <WinScreen winner={winner} onRestart={restart} />}
    </>
  );
}

export default PongGame;

