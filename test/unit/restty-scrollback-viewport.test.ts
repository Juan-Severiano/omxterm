import { afterEach, expect, it, vi } from "vitest";
import { waitForLiveViewport } from "../fixtures/restty-scrollback-viewport";

const top = { scrollHeight: 16_419, clientHeight: 411, scrollTop: 0 };
const bottom = { ...top, scrollTop: 16_008 };
afterEach(() => vi.restoreAllMocks());

it("does not sample a stale viewport after accepted input, even past 150 ms", async () => {
  let clock = 0;
  let frame = 0;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  const nextFrame = vi.fn(async () => {
    frame += 1;
    clock += 200;
  });

  const result = await waitForLiveViewport(
    () => (frame < 3 ? top : bottom),
    nextFrame,
    () => true,
  );

  expect(result).toEqual(bottom);
  expect(nextFrame).toHaveBeenCalledTimes(3);
});

it("does not mistake an already-live viewport for unacknowledged input", async () => {
  let frame = 0;
  const nextFrame = vi.fn(async () => {
    frame += 1;
  });
  const result = await waitForLiveViewport(
    () => bottom,
    nextFrame,
    () => frame === 2,
  );

  expect(result).toEqual(bottom);
  expect(nextFrame).toHaveBeenCalledTimes(2);
});

it.each([true, false])(
  "preserves a bounded failure instead of manufacturing readiness (accepted=%s)",
  async (accepted) => {
    let clock = 0;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    const nextFrame = vi.fn(async () => {
      clock += 2_000;
    });

    const metrics = accepted ? top : bottom;
    await expect(
      waitForLiveViewport(
        () => metrics,
        nextFrame,
        () => accepted,
      ),
    ).rejects.toThrow(
      `accepted=${accepted}, metrics=${JSON.stringify(metrics)}`,
    );
    expect(nextFrame).toHaveBeenCalledTimes(3);
  },
);
