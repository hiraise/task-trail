import { useState } from "react";
import { toast } from "sonner";

export const usePasswordRecovery = () => {
  const [loading, setLoading] = useState(false);

  const recover = async (email: string) => {
    setLoading(true);
    try {
      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // await new Promise((_, reject) =>
      //   setTimeout(() => reject(new Error("Simulated error")), 2000)
      // );
      toast.success("Email sent successfully!");
      console.log(`Email sent to ${email}`);
    } catch (error) {
      toast.error("Failed to send email. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return { recover, loading };
};
