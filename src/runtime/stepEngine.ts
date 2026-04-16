export type StepCandidate = {
  step: never;
  index: number;
};

export const stateMatches = () => true;
export const pageMatches = () => true;
export const isStepEligible = () => true;
export const findInitialStep = () => null;
export const findNextStep = () => null;
