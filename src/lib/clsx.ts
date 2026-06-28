type Arg = string | number | false | null | undefined | Record<string, unknown> | Arg[];

export default function clsx(...args: Arg[]): string {
  const out: string[] = [];
  const walk = (arg: Arg) => {
    if (!arg) return;
    if (typeof arg === "string" || typeof arg === "number") {
      out.push(String(arg));
      return;
    }
    if (Array.isArray(arg)) {
      arg.forEach(walk);
      return;
    }
    Object.entries(arg).forEach(([key, value]) => {
      if (value) out.push(key);
    });
  };

  args.forEach(walk);

  return out.join(" ");
}
