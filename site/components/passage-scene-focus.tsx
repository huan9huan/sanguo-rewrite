"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

function clearMarks() {
  document.querySelectorAll(".scene-reading-block.is-scene-target").forEach((element) => {
    element.classList.remove("is-scene-target");
  });
  document.querySelectorAll(".scene-comic-block.is-frame-target").forEach((element) => {
    element.classList.remove("is-frame-target");
  });
}

export function PassageSceneFocus() {
  const searchParams = useSearchParams();
  const sceneId = searchParams.get("scene");
  const frameId = searchParams.get("frame");

  useEffect(() => {
    clearMarks();

    if (!sceneId) {
      return;
    }

    const sceneElement = document.getElementById(`scene-${sceneId}`);
    if (!sceneElement) {
      return;
    }

    sceneElement.classList.add("is-scene-target");
    sceneElement.scrollIntoView({ behavior: "smooth", block: "start" });

    if (frameId) {
      const frameElement = sceneElement.querySelector<HTMLElement>(`[data-frame-ids~="${frameId}"]`);
      if (frameElement) {
        frameElement.classList.add("is-frame-target");
      }
    }
  }, [frameId, sceneId]);

  return null;
}
