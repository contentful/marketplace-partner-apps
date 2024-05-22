import { useState } from "react";

type Feedback = {
  type: "error" | "success";
  message: string;
};

export default function useSidebarFeedback() {
    const [feedback, setFeedback] = useState<Feedback | null>(null);

    const clearFeedback = () => {
        setFeedback(null);
    };

    const handleFeedback = (type: "error" | "success", message: string) => {
        setFeedback({ type, message });
    }

    return { feedback, clearFeedback, handleFeedback };
}
