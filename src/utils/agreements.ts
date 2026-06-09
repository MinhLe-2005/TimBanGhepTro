import { Roommate } from "../types";

export type AgreementStatus = "pending" | "signed" | "cancelled";

export interface AgreementRules {
  quiet?: string;
  cleaning?: string;
  visitors?: string;
  bills?: string;
  pets?: string;
  otherNotes?: string;
}

export interface AgreementRecord {
  id: string;
  creator_id: string;
  partner_id: string;
  creator_name?: string;
  partner_name?: string;
  creator_avatar?: string;
  partner_avatar?: string;
  status: AgreementStatus;
  rules: AgreementRules;
  created_at: string;
  updated_at: string;
  signed_at?: string;
  cancelled_at?: string;
  signed_by?: string;
  signed_by_name?: string;
  cancelled_by?: string;
  sender_id?: string;
}

interface AgreementMessage {
  chat_id?: string;
  sender_id?: string;
  text?: string;
  timestamp?: string;
  created_at?: string;
}

const PREFIXES = {
  "[AGREEMENT_DRAFT]": "pending",
  "[AGREEMENT_SIGNED]": "signed",
  "[AGREEMENT_CANCELLED]": "cancelled",
} as const;

const getMessageTime = (message: AgreementMessage, payload: any) =>
  payload.timestamp || payload.updated_at || message.timestamp || message.created_at || new Date().toISOString();

const getChatParticipants = (chatId = "") => chatId.split("_").filter(Boolean);

export const getRoommateAuthId = (roommate?: Partial<Roommate> | null) =>
  roommate?.user_id || roommate?.auth_id || roommate?.postedBy || roommate?.id || "";

export const findRoommateByIdentity = (roommates: Roommate[], identity?: string) => {
  if (!identity) return undefined;
  return roommates.find((roommate) =>
    [roommate.id, roommate.user_id, roommate.auth_id, roommate.postedBy].includes(identity)
  );
};

export function buildAgreementHistory(messages: AgreementMessage[], currentUserId: string): AgreementRecord[] {
  const records = new Map<string, AgreementRecord>();

  [...messages]
    .sort((a, b) => {
      const aTime = new Date(a.timestamp || a.created_at || 0).getTime();
      const bTime = new Date(b.timestamp || b.created_at || 0).getTime();
      return aTime - bTime;
    })
    .forEach((message) => {
      if (!message.text) return;

      const prefix = Object.keys(PREFIXES).find((item) => message.text?.startsWith(item));
      if (!prefix) return;

      let payload: any;
      try {
        payload = JSON.parse(message.text.slice(prefix.length).trim());
      } catch {
        return;
      }

      if (!payload?.id) return;

      const status = PREFIXES[prefix as keyof typeof PREFIXES];
      const existing = records.get(payload.id);
      const participants = getChatParticipants(message.chat_id);
      const otherParticipant = participants.find((id) => id !== currentUserId) || "";
      const senderId = message.sender_id || payload.sender_id || "";
      const eventTime = getMessageTime(message, payload);

      const creatorId =
        payload.creator_id ||
        payload.creatorId ||
        existing?.creator_id ||
        (status === "pending" ? senderId : participants.find((id) => id !== senderId)) ||
        senderId;
      const partnerId =
        payload.partner_id ||
        payload.partnerId ||
        existing?.partner_id ||
        participants.find((id) => id !== creatorId) ||
        otherParticipant;

      const createdAt =
        payload.created_at ||
        payload.createdAt ||
        existing?.created_at ||
        (status === "pending" ? eventTime : eventTime);

      records.set(payload.id, {
        id: payload.id,
        creator_id: creatorId,
        partner_id: partnerId,
        creator_name: payload.creator_name || payload.creatorName || existing?.creator_name,
        partner_name: payload.partner_name || payload.partnerName || existing?.partner_name,
        creator_avatar: payload.creator_avatar || payload.creatorAvatar || existing?.creator_avatar,
        partner_avatar: payload.partner_avatar || payload.partnerAvatar || existing?.partner_avatar,
        status,
        rules: payload.rules || existing?.rules || {},
        created_at: createdAt,
        updated_at: eventTime,
        signed_at:
          status === "signed"
            ? payload.signed_at || payload.signedAt || eventTime
            : existing?.signed_at,
        cancelled_at:
          status === "cancelled"
            ? payload.cancelled_at || payload.cancelledAt || eventTime
            : existing?.cancelled_at,
        signed_by:
          payload.signed_by || payload.signedBy || (status === "signed" ? senderId : existing?.signed_by),
        signed_by_name: payload.signed_by_name || payload.signedByName || existing?.signed_by_name,
        cancelled_by:
          payload.cancelled_by ||
          payload.cancelledBy ||
          (status === "cancelled" ? senderId : existing?.cancelled_by),
        sender_id: senderId,
      });
    });

  return Array.from(records.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}
