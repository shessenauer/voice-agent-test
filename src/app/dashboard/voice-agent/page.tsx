import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App from "@/app/App";

export default function VoiceAgentPage() {
  return (
    <div className="h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <TranscriptProvider>
          <EventProvider>
            <App />
          </EventProvider>
        </TranscriptProvider>
      </Suspense>
    </div>
  );
}
