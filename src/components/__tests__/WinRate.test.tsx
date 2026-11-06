import { render } from "@solidjs/web";
import { describe, expect, it } from "vitest";
import { setEvaluation, setShowScore } from "../../store";
import UI from "../UI";

const nextTick = () => new Promise((r) => setTimeout(r, 50));

describe("评分条", () => {
  it("随搜索分更新红方百分比", async () => {
    setShowScore(true);
    setEvaluation(0);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const dispose = render(() => <UI />, container);
    const bar = () => container.querySelector('[data-testid="score-bar-red"]') as HTMLElement;

    expect(bar().style.width).toBe("50%");

    setEvaluation(474);
    await nextTick();
    expect(bar().style.width).toBe("100%");
    expect(bar().textContent).toContain("100%");

    setEvaluation(-10000);
    await nextTick();
    expect(bar().style.width).toBe("0%");

    dispose();
    container.remove();
  });
});
