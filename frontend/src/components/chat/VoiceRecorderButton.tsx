import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function VoiceRecorderButton({
  onRecorded,
  className,
  size = "sm",
}: {
  onRecorded: (blob: Blob) => void;
  className?: string;
  size?: "sm" | "default";
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const interval = window.setInterval(() => {
      if (startedAtRef.current) {
        setDurationMs(Date.now() - startedAtRef.current);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRecording]);

  useEffect(
    () => () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      window.alert("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setDurationMs(0);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 0) {
          onRecorded(blob);
        }

        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
        chunksRef.current = [];
        startedAtRef.current = null;
        setDurationMs(0);
        setIsRecording(false);
      });

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Unable to start voice recording", error);
      window.alert("Microphone access is required to record audio.");
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "default" : "outline"}
      size={size}
      className={className}
      onClick={() => {
        if (isRecording) {
          stopRecording();
          return;
        }

        void startRecording();
      }}
    >
      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      {isRecording ? `Stop ${formatDuration(durationMs)}` : "Voice"}
    </Button>
  );
}
