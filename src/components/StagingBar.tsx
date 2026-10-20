/** Shown on every page of a staging deployment (SITE_ENV is not "production"): reviewers must never mistake the preview for the live site. */
export function StagingBar({ text }: { text: string }) {
  return (
    <div className="staging-bar" role="note">
      {text}
    </div>
  );
}
