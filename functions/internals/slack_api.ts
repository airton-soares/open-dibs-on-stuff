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

// Unlike chat.postMessage, which reaches public channels through chat:write.public,
// chat.postEphemeral only works in channels the app is a member of.
const INVITE_HINT = "Convide o app no canal com /invite @open-dibs-on-stuff e tente de novo.";

export async function postEphemeral(
  // deno-lint-ignore no-explicit-any
  client: any,
  args: { channel: string; user: string; text: string },
): Promise<void> {
  const res = await client.chat.postEphemeral(args);
  assertOk(res, "chat.postEphemeral", {
    channel_not_found: INVITE_HINT,
    not_in_channel: INVITE_HINT,
  });
}
