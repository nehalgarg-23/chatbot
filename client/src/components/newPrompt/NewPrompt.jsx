import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import model from "../../lib/gemini";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const queryClient = useQueryClient();
  const chat = model.startChat({
    history: data?.history?.map(({ role, parts }) => ({
      role,
      parts: [{ text: parts[0].text }],
    })) || [],
  });

  const endRef = useRef(null);
  const formRef = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current && data?.history?.length === 1) {
      addMessage(data.history[0].parts[0].text, true);
      hasRun.current = true;
    }
  }, [data]);
  

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data, question, answer, img.dbData]);

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question || undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json()),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", data._id] }).then(() => {
        resetForm();
      });
    },
    onError: (err) => console.error(err),
  });

  const resetForm = () => {
    formRef.current?.reset();
    setQuestion("");
    setAnswer("");
    setImg({ isLoading: false, error: "", dbData: {}, aiData: {} });
  };

  const addMessage = async (text, isInitial = false) => {
    if (!isInitial) setQuestion(text);

    try {
      const result = await chat.sendMessageStream(
        Object.keys(img.aiData).length ? [img.aiData, text] : [text]
      );
      let accumulatedText = "";
      for await (const chunk of result.stream) {
        accumulatedText += chunk.text();
        setAnswer((prev) => accumulatedText); // Functional update ensures no stale state.
      }
      mutation.mutate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (text) addMessage(text, false);
  };

  return (
    <>
      {/* Image Loading */}
      {img.isLoading && <div>Loading...</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData.filePath}
          width="380"
          transformation={[{ width: 380 }]}
        />
      )}

      {/* Chat Content */}
      {question && <div className="message user">{question}</div>}
      {answer && (
        <div className="message">
          <Markdown>{answer}</Markdown>
        </div>
      )}
      <div className="endChat" ref={endRef}></div>

      {/* Input Form */}
      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id="file" type="file" hidden />
        <input type="text" name="text" placeholder="Ask anything..." />
        <button>
          <img src="/arrow.png" alt="Send" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;
