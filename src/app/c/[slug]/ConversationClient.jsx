"use client";

import { useEffect, useState } from "react";
import Conversation from "@/components/Conversation";

export default function ConversationClient({ gameId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("nepo-user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    setUser(user);

    const user_id = user?.id;

    if (!gameId || !user.id) return;
    const load = async () => {
      setLoading(true);
      const res = await fetch(
        `/api/c/${gameId}/messages?user_id=${user_id}&receiver_id=${receiverId}`,
      );
      const data = await res.json();

      setMessages(data.messages);
      setConversation(data.conversation);
      setLoading(false);
    };

    load();
  }, [gameId]);

  return (
    <Conversation
      chatId={conversation?.id}
      gameId={gameId}
      receiverId={receiverId}
      initialMessages={messages}
      userId={user?.id}
      loading={loading}
    />
  );
}
