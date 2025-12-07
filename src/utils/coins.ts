export const coins: Record<
  string,
  { img: string; max_win: number; color: string }
> = {
  "1": {
    img: "/imgs/coins/1.png",
    max_win: 500,
    color: "yellow-200",
  },
  "5": {
    img: "/imgs/coins/5.png",
    max_win: 2500,
    color: "red-400",
  },
  "10": {
    img: "/imgs/coins/10.png",
    max_win: 5000,
    color: "green-400",
  },
  "20": {
    img: "/imgs/coins/20.png",
    max_win: 10000,
    color: "blue-400",
  },
};
