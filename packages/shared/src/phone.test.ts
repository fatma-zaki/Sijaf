import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.js";
import { formatEgyptianMobile, normalizeEgyptianMobile, toWhatsAppNumber } from "./phone.js";

describe("normalizeEgyptianMobile", () => {
  it.each([
    ["01001234567", "01001234567"],
    ["0100 123 4567", "01001234567"],
    ["0100-123-4567", "01001234567"],
    ["+201001234567", "01001234567"],
    ["00201001234567", "01001234567"],
    ["201221234567", "01221234567"],
    ["٠١٥٥٢١٠٧٧٦٥", "01552107765"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeEgyptianMobile(input)).toBe(expected);
  });

  it.each(["0100123456", "01301234567", "0223456789", "abc", ""])("rejects %s", (input) => {
    expect(normalizeEgyptianMobile(input)).toBeNull();
  });
});

describe("mobile helpers", () => {
  it("formats like the design and builds wa.me numbers", () => {
    expect(formatEgyptianMobile("01001234567")).toBe("0100 123 4567");
    expect(toWhatsAppNumber("01001234567")).toBe("201001234567");
  });
});

describe("auth schemas", () => {
  it("normalizes the phone on login", () => {
    const data = loginSchema.parse({ phone: "0100 123 4567", password: "x" });
    expect(data).toEqual({ phone: "01001234567", password: "x", remember: true });
  });

  it("gives Arabic messages", () => {
    const result = registerSchema.safeParse({ shopName: "", ownerName: "محمد", phone: "123", password: "short" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toContain("اكتب اسم المحل");
    expect(messages).toContain("رقم الموبايل لازم يبقى 11 رقم ويبدأ بـ 01");
    expect(messages).toContain("كلمة السر لازم تبقى 8 حروف على الأقل");
  });
});
