import { describe, expect, it } from "vitest";
import { publicQuotePath, quoteShareMessage, shopContactMessage, whatsAppUrl } from "./share";

describe("sharing", () => {
  it("builds the client message with the first name, total and link", () => {
    expect(
      quoteShareMessage({ clientName: " أحمد محمد", shopName: "ستائر النيل", number: 1025, total: 10700, link: "https://sijaf.app/q/abc" }),
    ).toBe("أهلاً أحمد،\nده عرض سعر ستائر النيل رقم #1025 بإجمالي 10,700 ج.م.\nتقدر تشوف التفاصيل هنا: https://sijaf.app/q/abc");
  });

  it("links to WhatsApp with the Egyptian number in international form", () => {
    expect(whatsAppUrl("01001234567", "أهلاً #1")).toBe("https://wa.me/201001234567?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%20%231");
    expect(whatsAppUrl(null, "x")).toBe("https://wa.me/?text=x");
  });

  it("encodes the token in the public path", () => {
    expect(publicQuotePath("a-b_c")).toBe("/q/a-b_c");
    expect(shopContactMessage(1025)).toBe("أهلاً، بخصوص عرض السعر رقم #1025");
  });
});
