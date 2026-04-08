import Conversation from "@/components/Conversation";

export default function Dashboard() {
  return (
    <div>
      <Conversation 
        buyerId="12345" 
        GameDetails={{ name: "Game 1" }} 
      />
    </div>
  );
}
