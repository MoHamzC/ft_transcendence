// @ts-nocheck
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { calculateScore } from './CalculateScore';
import { randomDirection, randomFloatBetween} from './utils.jsx';
import WinScreen from './winScreen.jsx';

function PongGame() {
	// Contexte tournoi (optionnel)
	const [tournamentCtx, setTournamentCtx] = useState(null);
	useEffect(()=>{
		try {
			const raw = localStorage.getItem('currentTournamentMatch');
			if (raw) setTournamentCtx(JSON.parse(raw));
		} catch {}
	}, []);
	const canvasRef = useRef(null);

	// Player metadata from URL
	const player1IdRef = useRef(null);
	const player2IdRef = useRef(null);
	const player1NameRef = useRef('Player 1');
	const player2NameRef = useRef('Player 2');

	const leftScore = useRef(0);
	const rightScore = useRef(0);

	const leftPlayerY = useRef(300);
	const rightPlayerY = useRef(300);

	const keysPressed = useRef({});

	//init
	const xBall = useRef(0);
	const yBall = useRef(0);
	const vxBall = useRef(2);
	const vyBall = useRef(2);

	const goalScored = useRef(false);

	const [showWin, setShowWin] = useState(false);
	const [winner, setWinner] = useState(null);
	const [reporting, setReporting] = useState(false);
	const [reportError, setReportError] = useState(null);
	const gameRunning = useRef(true);

	function restart() {
	  window.location.reload(); //reset la page plutot que reset le jeux
	}

	// Parse query params to extract players
	useEffect(() => {
	  try {
	    const params = new URLSearchParams(window.location.search);
	    const p1Id = params.get('p1Id');
	    const p2Id = params.get('p2Id');
	    const p1 = params.get('p1');
	    const p2 = params.get('p2');
	    if (p1Id) player1IdRef.current = p1Id;
	    if (p2Id) player2IdRef.current = p2Id;
	    if (p1) player1NameRef.current = decodeURIComponent(p1);
	    if (p2) player2NameRef.current = decodeURIComponent(p2);
	  } catch (e) {
	    console.warn('Query parse error', e);
	  }
	}, []);

	useEffect(() => {
	  function handleKeyDown(e) {
	    keysPressed.current[e.key] = true;
	  }
	  function handleKeyUp(e) {
	    keysPressed.current[e.key] = false;
	  }
	  window.addEventListener('keydown', handleKeyDown);
	  window.addEventListener('keyup', handleKeyUp);
	  return () => {
	    window.removeEventListener('keydown', handleKeyDown);
	    window.removeEventListener('keyup', handleKeyUp);
	  };
	}, []);

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

  useEffect(() => {
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

	//mis a jours physique et fps
    const update = () => {

		if (keysPressed.current['w'] && leftPlayerY.current > 0) {
		  leftPlayerY.current -= PlayerSpeed;
		}
		if (
		  keysPressed.current['s'] &&
		  leftPlayerY.current < canvas.height - PlayerHeight
		) {
		  leftPlayerY.current += PlayerSpeed;
		}
		if (keysPressed.current['ArrowUp'] && rightPlayerY.current > 0) {
		  rightPlayerY.current -= PlayerSpeed;
		}
		if ( keysPressed.current['ArrowDown'] &&
		    rightPlayerY.current < canvas.height - PlayerHeight ) {
		    rightPlayerY.current += PlayerSpeed;
		}

		//win condition
		if (leftScore.current >= 5 || rightScore.current >= 5) {
			if (!showWin) {
				const leftWon = leftScore.current >= 5;
				setWinner(leftWon ? player1NameRef.current : player2NameRef.current);
				setShowWin(true);
				gameRunning.current = false; // stop loop
				// Report match result
				(async () => {
					if (!player1IdRef.current || !player2IdRef.current) return; // Need IDs
					setReporting(true);
					try {
						await axios.post('/api/match', {
							playerWinner: leftWon ? player1IdRef.current : player2IdRef.current,
							playerLoser: leftWon ? player2IdRef.current : player1IdRef.current,
							playerWinnerScore: leftWon ? leftScore.current : rightScore.current,
							playerLoserScore: leftWon ? rightScore.current : leftScore.current
						});
					} catch (err) {
						console.error('Match report failed', err);
						setReportError('Erreur enregistrement du match');
					} finally {
						setReporting(false);
					}
				})();
			}
		}

		if (!goalScored.current) {
        	xBall.current += vxBall.current;
        	yBall.current += vyBall.current;

        if (vxBall.current < 0) {
          vxBall.current -= 0.003;
          vyBall.current -= 0.003;
        } else {
          vxBall.current += 0.003;
          vyBall.current += 0.003;
        }
      }

      //repond sur les mur
      if (yBall.current <= BallRadius || yBall.current >= canvas.height - BallRadius) {
        vyBall.current *= -1;
      }

      //hitbox ball
      const ballHitbox = {
        x: xBall.current - BallRadius,
        y: yBall.current - BallRadius,
        width: BallRadius * 2,
        height: BallRadius * 2,
      };

      //hitbox player
      const leftPlayer = {
        x: 10,
        y: leftPlayerY.current,
        width: PlayerWidth,
        height: PlayerHeight,
      };

      const rightPlayer = {
        x: canvas.width - PlayerWidth - 10,
        y: rightPlayerY.current,
        width: PlayerWidth,
        height: PlayerHeight,
      };

		//colision ball
		if (rectIntersect(ballHitbox, leftPlayer)) {
        	vxBall.current *= -1;
        	xBall.current = leftPlayer.x + leftPlayer.width + BallRadius;
      	}
		if (rectIntersect(ballHitbox, rightPlayer)) {
        	vxBall.current *= -1;
			xBall.current = rightPlayer.x - BallRadius;
		}

		//but + reset ball
		if (!goalScored.current)
		{
			const goal = calculateScore(xBall.current, canvas.width, leftScore, rightScore);
			if (goal)
			{
				goalScored.current = true;
				xBall.current = canvas.width / 2;
				yBall.current = canvas.height / 2;

				setTimeout(() => {
					vxBall.current = 2 * randomDirection();
					vyBall.current = randomFloatBetween(-2, 2);
					if (Math.abs(vyBall.current) < 0.5)
					{
						if (vyBall.current < 0)
							vyBall.current = -0.5;
						else
							vyBall.current = 0.5;
					}
					goalScored.current = false;
				}, 2000);
			}
		}

};

    // Fonction dessin
	const render = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Dessin balle
		ctx.beginPath();
		ctx.arc(xBall.current, yBall.current, BallRadius, 0, Math.PI * 2);
		ctx.fillStyle = 'white';
		ctx.fill();
		ctx.closePath();

		// Dessin joueurs
		ctx.fillStyle = 'blue';
		ctx.fillRect(10, leftPlayerY.current, PlayerWidth, PlayerHeight);

		ctx.fillStyle = 'red';
		ctx.fillRect(canvas.width - PlayerWidth - 10, rightPlayerY.current, PlayerWidth, PlayerHeight);
		ctx.fillStyle = 'white';
		ctx.font = '32px Arial';
		ctx.fillText(leftScore.current, canvas.width / 4, 50);
		ctx.fillText(rightScore.current, (3 * canvas.width) / 4, 50);
		ctx.font = '16px Arial';
		ctx.fillText(player1NameRef.current, 20, 30);
		const p2Text = player2NameRef.current;
		ctx.fillText(p2Text, canvas.width - ctx.measureText(p2Text).width - 20, 30);
    };



	//loop
    let lastTime = 0;
    const interval = 1000 / FPS;

    function gameLoop(time = 0) {
		if (!gameRunning.current) return;
		if (time - lastTime > interval) {
			update();
        	render();
        	lastTime = time;
      }
      requestAnimationFrame(gameLoop);
    }

    gameLoop();
  }, []);

	return (
	  <>
	  {tournamentCtx && (
	    <div style={{position:'fixed', top:10, left:10, background:'#111', color:'#fff', padding:'6px 10px', borderRadius:6, fontSize:'0.75rem', opacity:0.85}}>
	      <div>Round Match</div>
	      <div>{tournamentCtx.player1_alias} vs {tournamentCtx.player2_alias}</div>
	    </div>
	  )}
	    <canvas
	      ref={canvasRef}
	      style={{
	        background: 'black',
	        display: 'block',
	        marginLeft: '48px',
	        marginTop: '0px',
	      }}
	    />
		{showWin && <WinScreen winner={winner} onRestart={restart} reporting={reporting} error={reportError} />}
	  </>
	);
}

export default PongGame;

