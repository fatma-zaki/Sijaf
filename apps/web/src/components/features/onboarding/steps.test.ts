import { describe, expect, it } from "vitest";
import { firstPendingStep, isStepDone, nextStep } from "./steps";

describe("onboarding steps", () => {
  it("finds the first pending step in order", () => {
    expect(firstPendingStep({ completedSteps: [] })).toBe("shop");
    expect(firstPendingStep({ completedSteps: ["shop", "team"] })).toBe("prices");
    expect(firstPendingStep({ completedSteps: ["shop", "prices", "models", "team"] })).toBeNull();
  });

  it("never marks the first quote as done from onboarding data", () => {
    expect(isStepDone({ completedSteps: ["shop"] }, "shop")).toBe(true);
    expect(isStepDone({ completedSteps: ["shop"] }, "first-quote")).toBe(false);
  });

  it("walks to the next step", () => {
    expect(nextStep("shop")).toBe("prices");
    expect(nextStep("team")).toBeNull();
  });
});
