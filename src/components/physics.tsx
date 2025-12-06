// physicsEngine.ts
import { Ball, BonusField, Dimensions } from "./types";

const FRICTION = 0.98;
const RESTITUTION = 0.9;
const SPEED = 100;

export interface PhysicsResult {
  updatedBalls: Ball[];
  totalScore: number;
  scoreChanged: boolean;
  activeScoredBalls: Map<number, number>; // Mapa ID kuli -> Punkty
  areMoving: boolean;
}

export const calculatePhysicsFrame = (
  balls: Ball[],
  dimensions: Dimensions,
  bonusFields: BonusField[],
  currentScore: number,
  scoredBallsMap: Map<number, number>
): PhysicsResult => {
  const { width, height } = dimensions;
  
  // 1. Kopiujemy tablicę, aby nie mutować propsów bezpośrednio (dobre praktyki)
  // W grach dla wydajności czasem mutuje się obiekty, tutaj robimy shallow copy
  const updatedBalls = balls.map((ball) => ({ ...ball }));

  // 2. Ruch i odbicia od ścian
  updatedBalls.forEach((ball) => {
    // Tarcie
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    // Aktualizacja pozycji
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ściany (X)
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
      ball.vx = -ball.vx * RESTITUTION;
      ball.x = ball.x - ball.radius < 0 ? ball.radius : width - ball.radius;
    }
    // Ściany (Y)
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > height) {
      ball.vy = -ball.vy * RESTITUTION;
      ball.y = ball.y - ball.radius < 0 ? ball.radius : height - ball.radius;
    }

    // Stop bardzo wolnych kulek
    if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
  });

  // 3. Kolizje między kulkami
  for (let i = 0; i < updatedBalls.length; i++) {
    for (let j = i + 1; j < updatedBalls.length; j++) {
      const ball1 = updatedBalls[i];
      const ball2 = updatedBalls[j];

      const dx = ball2.x - ball1.x;
      const dy = ball2.y - ball1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDist = ball1.radius + ball2.radius;

      if (distance < minDist) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        // Obrót prędkości
        const vx1 = ball1.vx * cos + ball1.vy * sin;
        const vy1 = ball1.vy * cos - ball1.vx * sin;
        const vx2 = ball2.vx * cos + ball2.vy * sin;
        const vy2 = ball2.vy * cos - ball2.vx * sin;

        // Wymiana pędu (zderzenie sprężyste)
        const tempVx = vx1;
        ball1.vx = (vx2 * cos - vy1 * sin) * RESTITUTION;
        ball1.vy = (vy1 * cos + vx2 * sin) * RESTITUTION;
        ball2.vx = (tempVx * cos - vy2 * sin) * RESTITUTION;
        ball2.vy = (vy2 * cos + tempVx * sin) * RESTITUTION;

        // Separacja kulek (żeby się nie sklejały)
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

  // 4. Logika punktacji
  let newScore = currentScore;
  let hasScoreChanged = false;
  
  // Klonujemy mapę, aby nie mutować referencji z Reacta
  const newScoredBallsMap = new Map(scoredBallsMap);

  updatedBalls.forEach((ball) => {
    let isInsideAnyField = false;

    bonusFields.forEach((field) => {
      const dx = field.x - ball.x;
      const dy = field.y - ball.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // const minDist = field.radius - 0.5 * ball.radius;

      if (distance < field.radius) {
        isInsideAnyField = true;
        // Używamy ID kuli jako klucza, żeby uniknąć błędów
        if (!newScoredBallsMap.has(ball.id)) {
          const points = ball.value * field.multiplier;
          newScore += points;
          newScoredBallsMap.set(ball.id, points);
          hasScoreChanged = true;
        }
      }
    });

    if (!isInsideAnyField && newScoredBallsMap.has(ball.id)) {
      const pointsToRemove = newScoredBallsMap.get(ball.id) || 0;
      newScore -= pointsToRemove;
      newScoredBallsMap.delete(ball.id);
      hasScoreChanged = true;
    }
  });

  // 5. Sprawdzenie czy kulki się ruszają
  const areMoving = updatedBalls.some(
    (ball) => Math.abs(ball.vx) > 0.01 || Math.abs(ball.vy) > 0.01
  );

  return {
    updatedBalls,
    totalScore: newScore,
    scoreChanged: hasScoreChanged,
    activeScoredBalls: newScoredBallsMap,
    areMoving
  };
};

export const applyShakeForce = (balls: Ball[], forceFactor: number = 1): Ball[] => {
  return balls.map((ball) => ({
    ...ball,
    vx: ball.vx + (Math.random() - 0.5) * (SPEED / ball.value) * forceFactor,
    vy: ball.vy + (Math.random() - 0.5) * (SPEED / ball.value) * forceFactor,
  }));
};