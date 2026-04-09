import ConversationClient from "./ConversationClient";
export default async function ChatPage({ params, searchParams }) {
  const { slug: gameId } = await params;

  const sp = await searchParams;
  const receiverId = sp?.receiver_id;

  return <ConversationClient gameId={gameId} receiverId={receiverId} />;
}
