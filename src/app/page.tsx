'use client';

import { useCoach } from '@/hooks/useCoach';
import UploadPhase from '@/components/UploadPhase';
import ConfirmPhase from '@/components/ConfirmPhase';
import TrainingPhase from '@/components/TrainingPhase';
import { Word } from '@/types';

export default function Home() {
  const coach = useCoach();
  const { state, isListening, isSpeaking } = coach;

  return (
    <main className="h-screen flex flex-col">
      {state.phase === 'upload' && (
        <UploadPhase onWordsLoaded={(words, totalCount) => coach.loadWords(words, totalCount)} />
      )}

      {state.phase === 'confirm' && (
        <ConfirmPhase
          words={state.words}
          totalCount={state.words.length}
          onConfirm={coach.confirmStart}
        />
      )}

      {(state.phase === 'training' || state.phase === 'exam' || state.phase === 'done') && (
        <TrainingPhase
          messages={state.messages}
          currentQuestion={state.currentQuestion}
          words={state.words}
          progress={state.progress}
          masteredCount={state.masteredCount}
          totalWords={state.words.length}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onSubmitAnswer={coach.submitAnswer}
          onStartListening={coach.startVoiceInput}
          onStopListening={coach.stopVoiceInput}
          onCoachSpeak={coach.coachSpeak}
          onStartExam={coach.startFinalExam}
          phase={state.phase}
        />
      )}
    </main>
  );
}
