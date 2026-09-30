import { describe, expect, it, vi } from "vitest";
import { applyActionErrors } from "./forms";

type Values = { phone: string; password: string };

describe("applyActionErrors", () => {
  it("does nothing on success", () => {
    const setError = vi.fn();
    expect(applyActionErrors<Values, void>({ ok: true, data: undefined }, setError, ["phone", "password"])).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it("puts API field errors on the matching fields and focuses the first", () => {
    const setError = vi.fn();
    const handled = applyActionErrors<Values, void>(
      { ok: false, message: "راجع البيانات", fieldErrors: { phone: "الرقم ده متسجل قبل كده", other: "x" } },
      setError,
      ["phone", "password"],
    );
    expect(handled).toBe(true);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("phone", { type: "server", message: "الرقم ده متسجل قبل كده" }, { shouldFocus: true });
  });

  it("falls back to a form-level message", () => {
    const setError = vi.fn();
    applyActionErrors<Values, void>({ ok: false, message: "رقم الموبايل أو كلمة السر غلط" }, setError, ["phone", "password"]);
    expect(setError).toHaveBeenCalledWith("root.server", { type: "server", message: "رقم الموبايل أو كلمة السر غلط" });
  });
});
