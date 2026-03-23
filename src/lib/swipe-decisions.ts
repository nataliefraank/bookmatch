export type SwipeDecision =
  | "interested"
  | "not_interested"
  | "read_liked"
  | "read_disliked";

const LEFT = "Left";
const RIGHT = "Right";
const UP = "Up";
const DOWN = "Down";

/** react-swipeable direction strings → stored decision */
export function directionToDecision(dir: string): SwipeDecision {
  switch (dir) {
    case LEFT:
      return "not_interested";
    case RIGHT:
      return "interested";
    case UP:
      return "read_liked";
    case DOWN:
      return "read_disliked";
    default:
      return "not_interested";
  }
}

export const SWIPE_DIRECTION_LABELS: Record<string, string> = {
  [LEFT]: "Not interested",
  [RIGHT]: "Interested",
  [UP]: "Read and liked",
  [DOWN]: "Read and disliked",
};

export function isSwipeDecision(
  s: string,
): s is SwipeDecision {
  return (
    s === "interested" ||
    s === "not_interested" ||
    s === "read_liked" ||
    s === "read_disliked"
  );
}
