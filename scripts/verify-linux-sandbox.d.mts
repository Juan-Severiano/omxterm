export function inspectLinuxAppRun(source: string | Buffer): void;
export interface LinuxRendererEvidence {
  arguments: string[];
  uidMap: string;
  statuses: string[];
}
export function inspectLinuxRendererSandbox(
  renderers: LinuxRendererEvidence[],
  hostUidMap: string,
): number;
export function verifyLinuxRendererSandbox(
  processGroupId: number,
): Promise<number>;
