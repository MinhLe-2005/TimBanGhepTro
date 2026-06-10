export const ADMIN_USER_ID =
  import.meta.env.VITE_ADMIN_USER_ID ||
  "7a1b28ab-058f-49b6-85bb-3cb61406db31";

export const CHAT_REPORT_PREFIX = "SYSTEM_REPORTS";
export const REVIEW_REPORT_PREFIX = "SYSTEM_REVIEW_REPORTS";

export const getModerationChannel = (
  prefix: string,
  reporterId: string
) => `${prefix}_${ADMIN_USER_ID}_${reporterId}`;

export const isModerationChannel = (
  chatId: string | undefined,
  prefix: string
) => Boolean(chatId && (chatId === prefix || chatId.startsWith(`${prefix}_`)));
