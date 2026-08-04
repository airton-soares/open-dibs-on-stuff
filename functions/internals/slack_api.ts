export interface ApiResponse {
  ok?: boolean;
  error?: string;
}

// deno-slack-api resolves with { ok: false, error } instead of throwing, so an unchecked call
// fails silently: the function reports success and nothing shows up in Slack.
export function assertOk(
  res: ApiResponse | undefined | null,
  call: string,
  hints: Record<string, string> = {},
): void {
  if (res && res.ok) return;
  const error = res?.error ?? "resposta sem ok";
  const hint = hints[error];
  throw new Error(`${call} falhou: ${error}${hint ? `. ${hint}` : ""}`);
}
