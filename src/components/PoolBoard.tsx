import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { type Ball, type BonusField, ballImg, SPEED } from "./types.tsx";
import { calculatePhysicsFrame, applyShakeForce } from "./physics.tsx";

// Przygotowana tekstura "3D Blue Orb" w formacie Data URI

const bgImg = new Image();
bgImg.src = "/imgs/bg.png";

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
  ballNumbers?: number[];
  onBallsInFieldChange?: (ballIds: number[]) => void;
  onBallsStopped?: (
    ballsData: Array<{
      ballId: number;
      ballValue: number;
      zoneMultiplier: number;
    }>
  ) => void;
}

export const PoolBoard = forwardRef<PoolBoardRef, PoolBoardProps>(
  (props, ref) => {
    const {
      onScoreChange,
      ballCount = 6,
      ballNumbers = [],
      onBallsInFieldChange,
      onBallsStopped,
    } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const ballsRef = useRef<Ball[]>([]);
    const ballsMovingRef = useRef<boolean>(false);
    const previousMovingStateRef = useRef<boolean>(false);
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
    const oneRadius = 100;
    const twoRadius = 75;
    const threeRadius = 60;
    const fourRadius = 45;
    const bonusFields = useMemo<BonusField[]>(
      () => [
        {
          x: dimensions.width * 0.15,
          y: dimensions.height * 0.6,
          radius: oneRadius,
          multiplier: 1,
        },
        {
          x: dimensions.width * 0.6,
          y: dimensions.height * 0.45,
          radius: oneRadius,
          multiplier: 1,
        },
        {
          x: dimensions.width * 0.4,
          y: dimensions.height * 0.4,
          radius: threeRadius,
          multiplier: 3,
        },
        {
          x: dimensions.width * 0.75,
          y: dimensions.height * 0.8,
          radius: twoRadius,
          multiplier: 2,
        },
        {
          x: dimensions.width * 0.25,
          y: dimensions.height * 0.25,
          radius: twoRadius,
          multiplier: 2,
        },
        {
          x: dimensions.width * 0.8,
          y: dimensions.height * 0.15,
          radius: fourRadius,
          multiplier: 4,
        },
      ],
      [dimensions.width, dimensions.height]
    );

    // Initialize balls
    useEffect(() => {
      const { width, height } = dimensions;

      const balls: Ball[] = [];
      const ballRadius = 20;
      const minDistance = ballRadius * 2.5;

      const PADDING = 30;
      const BOTTOM_PADDING = 100;

      const predefinedValues = ballNumbers || [];
      const usedValuesSet = new Set(predefinedValues);

      const poolOfNumbers = Array.from({ length: 49 }, (_, i) => i + 1).filter(
        (n) => !usedValuesSet.has(n)
      );

      for (let i = poolOfNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolOfNumbers[i], poolOfNumbers[j]] = [
          poolOfNumbers[j],
          poolOfNumbers[i],
        ];
      }
      const values: number[] = [];

      for (let i = 0; i < ballCount; i++) {
        if (predefinedValues[i] !== undefined) {
          values.push(predefinedValues[i]);
        } else {
          values.push(poolOfNumbers.pop()!);
        }
      }

      const seen = new Set<number>();
      for (let i = 0; i < values.length; i++) {
        if (seen.has(values[i])) {
          values[i] = poolOfNumbers.pop()!;
        }
        seen.add(values[i]);
      }
      const isValidPosition = (x: number, y: number, existingBalls: Ball[]) => {
        if (
          x - ballRadius < PADDING ||
          x + ballRadius > width - PADDING ||
          y - ballRadius < PADDING ||
          y + ballRadius > height - BOTTOM_PADDING
        )
          return false;

        for (const ball of existingBalls) {
          const dx = x - ball.x;
          const dy = y - ball.y;
          if (Math.sqrt(dx * dx + dy * dy) < minDistance) return false;
        }
        return true;
      };
      for (let ballId = 0; ballId < ballCount; ballId++) {
        let attempts = 0;
        let x: number, y: number;

        do {
          x =
            PADDING +
            ballRadius +
            Math.random() * (width - 2 * PADDING - 2 * ballRadius);
          y =
            PADDING +
            ballRadius +
            Math.random() * (height - 2 * PADDING - 2 * ballRadius);
          attempts++;
        } while (!isValidPosition(x, y, balls) && attempts < 1000);

        balls.push({
          id: ballId,
          x,
          y,
          vx: (Math.random() - 0.5) * (SPEED / Math.sqrt(values[ballId])),
          vy: (Math.random() - 0.5) * (SPEED / Math.sqrt(values[ballId])),
          radius: ballRadius,
          color: "#FFFFFF",
          value: values[ballId],
        });
      }
      balls.sort((a, b) => a.value - b.value);
      ballsRef.current = balls;
    }, [dimensions, ballCount, ballNumbers]);

    // simulation
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = dimensions;

      const render = () => {
        const result = calculatePhysicsFrame(
          ballsRef.current,
          dimensions,
          bonusFields,
          scoreRef.current,
          scoredBallsRef.current
        );

        ballsRef.current = result.updatedBalls;
        ballsMovingRef.current = result.areMoving;
        scoredBallsRef.current = result.activeScoredBalls;
        scoreRef.current = result.totalScore;

        if (result.scoreChanged && onScoreChange) {
          onScoreChange(result.totalScore);
        }
        // drawing game

        // Clear canvas and draw background
        if (bgImg.complete) {
          ctx.drawImage(bgImg, 0, 0, width, height);
        } else {
          ctx.fillStyle = "#0A5F38";
          ctx.fillRect(0, 0, width, height);
        }

        // Draw playing field boundary (white rectangle)
        const PADDING = 30;
        const BOTTOM_PADDING = 100;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 4;
        ctx.strokeRect(
          PADDING,
          PADDING,
          width - 2 * PADDING,
          height - PADDING - BOTTOM_PADDING
        );

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
        const ballsInFields: number[] = [];
        const ballsInFieldsWithData: Array<{
          ballId: number;
          ballValue: number;
          zoneMultiplier: number;
        }> = [];
        ballsRef.current.forEach((ball) => {
          // Check if ball is in any bonus field
          for (const field of bonusFields) {
            const dx = ball.x - field.x;
            const dy = ball.y - field.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance + ball.radius <= field.radius) {
              ballsInFields.push(ball.id);
              ballsInFieldsWithData.push({
                ballId: ball.id,
                ballValue: ball.value,
                zoneMultiplier: field.multiplier,
              });
              break;
            }
          }

          // Draw ball (no visual changes on board)
          ctx.drawImage(
            ballImg[ball.value - 1],
            ball.x - ball.radius, // Pozycja X (przesunięta o promień w lewo)
            ball.y - ball.radius, // Pozycja Y (przesunięta o promień w górę)
            ball.radius * 2, // Szerokość (średnica)
            ball.radius * 2 // Wysokość (średnica)
          );
        });

        // Notify parent about balls in fields
        if (onBallsInFieldChange) {
          onBallsInFieldChange(ballsInFields);
        }

        // Check if balls just stopped moving
        if (previousMovingStateRef.current && !ballsMovingRef.current) {
          // Balls just stopped
          if (onBallsStopped) {
            onBallsStopped(ballsInFieldsWithData);
          }
        }
        previousMovingStateRef.current = ballsMovingRef.current;

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

    useImperativeHandle(ref, () => ({
      shake: (forceFactor: number = 1) => {
        if (!ballsMovingRef.current) {
          ballsRef.current = applyShakeForce(ballsRef.current, forceFactor);
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
