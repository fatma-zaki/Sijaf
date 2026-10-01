import { describe, expect, it } from "vitest";
import { fitWithin } from "./compress";

describe("fitWithin", () => {
  it("scales the longest side down to 1400px keeping the ratio", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1400, height: 1050 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1050, height: 1400 });
  });

  it("never enlarges small photos", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
