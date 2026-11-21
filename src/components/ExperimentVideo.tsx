import React, { useState } from 'react';
import { PlayCircle, ShieldCheck, VideoOff } from 'lucide-react';
import { EXPERIMENT_VIDEOS } from '../data/experimentVideos';
import { validateVideo } from '../lib/videoCheck';

/** Video only downloads after the student taps. Only videos that pass the verification checks are ever shown. */
export const ExperimentVideo: React.FC<{ experimentId: string }> = ({ experimentId }) => {
  const [loaded, setLoaded] = useState(false);
  const video = EXPERIMENT_VIDEOS[experimentId];
  const problem = video ? validateVideo(experimentId, video) : null;

  if (!video || problem) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-[#B6A6E0] dark:border-[#3B2C78] px-3 py-2.5 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
        <VideoOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>No verified video for this experiment yet. Use the written steps{' '}
          {problem && import.meta.env.DEV ? `(a registered video was hidden: ${problem})` : 'and any simulation shown here.'}
        </span>
      </div>
    );
  }

  const stateTag = video.verifiedFor.stateName ? ` ${video.verifiedFor.stateName}` : '';
  return (
    <div className="space-y-2">
      {!loaded ? (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-3 min-h-[48px] text-sm font-semibold text-white cursor-pointer"
        >
          <PlayCircle className="w-5 h-5" aria-hidden="true" />
          Watch video: {video.title} (uses data)
        </button>
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
            title={video.title}
            loading="lazy"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <p className="flex items-start gap-1.5 text-xs text-[#14532D] dark:text-[#86EFAC]">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Checked by {video.verifiedBy} on {video.verifiedOn} for Class {video.verifiedFor.classLevel} {video.verifiedFor.board.toUpperCase()}
          {stateTag} against: {video.checkedAgainst}. Channel: {video.channel}.
        </span>
      </p>
    </div>
  );
};
