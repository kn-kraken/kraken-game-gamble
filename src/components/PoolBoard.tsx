import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface BonusField {
  x: number;
  y: number;
  radius: number;
  multiplier: number;
}

export interface PoolBoardRef {
  shake: (forceFactor?: number) => void;
  areBallsMoving: () => boolean;
}

export interface PoolBoardProps {
  width?: number;
  height?: number;
  onShake?: () => void;
  onScoreChange?: (score: number) => void;
  ballCount?: number;
}

export const PoolBoard = forwardRef<PoolBoardRef, PoolBoardProps>(
  (props, ref) => {
    const { onScoreChange, ballCount = 6 } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const ballsRef = useRef<Ball[]>([]);
    const ballsMovingRef = useRef<boolean>(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

    // Handle container resize
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
        }
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);
    const scoreRef = useRef<number>(0);
    const scoredBallsRef = useRef<Map<number, number>>(new Map());
    const [displayScore, setDisplayScore] = useState(0);
    const bonusFields = useMemo<BonusField[]>(
      () => [
        {
          x: dimensions.width * 0.15,
          y: dimensions.height * 0.6,
          radius: 50,
          multiplier: 1,
        },
        {
          x: dimensions.width * 0.4,
          y: dimensions.height * 0.4,
          radius: 75,
          multiplier: 2,
        },
        {
          x: dimensions.width * 0.75,
          y: dimensions.height * 0.8,
          radius: 25,
          multiplier: 3,
        },
      ],
      [dimensions.width, dimensions.height]
    );

    // Initialize balls
    useEffect(() => {
      const { width, height } = dimensions;
      const colors = [
        "#FFD700",
        "#FF4444",
        "#4444FF",
        "#FF8844",
        "#44FF44",
        "#8844FF",
        "#FF44FF",
        "#44FFFF",
        "#FFA500",
        "#800080",
        "#00FF00",
        "#FF1493",
        "#1E90FF",
        "#FFD700",
        "#DC143C",
      ];

      const balls: Ball[] = [];
      const ballRadius = 15;
      const minDistance = ballRadius * 2.5; // Minimum distance between ball centers

      // Helper function to check if a position is valid (no overlap)
      const isValidPosition = (x: number, y: number, existingBalls: Ball[]) => {
        // Check bounds
        if (
          x - ballRadius < 0 ||
          x + ballRadius > width ||
          y - ballRadius < 0 ||
          y + ballRadius > height
        ) {
          return false;
        }

        // Check distance from other balls
        for (const ball of existingBalls) {
          const dx = x - ball.x;
          const dy = y - ball.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < minDistance) {
            return false;
          }
        }
        return true;
      };

      // Generate random positions for all balls
      for (let ballId = 0; ballId <= ballCount; ballId++) {
        let attempts = 0;
        let x: number, y: number;

        // Try to find a valid position (max 1000 attempts)
        do {
          x = ballRadius + Math.random() * (width - 2 * ballRadius);
          y = ballRadius + Math.random() * (height - 2 * ballRadius);
          attempts++;
        } while (!isValidPosition(x, y, balls) && attempts < 1000);

        // If we couldn't find a valid position after many attempts, use the last generated position anyway
        balls.push({
          id: ballId,
          x: x!,
          y: y!,
          vx: 0,
          vy: 0,
          radius: ballRadius,
          color:
            ballId === 0 ? "#FFFFFF" : colors[(ballId - 1) % colors.length],
        });
      }

      ballsRef.current = balls;
    }, [dimensions, ballCount]);

    // Physics simulation
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = dimensions;
      const friction = 0.98;
      const restitution = 0.9;

      const updatePhysics = () => {
        const updatedBalls = ballsRef.current.map((ball) => {
          let { x, y, vx, vy } = ball;

          // Apply friction
          vx *= friction;
          vy *= friction;

          // Update position
          x += vx;
          y += vy;

          // Wall collisions
          if (x - ball.radius < 0 || x + ball.radius > width) {
            vx = -vx * restitution;
            x = x - ball.radius < 0 ? ball.radius : width - ball.radius;
          }
          if (y - ball.radius < 0 || y + ball.radius > height) {
            vy = -vy * restitution;
            y = y - ball.radius < 0 ? ball.radius : height - ball.radius;
          }

          // Stop very slow movement
          if (Math.abs(vx) < 0.1) vx = 0;
          if (Math.abs(vy) < 0.1) vy = 0;

          return { ...ball, x, y, vx, vy };
        });

        // Ball-to-ball collisions
        for (let i = 0; i < updatedBalls.length; i++) {
          for (let j = i + 1; j < updatedBalls.length; j++) {
            const ball1 = updatedBalls[i];
            const ball2 = updatedBalls[j];

            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = ball1.radius + ball2.radius;

            if (distance < minDist) {
              // Collision detected
              const angle = Math.atan2(dy, dx);
              const sin = Math.sin(angle);
              const cos = Math.cos(angle);

              // Rotate velocities
              const vx1 = ball1.vx * cos + ball1.vy * sin;
              const vy1 = ball1.vy * cos - ball1.vx * sin;
              const vx2 = ball2.vx * cos + ball2.vy * sin;
              const vy2 = ball2.vy * cos - ball2.vx * sin;

              // Swap velocities (elastic collision)
              const tempVx = vx1;
              ball1.vx = (vx2 * cos - vy1 * sin) * restitution;
              ball1.vy = (vy1 * cos + vx2 * sin) * restitution;
              ball2.vx = (tempVx * cos - vy2 * sin) * restitution;
              ball2.vy = (vy2 * cos + tempVx * sin) * restitution;

              // Separate balls
              const overlap = minDist - distance;
              const separateX = ((dx / distance) * overlap) / 2;
              const separateY = ((dy / distance) * overlap) / 2;

              ball1.x -= separateX;
              ball1.y -= separateY;
              ball2.x += separateX;
              ball2.y += separateY;
            }
          }
        }

        const currentScoredBalls = scoredBallsRef.current;
        let currentScore = scoreRef.current;
        let scoreChanged = false;

        // Ball-in-field detection
        updatedBalls.forEach((ball) => {
          let isInsideAnyField = false;
          bonusFields.forEach((field) => {
            // const ball = updatedBalls[i]
            const dx = field.x - ball.x;
            const dy = field.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = field.radius - 0.5 * ball.radius;

            if (distance < minDist) {
              isInsideAnyField = true;
              if (!currentScoredBalls.has(ball.id)) {
                const points = ball.id * field.multiplier;
                currentScore += points;
                currentScoredBalls.set(ball.id, points);
                scoreChanged = true;
              }
            }
          });
          if (!isInsideAnyField && currentScoredBalls.has(ball.id)) {
            const pointsToRemove = currentScoredBalls.get(ball.id) || 0;
            currentScore -= pointsToRemove;
            currentScoredBalls.delete(ball.id);
            scoreChanged = true;
          }
        });
        scoreRef.current = currentScore;
        ballsRef.current = updatedBalls;

        // Check if any balls are moving
        ballsMovingRef.current = updatedBalls.some(
          (ball) => Math.abs(ball.vx) > 0.01 || Math.abs(ball.vy) > 0.01
        );

        if (scoreChanged) {
          if (onScoreChange) {
            onScoreChange(currentScore);
          }
        }
      };

      const render = () => {
        // Clear canvas
        ctx.fillStyle = "#0A5F38";
        ctx.fillRect(0, 0, width, height);

        // Draw bonus fields
        bonusFields.forEach((field) => {
          ctx.beginPath();
          ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
          ctx.lineWidth = 3;
          ctx.stroke();

          // Draw multiplier text
          ctx.fillStyle = "#FFD700";
          ctx.font = "bold 24px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`x${field.multiplier}`, field.x, field.y);
        });

        // Draw balls
        ballsRef.current.forEach((ball) => {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.fill();
          ctx.strokeStyle = "#333";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Add shine effect
          ctx.beginPath();
          ctx.arc(ball.x - 5, ball.y - 5, ball.radius / 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fill();
        });

        updatePhysics();
        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [dimensions, bonusFields]);

    const shakeBalls = (balls: Ball[], forceFactor: number = 1): Ball[] => {
      return balls.map((ball) => ({
        ...ball,
        vx: ball.vx + (Math.random() - 0.5) * 20 * forceFactor,
        vy: ball.vy + (Math.random() - 0.5) * 20 * forceFactor,
      }));
    };

    useImperativeHandle(ref, () => ({
      shake: (forceFactor: number = 1) => {
        if (!ballsMovingRef.current) {
          ballsRef.current = shakeBalls(ballsRef.current, forceFactor);
        }
      },
      areBallsMoving: () => ballsMovingRef.current,
    }));

    return (
      <div ref={containerRef} className="w-full h-full">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="shadow-2xl w-full h-full"
        />
      </div>
    );
  }
);

PoolBoard.displayName = "PoolBoard";
