"use client";

import { useIdeaFlowController } from "../hooks/useIdeaFlowController";
import { LoginScreen } from "../features/auth/LoginScreen";
import { AIView } from "../features/ai/AIView";
import { ComposeView } from "../features/compose/ComposeView";
import { FeedView } from "../features/feed/FeedView";
import { ProfileView } from "../features/profile/ProfileView";
import { WhiteboardView } from "../features/whiteboard/WhiteboardView";
import { AppShell } from "./layout/AppShell";

export function IdeaFlowApp() {
  const { state, actions } = useIdeaFlowController();

  if (!state.session) {
    return (
      <LoginScreen
        form={state.loginForm}
        setForm={actions.setLoginForm}
        isLoading={state.isLoading}
        message={state.message}
        onSubmit={actions.login}
      />
    );
  }

  return (
    <AppShell
      activeView={state.view}
      balance={state.balance}
      session={state.session}
      isLoading={state.isLoading}
      message={state.message}
      onNavigate={actions.setView}
      onLogout={actions.logout}
      onRefresh={() => void actions.refresh()}
    >
      {state.view === "feed" || state.view === "explore" ? (
        <FeedView
          mode={state.view === "explore" ? "explore" : "home"}
          feedTab={state.feedTab}
          setFeedTab={actions.setFeedTab}
          ideas={state.visibleIdeas}
          selectedIdea={state.selectedIdea}
          isOwnIdea={state.isOwnIdea}
          balance={state.balance}
          onSelect={actions.selectIdea}
          onUnlock={actions.unlockIdea}
          onOpenWhiteboard={() => actions.setView("whiteboard")}
          onOpenAI={() => actions.setView("ai")}
        />
      ) : null}

      {state.view === "compose" ? (
        <ComposeView
          form={state.ideaForm}
          setForm={actions.setIdeaForm}
          onSubmit={actions.createIdea}
          isLoading={state.isLoading}
        />
      ) : null}

      {state.view === "whiteboard" ? (
        <WhiteboardView
          ideas={state.ownIdeas}
          selectedIdea={state.selectedIdea}
          whiteboard={state.whiteboard}
          isSaving={state.isSavingBoard}
          onPickIdea={actions.pickOwnIdea}
          onChange={actions.setWhiteboard}
          onSave={actions.saveWhiteboard}
          onNext={() => actions.setView("ai")}
        />
      ) : null}

      {state.view === "ai" ? (
        <AIView
          ideas={state.ownIdeas}
          selectedIdea={state.selectedIdea}
          whiteboard={state.whiteboard}
          evaluation={state.evaluation}
          isRunning={state.isRunningAI}
          points={state.balance}
          onPickIdea={actions.pickOwnIdea}
          onRun={actions.runAI}
          onBack={() => actions.setView("whiteboard")}
        />
      ) : null}

      {state.view === "profile" ? (
        <ProfileView
          session={state.session}
          ideas={state.ideas}
          ownIdeas={state.ownIdeas}
          summary={state.points}
          onOpenIdea={(id) => {
            void actions.selectIdea(id);
            actions.setView("feed");
          }}
        />
      ) : null}
    </AppShell>
  );
}
