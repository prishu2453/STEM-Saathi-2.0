import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Play,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import { ExperimentVideo } from './ExperimentVideo';
import { InlineSimulation } from './InlineSimulation';
import type { StructuredExperiment } from '../../shared/syllabus/types';
import { resolveLocalizedList, resolveLocalizedText } from '../data/curriculumCatalogue';
import type { ExperimentId } from '../data/physicsExperiments';
import { useSpeech } from '../hooks/useSpeech';
import type { Language, SupportingWorldId } from '../types/stem';

interface StructuredExperimentCardProps {
  experiment: StructuredExperiment;
  language: Language;
  isCompleted: boolean;
  onToggleCompleted: (expId: string) => void;
  onLaunchPhysicsSim?: (topic: ExperimentId) => void;
  onLaunchSupportingWorld?: (world: SupportingWorldId) => void;
  onOpenChapter?: (chapterId: string) => void;
  defaultExpanded?: boolean;
}

export const StructuredExperimentCard: React.FC<StructuredExperimentCardProps> = ({
  experiment,
  language,
  isCompleted,
  onToggleCompleted,
  onLaunchPhysicsSim,
  onLaunchSupportingWorld,
  onOpenChapter,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);

  const title = resolveLocalizedText(experiment.title, language).text;
  const objective = resolveLocalizedText(experiment.objective, language).text;
  const principle = resolveLocalizedText(experiment.scientificPrinciple, language).text;
  const materials = resolveLocalizedList(experiment.materials, language).items;
  const steps = resolveLocalizedList(experiment.steps, language).items;
  const tableCols = resolveLocalizedList(experiment.observationTable.columns, language).items;
  const expectedResult = resolveLocalizedText(experiment.expectedResult, language).text;
  const conclusion = resolveLocalizedText(experiment.conclusion, language).text;
  const safety = resolveLocalizedText(experiment.safetyNote, language).text;
  const predQuestion = resolveLocalizedText(experiment.predictionQuestion, language).text;
  const predOptions = resolveLocalizedList(experiment.predictionOptions, language).items;
  const hints = resolveLocalizedList(experiment.hints, language).items;
  const whyItHappens = resolveLocalizedText(experiment.whyItHappens, language).text;

  const relationLabel =
    experiment.relationType === 'official-practical'
      ? 'Official Prescribed Practical'
      : experiment.relationType === 'in-chapter'
        ? 'In-Chapter Experiment'
        : 'Additional Learning Activity';

  const modeLabel =
    experiment.activityMode === 'home-safe'
      ? 'Home Safe'
      : experiment.activityMode === 'virtual-sim'
        ? 'Virtual Sim'
        : 'School Lab';

  const readAloudSummary = `${title}. Objective: ${objective}. Principle: ${principle}. Steps: ${steps.join('. ')}. Safety precaution: ${safety}`;

  return (
    <article
      className={`a11y-surface rounded-2xl border bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4 ${
        isCompleted
          ? 'border-[#6D28D9]'
          : 'border-[#E7DDFB] dark:border-[#3B2C78]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
            {relationLabel} · {modeLabel} · Class {experiment.classLevel}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#2E1A6E] dark:text-white leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{objective}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggleCompleted(experiment.id)}
            aria-pressed={isCompleted}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 min-h-[42px] text-xs font-semibold border cursor-pointer ${
              isCompleted
                ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/25 text-[#5B21B6] dark:text-[#C4B5FD]'
                : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 rounded-xl bg-[#2E1A6E] hover:bg-[#112539] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-white cursor-pointer"
          >
            <span>{expanded ? 'Hide Sheet' : 'Open 9-Part Guide'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pt-4 border-t border-[#E7DDFB] dark:border-[#3B2C78] space-y-5">
          {/* Action Toolbar */}
          <ExperimentVideo experimentId={experiment.id} />
          {experiment.linkedSimExperiment && (
            <InlineSimulation experimentId={experiment.linkedSimExperiment} language={language} />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (isSpeaking ? stopSpeaking() : speak(readAloudSummary))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 min-h-[40px] text-xs font-semibold text-[#2E1A6E] dark:text-white cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#6D28D9]" />
              <span>{isSpeaking ? 'Stop Audio' : 'Listen Guide'}</span>
            </button>

            {experiment.linkedSupportingWorld && onLaunchSupportingWorld && (
              <button
                type="button"
                onClick={() => onLaunchSupportingWorld(experiment.linkedSupportingWorld!)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-3.5 py-2 min-h-[40px] text-xs font-semibold text-white cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Open {experiment.linkedSupportingWorld} Lab</span>
              </button>
            )}

            {onOpenChapter && (
              <button
                type="button"
                onClick={() => onOpenChapter(experiment.chapterId)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:border-[#6D28D9] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Chapter {experiment.chapterNumber}</span>
              </button>
            )}
          </div>

          {/* 1-4: Title, Objective, Materials, Principle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3.5 space-y-1.5">
              <p className="font-bold text-[#2E1A6E] dark:text-white">1. Title &amp; 2. Objective</p>
              <p className="text-[#22163F] dark:text-[#E4DDFA]">
                <strong>{title}:</strong> {objective}
              </p>
              <p className="font-bold text-[#2E1A6E] dark:text-white pt-2">
                4. Scientific Principle
              </p>
              <p className="text-[#22163F] dark:text-[#E4DDFA]">{principle}</p>
            </div>

            <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3.5 space-y-1.5">
              <p className="font-bold text-[#2E1A6E] dark:text-white">3. Required Materials</p>
              <ul className="list-disc pl-5 space-y-1 text-[#22163F] dark:text-[#E4DDFA]">
                {materials.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. Step-by-Step Procedure */}
          <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] p-3.5 space-y-2 text-xs sm:text-sm">
            <p className="font-bold text-[#2E1A6E] dark:text-white">5. Step-by-Step Procedure</p>
            <ol className="list-decimal pl-5 space-y-1.5 text-[#22163F] dark:text-[#E4DDFA]">
              {steps.map((st, idx) => (
                <li key={idx}>{st}</li>
              ))}
            </ol>
          </div>

          {/* 6. Observation Table */}
          <div className="space-y-2 text-xs sm:text-sm">
            <p className="font-bold text-[#2E1A6E] dark:text-white">6. Observation Table</p>
            <div className="overflow-x-auto rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-white">
                  <tr>
                    {tableCols.map((c, i) => (
                      <th key={i} className="px-3 py-2 font-bold border-b border-[#E7DDFB] dark:border-[#3B2C78]">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {experiment.observationTable.sampleRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-b-0 border-[#E7DDFB] dark:border-[#3B2C78]">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-[#22163F] dark:text-[#E4DDFA]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7 & 8: Expected Result + Conclusion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="rounded-xl bg-[#EFE7FF]/60 dark:bg-[#6D28D9]/15 border border-[#6D28D9]/40 p-3.5 space-y-1">
              <p className="font-bold text-[#5B21B6] dark:text-[#C4B5FD]">7. Expected Result</p>
              <p className="text-[#22163F] dark:text-[#E4DDFA]">{expectedResult}</p>
            </div>
            <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] border border-[#E7DDFB] dark:border-[#3B2C78] p-3.5 space-y-1">
              <p className="font-bold text-[#2E1A6E] dark:text-white">8. Conclusion</p>
              <p className="text-[#22163F] dark:text-[#E4DDFA]">{conclusion}</p>
            </div>
          </div>

          {/* 9. Safety Precautions */}
          <div className="rounded-xl border border-[#FF9F1C] bg-[#FFFBEB] dark:bg-[#2F2411] p-3.5 flex items-start gap-2.5 text-xs sm:text-sm">
            <ShieldAlert className="w-4 h-4 text-[#B4430C] dark:text-[#FF9F1C] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#B4430C] dark:text-[#FF9F1C]">9. Safety Precautions</p>
              <p className="text-[#22163F] dark:text-[#FCEAC2]">{safety}</p>
            </div>
          </div>

          {/* Interactive Prediction Check & Hints */}
          <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3.5 space-y-3 text-xs sm:text-sm">
            <p className="font-bold text-[#2E1A6E] dark:text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#6D28D9]" />
              <span>What Should Happen? {predQuestion}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {predOptions.map((opt, idx) => {
                const picked = selectedPrediction === idx;
                const correct = idx === experiment.predictionCorrectIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPrediction(idx)}
                    className={`text-left rounded-xl border px-3 py-2.5 min-h-[42px] text-xs font-semibold cursor-pointer ${
                      picked
                        ? correct
                          ? 'border-[#6D28D9] bg-[#EFE7FF] text-[#5B21B6]'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hintsShown < hints.length && (
                <button
                  type="button"
                  onClick={() => setHintsShown((c) => Math.min(hints.length, c + 1))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#B4430C] dark:text-[#FF9F1C] hover:underline cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Show Hint ({hintsShown}/{hints.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:underline cursor-pointer"
              >
                {showWhy ? 'Hide Explanation' : 'Why did this happen?'}
              </button>
            </div>

            {hintsShown > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#22163F] dark:text-[#E4DDFA]">
                {hints.slice(0, hintsShown).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}

            {showWhy && (
              <p className="text-xs text-[#22163F] dark:text-[#E4DDFA] rounded-lg bg-white dark:bg-[#1F1545] p-2.5 border border-[#E7DDFB] dark:border-[#3B2C78]">
                <strong>Scientific Explanation:</strong> {whyItHappens}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
