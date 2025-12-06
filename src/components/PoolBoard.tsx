import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import {Ball, BonusField} from "./types.tsx"
import { calculatePhysicsFrame, applyShakeForce } from "./physics.tsx";

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
    const bonusFields = useMemo<BonusField[]>(
      () => [
        {
          x: dimensions.width * 0.15,
          y: dimensions.height * 0.6,
          radius: 70,
          multiplier: 1,
        },
        {
          x: dimensions.width * 0.6,
          y: dimensions.height * 0.45,
          radius: 70,
          multiplier: 1,
        },
        {
          x: dimensions.width * 0.4,
          y: dimensions.height * 0.4,
          radius: 40,
          multiplier: 3,
        },
        {
          x: dimensions.width * 0.75,
          y: dimensions.height * 0.8,
          radius: 55,
          multiplier: 2,
        },
        {
          x: dimensions.width * 0.25,
          y: dimensions.height * 0.25,
          radius: 55,
          multiplier: 2,
        },
        {
          x: dimensions.width * 0.8,
          y: dimensions.height * 0.15,
          radius: 25,
          multiplier: 4,
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
        let value = Math.floor(Math.random() * 6) + 1

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
          value: value!,
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

      const {width, height} = dimensions
    
      const render = () => {
        // 1. Oblicz fizykę używając wydzielonego modułu
        const result = calculatePhysicsFrame(
            ballsRef.current,
            dimensions,
            bonusFields,
            scoreRef.current,
            scoredBallsRef.current
        );

        // 2. Aktualizuj referencje
        ballsRef.current = result.updatedBalls;
        ballsMovingRef.current = result.areMoving;
        scoredBallsRef.current = result.activeScoredBalls;
        scoreRef.current = result.totalScore;

        if (result.scoreChanged && onScoreChange) {
          onScoreChange(result.totalScore);
        }
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

          //Add ball value text
          ctx.fillStyle = "#000000";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ball.value, ball.x, ball.y);
        });

        // updatePhysics();
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
        vx: ball.vx + (Math.random() - 0.5) * 20/ball.value * forceFactor,
        vy: ball.vy + (Math.random() - 0.5) * 20/ball.value * forceFactor,
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
