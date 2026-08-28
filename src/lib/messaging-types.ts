export type MessageRecipientType = "user" | "department";

export type MessageSource = "manual" | "rengoring-pedel";

export interface PlatformMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientType: MessageRecipientType;
  recipientUserId?: string;
  recipientUserName?: string;
  recipientDepartmentId?: string;
  recipientDepartmentName?: string;
  subject: string;
  body: string;
  createdAt: string;
  readByUserIds: string[];
  source?: MessageSource;
}
