"use client";
import Conversation from "@/components/Conversation";

export default function ConversationClient({ gameId, receiverId }) {
  return <Conversation gameId={gameId} receiverId={receiverId} />;
}
