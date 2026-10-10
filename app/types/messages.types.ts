export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  readAt?: Date;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  assignmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
};
