export type Messages = {
  timestamp: Date;
  publisherId: string; // todo: Change to UUID
  freelancerId: string; // todo: Change to UUID
  message: string;
  id: string;
};

export type Chats = {
  id: string;
  timestamp: Date;
  title: string;
  messages: Messages[];
};
