import { renderToString } from "react-dom/server";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { withDefault } from "./forms";

type Values = { fullness: number; name: string; note: string | null };

function ModelForm({ withValues }: { withValues: boolean }) {
  const form = useForm<Values>({ defaultValues: { fullness: 2.5, name: "ويفي", note: null } });
  const bind = (name: keyof Values) => (withValues ? withDefault(form, name) : form.register(name));
  return (
    <form>
      <input aria-label="fullness" {...bind("fullness")} />
      <input aria-label="name" {...bind("name")} />
      <input aria-label="note" {...bind("note")} />
    </form>
  );
}

describe("withDefault", () => {
  it("puts the values in server-rendered HTML (register alone does not)", () => {
    expect(renderToString(<ModelForm withValues={false} />)).not.toContain('value="2.5"');
    const html = renderToString(<ModelForm withValues />);
    expect(html).toContain('value="2.5"');
    expect(html).toContain('value="ويفي"');
    // null مابيتحولش لـ "null"
    expect(html).not.toContain('value="null"');
  });
});
