import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { type Ball, type BonusField } from "./types.tsx";
import { calculatePhysicsFrame, applyShakeForce } from "./physics.tsx";

// Przygotowana tekstura "3D Blue Orb" w formacie Data URI
const ballImg = new Image();
ballImg.src =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22grad%22%20cx%3D%2230%25%22%20cy%3D%2230%25%22%20r%3D%2270%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ffffff%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%234facfe%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2300f2fe%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22url(%23grad)%22%2F%3E%3C%2Fsvg%3E";

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
}

export const PoolBoard = forwardRef<PoolBoardRef, PoolBoardProps>(
  (props, ref) => {
    const {
      onScoreChange,
      ballCount = 6,
      ballNumbers = [],
      onBallsInFieldChange,
    } = props;
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
      const ballRadius = 35;
      const minDistance = ballRadius * 2.5; // Minimum distance between ball centers

      // Helper function to check if a position is valid (no overlap)
      const PADDING = 30;
      const BOTTOM_PADDING = 100;
      const isValidPosition = (x: number, y: number, existingBalls: Ball[]) => {
        // Check bounds - constrain to playing field
        if (
          x - ballRadius < PADDING ||
          x + ballRadius > width - PADDING ||
          y - ballRadius < PADDING ||
          y + ballRadius > height - BOTTOM_PADDING
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
      for (let ballId = 0; ballId < ballCount; ballId++) {
        let attempts = 0;
        let x: number, y: number;
        const value = ballNumbers[ballId] || Math.floor(Math.random() * 49) + 1;

        // Try to find a valid position (max 1000 attempts)
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

        // If we couldn't find a valid position after many attempts, use the last generated position anyway
        balls.push({
          id: ballId,
          x: x!,
          y: y!,
          vx: 0,
          vy: 0,
          radius: ballRadius,
          color: colors[ballId % colors.length],
          value: value,
        });
      }

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
        ballsRef.current.forEach((ball) => {
          // Check if ball is in any bonus field
          for (const field of bonusFields) {
            const dx = ball.x - field.x;
            const dy = ball.y - field.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance + ball.radius <= field.radius) {
              ballsInFields.push(ball.id);
              break;
            }
          }

          // Draw ball (no visual changes on board)
          ctx.drawImage(
            ballImg,
            ball.x - ball.radius, // Pozycja X (przesunięta o promień w lewo)
            ball.y - ball.radius, // Pozycja Y (przesunięta o promień w górę)
            ball.radius * 2, // Szerokość (średnica)
            ball.radius * 2 // Wysokość (średnica)
          );
          // ctx.beginPath();
          // ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          // ctx.fillStyle = ball.color;
          // ctx.fill();
          // ctx.strokeStyle = "#333";
          // ctx.lineWidth = 2;
          // ctx.stroke();

          // Add shine effect
          ctx.beginPath();
          ctx.arc(ball.x - 10, ball.y - 10, ball.radius / 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fill();

          //Add ball value text
          ctx.fillStyle = "#000000";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ball.value.toString(), ball.x, ball.y);
        });

        // Notify parent about balls in fields
        if (onBallsInFieldChange) {
          onBallsInFieldChange(ballsInFields);
        }

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
