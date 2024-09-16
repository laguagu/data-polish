"use client";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isPending: boolean;
  file: File | null;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isPending, file }) => {
  return (
    <div>
      <Button
        type="submit"
        disabled={isPending || !file}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isPending ? "Prosessoidaan..." : "Prosessoi tiedosto"}
      </Button>
    </div>
  );
};

export default SubmitButton;
