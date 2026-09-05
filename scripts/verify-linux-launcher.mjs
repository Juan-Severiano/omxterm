import { createHash } from "node:crypto";

export function inspectLinuxAppRun(source) {
  // Pin the generated launcher, including unconditional --no-sandbox before
  // user arguments. A dependency upgrade requires reviewing the new launcher.
  if (
    createHash("sha256").update(source).digest("hex") !==
    "cf420f8ec7f7361c91716531c37246e8643c0c559f55223e2d8430de03aad4d5"
  )
    throw new Error(
      "Packaged AppRun does not match the reviewed Linux launch policy",
    );
}
