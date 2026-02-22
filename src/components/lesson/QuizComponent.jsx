import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function QuizComponent({ quiz }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const q = quiz[currentQ];
  const answered = currentQ in answers;
  const isCorrect = answers[currentQ] === q.correct_answer;
  const canProceed = answered && (currentQ === quiz.length - 1 || showResults);

  const handleSelect = (idx) => {
    if (!answered) {
      setAnswers({ ...answers, [currentQ]: idx });
    }
  };

  const handleShowResults = () => {
    setShowResults(true);
  };

  const handleNext = () => {
    if (currentQ < quiz.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const correct = Object.keys(answers).filter(i => answers[i] === quiz[i].correct_answer).length;

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-bold text-white">Knowledge Check</h3>
          <Badge variant="outline" className="border-purple-500/50 text-purple-300">
            {currentQ + 1} of {quiz.length}
          </Badge>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-purple-600 h-full transition-all duration-300"
            style={{ width: `${((currentQ + 1) / quiz.length) * 100}%` }}
          />
        </div>
      </div>

      {!showResults ? (
        <>
          <h4 className="text-lg font-semibold text-white mb-6">{q.question}</h4>
          <div className="space-y-3 mb-8">
            {q.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                  idx === answers[currentQ]
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-red-500 bg-red-500/20 text-red-300'
                    : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600 cursor-pointer disabled:cursor-default'
                } ${answered ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {idx === answers[currentQ] && (
                    isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                  )}
                  {option}
                </div>
              </button>
            ))}
          </div>

          {answered && (
            <div className={`p-4 rounded-lg mb-6 ${isCorrect ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
              <div className="flex gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <p className={isCorrect ? 'text-emerald-300 font-semibold' : 'text-red-300 font-semibold'}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
              </div>
              {q.explanation && (
                <p className="text-slate-300 text-sm">{q.explanation}</p>
              )}
            </div>
          )}

          {answered && (
            <div className="flex gap-3">
              {currentQ < quiz.length - 1 && (
                <Button onClick={handleNext} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Next Question
                </Button>
              )}
              {currentQ === quiz.length - 1 && (
                <Button onClick={handleShowResults} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  See Results
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-center py-8">
            <p className="text-5xl font-black text-purple-400 mb-2">{correct}/{quiz.length}</p>
            <p className="text-slate-400 text-lg mb-6">
              {correct === quiz.length
                ? 'Perfect score! 🎉'
                : correct >= Math.ceil(quiz.length * 0.8)
                ? 'Great job!'
                : 'Good effort! Review the lesson and try again.'}
            </p>
            <Button
              onClick={() => {
                setCurrentQ(0);
                setAnswers({});
                setShowResults(false);
              }}
              className="bg-slate-700 hover:bg-slate-600"
            >
              Retake Quiz
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}