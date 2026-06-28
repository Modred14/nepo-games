import ConversationClient from "./ConversationClient";
export async function generateMetadata() {
  return {
    title: "Conversation",
    description: "Chat with the seller and complete your game account purchase securely on Nepogames.",
    robots: { index: false, follow: false },
  };
}

export default async function ChatPage({ params, searchParams }) {
  const { slug: gameId } = await params;

  const sp = await searchParams;
  const receiverId = sp?.receiver_id;

  return <ConversationClient gameId={gameId} receiverId={receiverId} />;
}
