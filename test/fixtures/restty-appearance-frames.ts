export const nativeFrame = requestAnimationFrame.bind(window);
const nativeCancelFrame = cancelAnimationFrame.bind(window);
const gateFrames =
  new URLSearchParams(location.search).get("gateFrames") === "true";
let gateHeld = false;
let releasedCallbacks = 0;
const releasedFrameTimes: number[] = [];
const frameTimes: number[] = [];
const heldCallbacks = new Set<number>();
const queuedFrames = new Map<
  number,
  { callback: FrameRequestCallback; nativeId: number }
>();
if (gateFrames) {
  let nextId = 0;
  window.requestAnimationFrame = (callback) => {
    const id = ++nextId;
    const nativeId = nativeFrame((time) => {
      queuedFrames.delete(id);
      callback(time);
    });
    queuedFrames.set(id, { callback, nativeId });
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    const entry = queuedFrames.get(id);
    if (entry) nativeCancelFrame(entry.nativeId);
    queuedFrames.delete(id);
    heldCallbacks.delete(id);
  };
}

export function releaseSelectionFrames(): void {
  gateHeld = false;
  for (const id of heldCallbacks) {
    const entry = queuedFrames.get(id);
    if (!entry) continue;
    releasedCallbacks += 1;
    entry.nativeId = nativeFrame((time) => {
      queuedFrames.delete(id);
      releasedFrameTimes.push(time);
      entry.callback(time);
    });
  }
  heldCallbacks.clear();
}

export const selectionFrame = () =>
  new Promise<void>((resolve) =>
    nativeFrame((time) => {
      frameTimes.push(time);
      resolve();
    }),
  );

export function beginSelectionFrameGate(): void {
  if (gateFrames) {
    // Only callbacks already queued by the live Surface are held. New fixture
    // RAF boundaries keep running: their completion is not render readiness.
    // Track queue identities, never callback source or production internals.
    if (queuedFrames.size === 0)
      throw new Error("Selection gate found no queued Surface frame");
    gateHeld = true;
    for (const [id, entry] of queuedFrames) {
      nativeCancelFrame(entry.nativeId);
      heldCallbacks.add(id);
    }
  }
}

export const waitForLayout = (observeSelectionFrames = false) =>
  new Promise<void>((resolve) =>
    requestAnimationFrame((firstTime) => {
      if (observeSelectionFrames) frameTimes.push(firstTime);
      requestAnimationFrame((secondTime) => {
        if (observeSelectionFrames) frameTimes.push(secondTime);
        resolve();
      });
    }),
  );

export function selectionFrameDiagnostics() {
  return {
    gateHeld,
    heldCallbacks: [...heldCallbacks],
    queuedCallbacks: [...queuedFrames.keys()],
    releasedCallbacks,
    releasedFrameTimes: [...releasedFrameTimes],
    frameCount: frameTimes.length,
    frameTimes: [...frameTimes],
    lastFrameAt: frameTimes.at(-1) ?? null,
  };
}
