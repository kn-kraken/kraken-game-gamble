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

export const ballImg = new Image();
  ballImg.src =
    "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22grad%22%20cx%3D%2230%25%22%20cy%3D%2230%25%22%20r%3D%2270%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ffffff%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%234facfe%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2300f2fe%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2250%22%20fill%3D%22url(%23grad)%22%2F%3E%3C%2Fsvg%3E";
  