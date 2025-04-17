import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-black animate-spin"><Loader2/></span>
      </div>
    );
  }