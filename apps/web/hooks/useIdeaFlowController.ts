"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import type {
  AIEvaluation,
  AuthSession,
  CreateIdeaRequest,
  IdeaCard,
  IdeaDetail,
  PointSummary,
  Whiteboard
} from "@ideaflow/shared/types";
import { createIdeaFlowClient } from "../lib/client";
import type { AppView, FeedTab, IdeaFlowController, LoginFormState } from "../types/app";

const initialIdeaForm: CreateIdeaRequest = {
  title: "",
  oneLine: "",
  problem: "",
  solution: "",
  category: "AI",
  coverImageUrl: null
};

const initialLoginForm: LoginFormState = {
  email: "demo@ideaflow.local",
  username: "김아이디어"
};

function getErrorMessage(result: { success: false; error: { message: string } }) {
  return result.error.message;
}

export function useIdeaFlowController(): IdeaFlowController {
  const client = useMemo(() => createIdeaFlowClient(), []);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ideas, setIdeas] = useState<IdeaCard[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<IdeaDetail | null>(null);
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [points, setPoints] = useState<PointSummary | null>(null);
  const [view, setView] = useState<AppView>("feed");
  const [feedTab, setFeedTab] = useState<FeedTab>("latest");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [ideaForm, setIdeaForm] = useState<CreateIdeaRequest>(initialIdeaForm);

  const isOwnIdea = (idea: IdeaCard | IdeaDetail | null) =>
    Boolean(session && idea && idea.authorName === session.user.username);

  const ownIdeas = ideas.filter(isOwnIdea);
  const visibleIdeas = ideas.filter((idea) => {
    if (feedTab === "mine") {
      return isOwnIdea(idea);
    }
    if (feedTab === "recommended") {
      return idea.category === "AI" || idea.likeCount >= 8;
    }
    return true;
  });

  async function refreshPoints() {
    const result = await client.getPoints();
    if (!result.success) {
      setMessage(getErrorMessage(result));
      return;
    }
    setPoints(result.data);
    setSession((previous) => (previous ? { ...previous, user: result.data.user } : previous));
  }

  async function selectIdea(id: string) {
    const result = await client.getIdea(id);
    if (!result.success) {
      setMessage(getErrorMessage(result));
      return;
    }
    setSelectedIdea(result.data);
    setMessage(null);
  }

  async function refreshIdeas(focusId?: string) {
    const result = await client.listIdeas();
    if (!result.success) {
      setMessage(getErrorMessage(result));
      return;
    }

    setIdeas(result.data);
    const nextId = focusId ?? selectedIdea?.id ?? result.data[0]?.id;
    if (nextId) {
      await selectIdea(nextId);
    }
  }

  async function loadWhiteboard(ideaId: string) {
    const result = await client.getWhiteboard(ideaId);
    if (!result.success) {
      setMessage(getErrorMessage(result));
      return;
    }
    setWhiteboard(result.data);
  }

  async function loadEvaluation(ideaId: string) {
    const result = await client.getEvaluation(ideaId);
    if (!result.success) {
      setMessage(getErrorMessage(result));
      return;
    }
    setEvaluation(result.data);
  }

  async function loadAppData(focusId?: string) {
    setIsLoading(true);
    try {
      await refreshIdeas(focusId);
      await refreshPoints();
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const stored = client.getStoredSession();
    if (stored) {
      setSession(stored);
      void loadAppData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    if (view === "whiteboard" && selectedIdea && isOwnIdea(selectedIdea)) {
      void loadWhiteboard(selectedIdea.id);
    }
    if (view === "ai" && selectedIdea && isOwnIdea(selectedIdea)) {
      void loadEvaluation(selectedIdea.id);
      void loadWhiteboard(selectedIdea.id);
    }
    if (view === "profile") {
      void refreshPoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedIdea?.id]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const result = await client.login(loginForm);
    if (!result.success) {
      setMessage(getErrorMessage(result));
      setIsLoading(false);
      return;
    }
    setSession(result.data);
    setMessage(null);
    await loadAppData();
  }

  function logout() {
    client.logout();
    setSession(null);
    setIdeas([]);
    setSelectedIdea(null);
    setWhiteboard(null);
    setEvaluation(null);
    setPoints(null);
    setView("feed");
  }

  async function createIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const result = await client.createIdea(ideaForm);
    if (!result.success) {
      setMessage(getErrorMessage(result));
      setIsLoading(false);
      return;
    }
    setIdeaForm(initialIdeaForm);
    setSelectedIdea(result.data);
    setFeedTab("mine");
    setView("whiteboard");
    await loadAppData(result.data.id);
    await loadWhiteboard(result.data.id);
  }

  async function unlockIdea() {
    if (!selectedIdea) {
      return;
    }
    const result = await client.unlockIdea(selectedIdea.id);
    if (!result.success) {
      setMessage(getErrorMessage(result));
      return;
    }
    setSelectedIdea(result.data);
    await refreshIdeas(result.data.id);
    await refreshPoints();
  }

  async function saveWhiteboard() {
    if (!whiteboard) {
      return;
    }
    setIsSavingBoard(true);
    const result = await client.updateWhiteboard(whiteboard.ideaId, { nodes: whiteboard.nodes });
    if (!result.success) {
      setMessage(getErrorMessage(result));
      setIsSavingBoard(false);
      return;
    }
    setWhiteboard(result.data);
    setMessage("화이트보드를 저장했습니다.");
    setIsSavingBoard(false);
  }

  async function runAI() {
    if (!selectedIdea) {
      return;
    }
    setIsRunningAI(true);
    const result = await client.evaluateIdea(selectedIdea.id);
    if (!result.success) {
      setMessage(getErrorMessage(result));
      setIsRunningAI(false);
      return;
    }
    setEvaluation(result.data);
    await refreshPoints();
    setMessage("AI 평가가 완료되었습니다.");
    setIsRunningAI(false);
  }

  function pickOwnIdea(id: string) {
    void selectIdea(id);
    setWhiteboard(null);
    setEvaluation(null);
  }

  const balance = points?.user.pointsBalance ?? session?.user.pointsBalance ?? 0;

  return {
    state: {
      session,
      ideas,
      visibleIdeas,
      ownIdeas,
      selectedIdea,
      whiteboard,
      evaluation,
      points,
      view,
      feedTab,
      message,
      isLoading,
      isSavingBoard,
      isRunningAI,
      loginForm,
      ideaForm,
      balance,
      isOwnIdea
    },
    actions: {
      setView,
      setFeedTab,
      setLoginForm,
      setIdeaForm,
      setWhiteboard,
      refresh: loadAppData,
      login,
      logout,
      createIdea,
      selectIdea,
      pickOwnIdea,
      unlockIdea,
      saveWhiteboard,
      runAI
    }
  };
}
