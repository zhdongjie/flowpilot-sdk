import type { BehaviorEvent } from "./protocol";

export type BehaviorRuleLeaf = {
  field: string;
  op:
    | "eq"
    | "neq"
    | "includes"
    | "in"
    | "exists"
    | "truthy"
    | "falsy"
    | "match";
  value?: any;
};

export type BehaviorRuleGroup = {
  all?: BehaviorRule[];
  any?: BehaviorRule[];
  not?: BehaviorRule;
};

export type BehaviorRule = BehaviorRuleLeaf | BehaviorRuleGroup;

const getByPath = (input: Record<string, any>, path: string) => {
  if (!path) {
    return undefined;
  }
  return path.split(".").reduce<any>((acc, key) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    return acc[key];
  }, input);
};

const isLeaf = (rule: BehaviorRule): rule is BehaviorRuleLeaf =>
  typeof (rule as BehaviorRuleLeaf).field === "string" &&
  typeof (rule as BehaviorRuleLeaf).op === "string";

const evaluateLeaf = (rule: BehaviorRuleLeaf, event: BehaviorEvent) => {
  const actual = getByPath(event as Record<string, any>, rule.field);

  switch (rule.op) {
    case "eq":
      return actual === rule.value;
    case "neq":
      return actual !== rule.value;
    case "includes":
      if (typeof actual === "string") {
        return typeof rule.value === "string" && actual.includes(rule.value);
      }
      if (Array.isArray(actual)) {
        return actual.includes(rule.value);
      }
      return false;
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(actual);
    case "exists":
      if (rule.value === false) {
        return actual === null || actual === undefined;
      }
      return actual !== null && actual !== undefined;
    case "truthy":
      return Boolean(actual);
    case "falsy":
      return !actual;
    case "match":
      if (typeof actual !== "string" || typeof rule.value !== "string") {
        return false;
      }
      try {
        return new RegExp(rule.value).test(actual);
      } catch (_error) {
        return false;
      }
    default:
      return false;
  }
};

export const evaluateBehaviorRule = (
  rule: BehaviorRule | undefined,
  event: BehaviorEvent
) => {
  if (!rule) {
    return true;
  }

  if (isLeaf(rule)) {
    return evaluateLeaf(rule, event);
  }

  if (Array.isArray(rule.all) && rule.all.length > 0) {
    return rule.all.every((item) => evaluateBehaviorRule(item, event));
  }

  if (Array.isArray(rule.any) && rule.any.length > 0) {
    return rule.any.some((item) => evaluateBehaviorRule(item, event));
  }

  if (rule.not) {
    return !evaluateBehaviorRule(rule.not, event);
  }

  return false;
};
