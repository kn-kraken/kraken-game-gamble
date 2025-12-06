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