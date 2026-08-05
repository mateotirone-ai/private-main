// Bedrock's script runtime provides console; TS's ES-only lib doesn't declare it.
declare const console: {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};
