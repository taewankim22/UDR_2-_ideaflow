import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  AIEvaluation,
  AuthSession,
  CreateIdeaRequest,
  IdeaCard,
  IdeaDetail,
  PointSummary,
  Provider,
  Whiteboard
} from "@ideaflow/shared/types";

export type AppView = "feed" | "explore" | "compose" | "whiteboard" | "ai" | "profile";
export type FeedTab = "recommended" | "latest" | "following";

export interface LoginFormState {
  email: string;
  username: string;
}

export interface AppActions {
  setView: (view: AppView) => void;
  setFeedTab: (tab: FeedTab) => void;
  setLoginForm: Dispatch<SetStateAction<LoginFormState>>;
  setIdeaForm: Dispatch<SetStateAction<CreateIdeaRequest>>;
  setWhiteboard: Dispatch<SetStateAction<Whiteboard | null>>;
  refresh: () => Promise<void>;
  login: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  socialLogin: (provider: Provider) => Promise<void>;
  logout: () => void;
  createIdea: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectIdea: (id: string) => Promise<void>;
  pickOwnIdea: (id: string) => void;
  unlockIdea: () => Promise<void>;
  likeIdea: (id: string) => Promise<void>;
  saveWhiteboard: () => Promise<void>;
  runAI: () => Promise<void>;
}

export interface AppState {
  session: AuthSession | null;
  ideas: IdeaCard[];
  visibleIdeas: IdeaCard[];
  ownIdeas: IdeaCard[];
  selectedIdea: IdeaDetail | null;
  whiteboard: Whiteboard | null;
  evaluation: AIEvaluation | null;
  points: PointSummary | null;
  view: AppView;
  feedTab: FeedTab;
  message: string | null;
  isLoading: boolean;
  isSavingBoard: boolean;
  isRunningAI: boolean;
  loginForm: LoginFormState;
  ideaForm: CreateIdeaRequest;
  balance: number;
  isOwnIdea: (idea: IdeaCard | IdeaDetail | null) => boolean;
}

export interface IdeaFlowController {
  state: AppState;
  actions: AppActions;
}
