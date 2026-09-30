import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { initials } from "./avatar";
import { buttonStyles } from "./button";
import { ConfidenceBadge } from "./confidence";
import { Field, Input, Select } from "./field";
import { FilterChips } from "./filter-chips";
import { NumberField } from "./number-field";
import { SegmentedControl } from "./segmented-control";
import { Stepper } from "./stepper";
import { TierCard } from "./tier-card";

describe("buttonStyles", () => {
  it("keeps the variant text color when merging custom classes", () => {
    const classes = buttonStyles({ variant: "primary", className: "text-md" });
    expect(classes).toContain("text-on-primary");
    expect(classes).toContain("text-md");
    expect(classes).not.toMatch(/\btext-base\b/);
  });
});

describe("initials", () => {
  it("takes two letters", () => {
    expect(initials("محمد")).toBe("مح");
    expect(initials("عمرو خالد")).toBe("عخ");
    expect(initials("  ")).toBe("");
  });
});

describe("NumberField", () => {
  function Controlled({ onChange }: { onChange: (value: number | null) => void }) {
    const [value, setValue] = useState<number | null>(300);
    return (
      <NumberField
        label="العرض (سم)"
        value={value}
        min={0}
        step={10}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    );
  }

  it("steps up and down and is labelled", () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const input = screen.getByLabelText("العرض (سم)");
    expect(input).toHaveValue(300);
    fireEvent.click(screen.getByRole("button", { name: "زيادة العرض (سم)" }));
    expect(input).toHaveValue(310);
    fireEvent.click(screen.getByRole("button", { name: "تقليل العرض (سم)" }));
    expect(onChange).toHaveBeenLastCalledWith(300);
  });

  it("returns null when cleared", () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("العرض (سم)"), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe("FilterChips", () => {
  it("marks the selected chip with aria-pressed", () => {
    const onChange = vi.fn();
    render(
      <FilterChips
        label="الحالة"
        value="all"
        onValueChange={onChange}
        options={[
          { value: "all", label: "الكل" },
          { value: "draft", label: "مسودة" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "الكل" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "مسودة" }));
    expect(onChange).toHaveBeenCalledWith("draft");
  });
});

describe("SegmentedControl", () => {
  it("moves selection with arrow keys (RTL: left = next)", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="المستوى"
        value="standard"
        onValueChange={onChange}
        options={[
          { value: "economy", label: "اقتصادي" },
          { value: "standard", label: "متوسط" },
          { value: "premium", label: "فاخر" },
        ]}
      />,
    );
    const checked = screen.getByRole("radio", { name: "متوسط" });
    expect(checked).toHaveAttribute("aria-checked", "true");
    expect(checked).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(checked, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("premium");
  });
});

describe("Stepper", () => {
  it("marks the current step", () => {
    render(<Stepper label="خطوات" steps={["أ", "ب", "ج"]} current={1} />);
    const current = screen.getByText("ب").closest("li");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("خطوات: خطوة 2 من 3 · ب")).toBeInTheDocument();
  });

  it("uses explicit completion when steps finish out of order", () => {
    render(<Stepper label="خطوات" steps={["أ", "ب", "ج"]} current={2} completed={[true, false, false]} />);
    expect(screen.getAllByLabelText("تمت")).toHaveLength(1);
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("TierCard", () => {
  it("formats the price and reports selection", () => {
    const onSelect = vi.fn();
    render(<TierCard name="متوسط" price={10700} description="وصف" selected={false} onSelect={onSelect} />);
    expect(screen.getByText("10,700 ج.م")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "اختيار المستوى متوسط" }));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("ConfidenceBadge", () => {
  it("uses the warning style below 70%", () => {
    render(<ConfidenceBadge value={64} />);
    expect(screen.getByLabelText("الثقة 64%").className).toContain("bg-warning-soft");
  });
});

describe("Field", () => {
  it("names a select by its label only, not by its options", () => {
    render(
      <Field label="الطبقة">
        <Select defaultValue="main">
          <option value="main">قماش أساسي</option>
          <option value="sheer">شيفون</option>
        </Select>
      </Field>,
    );
    expect(screen.getByRole("combobox", { name: "الطبقة" })).toBeInTheDocument();
  });

  it("links hints and errors to the control", () => {
    const { rerender } = render(
      <Field label="السعر" hint="بالجنيه">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("السعر")).toHaveAccessibleDescription("بالجنيه");
    rerender(
      <Field label="السعر" error="اكتب السعر">
        <Input aria-invalid />
      </Field>,
    );
    expect(screen.getByLabelText("السعر")).toHaveAccessibleDescription("اكتب السعر");
    expect(screen.getByRole("alert")).toHaveTextContent("اكتب السعر");
  });
});
