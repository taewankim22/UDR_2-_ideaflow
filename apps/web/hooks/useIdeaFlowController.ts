"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  AIEvaluation,
  ApiResponse,
  AuthSession,
  CreateIdeaRequest,
  IdeaCard,
  IdeaDetail,
  PointSummary,
  Provider,
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
  username: "아이디어 메이커"
};

function errorMessage(result: Extract<ApiResponse<unknown>, { success: false }>) {
  if (result.error.code === "UNAUTHORIZED") return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
  if (result.error.code === "INSUFFICIENT_POINTS") return result.error.message || "포인트가 부족합니다.";
  if (result.error.code === "AI_UNAVAILABLE") return result.error.message || "AI 평가에 실패했습니다. 다시 시도해 주세요.";
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
  const [feedTab, setFeedTab] = useState<FeedTab>("recommended");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [ideaForm, setIdeaForm] = useState<CreateIdeaRequest>(initialIdeaForm);

  const handleFailure = useCallback(
    (result: Extract<ApiResponse<unknown>, { success: false }>) => {
      const nextMessage = errorMessage(result);
      setMessage(nextMessage);
      if (result.error.code === "UNAUTHORIZED") {
        client.logout();
        setSession(null);
        setIdeas([]);
        setSelectedIdea(null);
        setWhiteboard(null);
        setEvaluation(null);
        setPoints(null);
        setView("feed");
      }
    },
    [client]
  );

  const isOwnIdea = useCallback(
    (idea: IdeaCard | IdeaDetail | null) => Boolean(session && idea && idea.authorName === session.user.username),
    [session]
  );

  const ownIdeas = useMemo(() => ideas.filter(isOwnIdea), [ideas, isOwnIdea]);
  const visibleIdeas = ideas;

  const selectIdea = useCallback(
    async (id: string) => {
      const result = await client.getIdea(id);
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setSelectedIdea(result.data);
      setMessage(null);
    },
    [client, handleFailure]
  );

  const refreshPoints = useCallback(async () => {
    const result = await client.getPoints();
    if (!result.success) {
      handleFailure(result);
      return;
    }
    setPoints(result.data);
    setSession((previous) => (previous ? { ...previous, user: result.data.user } : previous));
  }, [client, handleFailure]);

  const refreshIdeas = useCallback(
    async (focusId?: string, tab = feedTab) => {
      const result = await client.listIdeas({ tab });
      if (!result.success) {
        handleFailure(result);
        return;
      }

      setIdeas(result.data);
      const nextId = focusId ?? selectedIdea?.id ?? result.data[0]?.id;
      if (nextId) {
        await selectIdea(nextId);
      }
    },
    [client, feedTab, handleFailure, selectIdea, selectedIdea?.id]
  );

  const loadWhiteboard = useCallback(
    async (ideaId: string) => {
      const result = await client.getWhiteboard(ideaId);
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setWhiteboard(result.data);
    },
    [client, handleFailure]
  );

  const loadEvaluation = useCallback(
    async (ideaId: string) => {
      const result = await client.getEvaluation(ideaId);
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setEvaluation(result.data);
    },
    [client, handleFailure]
  );

  const loadAppData = useCallback(
    async (focusId?: string) => {
      setIsLoading(true);
      try {
        await refreshIdeas(focusId);
        await refreshPoints();
      } finally {
        setIsLoading(false);
      }
    },
    [refreshIdeas, refreshPoints]
  );

  useEffect(() => {
    const stored = client.getStoredSession();
    if (stored) {
      setSession(stored);
      void loadAppData();
    }
  }, [client, loadAppData]);

  useEffect(() => {
    if (session) {
      void refreshIdeas(undefined, feedTab);
    }
  }, [feedTab, refreshIdeas, session]);

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
  }, [view, selectedIdea?.id, isOwnIdea, loadWhiteboard, loadEvaluation, refreshPoints]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3600);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await client.login(loginForm);
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setSession(result.data);
      setMessage(null);
      await loadAppData();
    } finally {
      setIsLoading(false);
    }
  }

  async function socialLogin(provider: Provider) {
    setIsLoading(true);
    try {
      const result = await client.login({ ...loginForm, provider });
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setSession(result.data);
      setMessage(`${provider === "kakao" ? "카카오" : "구글"} 콜백을 mock으로 처리했습니다.`);
      await loadAppData();
    } finally {
      setIsLoading(false);
    }
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
    try {
      const result = await client.createIdea(ideaForm);
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setIdeaForm(initialIdeaForm);
      setSelectedIdea(result.data);
      setView("whiteboard");
      await loadAppData(result.data.id);
      await loadWhiteboard(result.data.id);
      setMessage("아이디어를 저장하고 +10P를 적립했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function unlockIdea() {
    if (!selectedIdea) return;
    const result = await client.unlockIdea(selectedIdea.id);
    if (!result.success) {
      handleFailure(result);
      return;
    }
    setSelectedIdea(result.data);
    await refreshIdeas(result.data.id);
    await refreshPoints();
  }

  async function likeIdea(id: string) {
    const result = await client.likeIdea(id);
    if (!result.success) {
      handleFailure(result);
      return;
    }
    setIdeas((previous) => previous.map((idea) => (idea.id === result.data.id ? result.data : idea)));
    if (selectedIdea?.id === result.data.id) {
      void selectIdea(result.data.id);
    }
  }

  async function saveWhiteboard() {
    if (!whiteboard) return;
    setIsSavingBoard(true);
    try {
      const result = await client.updateWhiteboard(whiteboard.ideaId, { nodes: whiteboard.nodes });
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setWhiteboard(result.data);
      setMessage("화이트보드를 자동저장했습니다.");
    } finally {
      setIsSavingBoard(false);
    }
  }

  async function runAI() {
    if (!selectedIdea) return;
    if (balance < 5) {
      setMessage("AI 평가에는 5P가 필요합니다. 포인트가 부족합니다.");
      return;
    }
    setIsRunningAI(true);
    try {
      const result = await client.evaluateIdea(selectedIdea.id);
      if (!result.success) {
        handleFailure(result);
        return;
      }
      setEvaluation(result.data);
      await refreshPoints();
      setMessage("AI 요약과 평가가 완료되었습니다.");
    } finally {
      setIsRunningAI(false);
    }
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
      socialLogin,
      logout,
      createIdea,
      selectIdea,
      pickOwnIdea,
      unlockIdea,
      likeIdea,
      saveWhiteboard,
      runAI
    }
  };
}
