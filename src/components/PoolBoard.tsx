import { useEffect, useRef } from "react";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface PoolBoardProps {
  width?: number;
  height?: number;
  onShake?: () => void;
}

export const PoolBoard = ({ width = 800, height = 500 }: PoolBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const ballsRef = useRef<Ball[]>([]);

  // Initialize balls
  useEffect(() => {
    ballsRef.current = [
      // Cue ball (white)
      {
        id: 0,
        x: width * 0.25,
        y: height / 2,
        vx: 0,
        vy: 0,
        radius: 15,
        color: "#FFFFFF",
      },
      // Colored balls in triangle formation
      {
        id: 1,
        x: width * 0.65,
        y: height / 2,
        vx: 0,
        vy: 0,
        radius: 15,
        color: "#FFD700",
      },
      {
        id: 2,
        x: width * 0.65 + 32,
        y: height / 2 - 16,
        vx: 0,
        vy: 0,
        radius: 15,
        color: "#FF4444",
      },
      {
        id: 3,
        x: width * 0.65 + 32,
        y: height / 2 + 16,
        vx: 0,
        vy: 0,
        radius: 15,
        color: "#4444FF",
      },
      {
        id: 4,
        x: width * 0.65 + 64,
        y: height / 2 - 32,
        vx: 0,
        vy: 0,
        radius: 15,
        color: "#FF8844",
      },
      {
        id: 5,
        x: width * 0.65 + 64,
        y: height / 2,
        vx: 0,
        vy: 0,
        radius: 15,
        color: "#44FF44",
      },
      {
        id: 6,
        x: width * 0.65 + 64,
        y: height / 2 + 32,
        vx: 0,
        vy: 0,
        radius: 15,
        color: "#8844FF",
      },
    ];
  }, [width, height]);

  // Physics simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

      ballsRef.current = updatedBalls;
    };

    const render = () => {
      // Clear canvas
      ctx.fillStyle = "#0A5F38";
      ctx.fillRect(0, 0, width, height);

      // Draw border
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 20;
      ctx.strokeRect(0, 0, width, height);

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
  }, [width, height]);

  const handleShake = () => {
    ballsRef.current = ballsRef.current.map((ball) => ({
      ...ball,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
    }));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border-4 border-amber-900 shadow-2xl"
      />
      <button
        onClick={handleShake}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
      >
        Shake Table
      </button>
    </div>
  );
};
