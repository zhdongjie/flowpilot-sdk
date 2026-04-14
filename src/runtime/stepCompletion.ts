import type { Step } from "../types";

export const backfillCompletion = (
  steps: Step[] = [],
  currentIndex: number | null
) => {
  if (!steps.length) {
    return;
  }
  const activeIndex = typeof currentIndex === "number" ? currentIndex : -1;
  steps.forEach((step, index) => {
    if (index < activeIndex) {
      step.status = "completed";
    } else if (index === activeIndex) {
      step.status = "active";
    } else {
      step.status = step.status === "completed" ? "completed" : "pending";
    }
  });
};
