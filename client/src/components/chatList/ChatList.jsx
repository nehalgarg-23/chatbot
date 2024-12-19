import { Link } from "react-router-dom";
import "./chatList.css";
import { useQuery } from "@tanstack/react-query";

const ChatList = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/userchats`, {
        credentials: "include",
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      }),
  });

  return (
    <div className="chatList">
      <span className="title">DASHBOARD</span>
      <Link to="/dashboard">Create a new Chat</Link>
      <Link to="/">Explore Nesa AI</Link>
      <Link to="/">Contact</Link>
      <hr />
      <span className="title">RECENT CHATS</span>
      <div className="list">
        {isLoading ? (
          "Loading..."
        ) : error ? (
          <div>
            Something went wrong!{" "}
            <span style={{ color: "red" }}>{error.message}</span>
          </div>
        ) : (
          data?.map((chat) => (
            <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
              {chat.title}
            </Link>
          ))
        )}
      </div>
      <hr />
      <div className="upgrade">
        <img src="/logo.png" alt="Logo" />
        <div className="texts">
          <span>Upgrade to Nesa AI Pro</span>
          <span>Get unlimited access to all features</span>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
