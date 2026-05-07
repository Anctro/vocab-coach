'use client';

import { useCoach } from '@/hooks/useCoach';
import UploadPhase from '@/components/UploadPhase';
import ConfirmPhase from '@/components/ConfirmPhase';
import TrainingPhase from '@/components/TrainingPhase';

export default function Home() {
  const coach = useCoach();
  const { state } = coach;

  if (state.phase === 'upload') {
    return <UploadPhase onWordsLoaded={coach.loadWords} />;
  }

  if (state.phase === 'confirm') {
    return (
      <ConfirmPhase
        words={state.words}
        totalCount={state.words.length}
        onConfirm={coach.confirmStart}
        onBack={coach.reset}
      />
    );
  }

  return (
    <TrainingPhase
      words={state.words}
      progress={state.progress}
      messages={state.messages}
      currentQuestion={state.currentQuestion}
      masteredCount={state.masteredCount}
      onAnswer={coach.submitAnswer}
      onSpeak={coach.coachSpeak}
      onReset={coach.reset}
    />
  );
}
