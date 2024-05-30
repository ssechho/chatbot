export const ChatBubble = ({ message }) => {
  return (
    <div
      className={`flex ${
        message.role === "assistant" ? "justify-start" : "justify-end"
      } w-full`}
    >
      <div
        className={`flex items-center ${
          message.role === "assistant"
            ? "bg-neutral-200 text-neutral-900"
            : "bg-blue-500 text-white"
        } rounded-2xl px-3 py-2 max-w-[67%] whitespace-pre-wrap`}
        style={{ overflowWrap: "anywhere" }}
      >
        {message.parts[0].text}
      </div>
    </div>
  );
};
