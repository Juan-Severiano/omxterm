interface ViewportMetrics {
  readonly scrollHeight: number;
  readonly clientHeight: number;
  readonly scrollTop: number;
}

// Native input acknowledgement and scrollbar presentation are separate events.
// A fixed sampling delay can observe accepted input in an older viewport frame.
export async function waitForLiveViewport<Metrics extends ViewportMetrics>(
  readMetrics: () => Metrics,
  nextFrame: () => Promise<void>,
  hasAcceptedInput: () => boolean = () => true,
): Promise<Metrics> {
  const deadline = performance.now() + 5_000;
  let current: Metrics;
  do {
    await nextFrame();
    current = readMetrics();
    if (
      hasAcceptedInput() &&
      current.scrollTop === current.scrollHeight - current.clientHeight
    )
      return current;
  } while (performance.now() < deadline);
  throw new Error(
    `Live viewport did not settle: accepted=${hasAcceptedInput()}, metrics=${JSON.stringify(current)}`,
  );
}
