// types.ts
export interface Ball {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    value: number;
  }
  
  export interface BonusField {
    x: number;
    y: number;
    radius: number;
    multiplier: number;
  }
  
  export interface Dimensions {
    width: number;
    height: number;
  }

export const SPEED = 100;

export const ballImg = Array.from({ length: 49 }, (_, i) => {
  const img = new Image();
  img.src = `/imgs/balls/Frame ${i + 1}.svg`; // ball1.svg, ball2.svg, ...
  return img;
});