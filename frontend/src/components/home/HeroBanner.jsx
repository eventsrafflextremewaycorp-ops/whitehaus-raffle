import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { ImageControls } from "@/components/ui/ImageControls";
import { useAuth } from "@/context/AuthContext";
import { ApiError, deleteBanner, uploadBanner } from "@/lib/api";
import { checkImageFile } from "@/lib/images";

/**
 * Home page banner.
 * Admins and superadmins upload or change the artwork right here (JPG, PNG or WebP, up to 5 MB;
 * 2400 x 800 px, 3:1, with the important content in the middle because phones crop the sides).
 * Everyone else just sees the image, or a plain placeholder until one has been uploaded.
 * The page title stays in the document as a visually hidden <h1> for screen readers and search engines.
 */
export function HeroBanner({ title, initialUrl = null }) {
  const { user } = useAuth();
  const canEdit = Boolean(user?.can?.manage_records);
  const [url, setUrl] = useState(initialUrl);
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const showImage = url && !broken;

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      setUrl(await action());
      setBroken(false);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function onPick(file) {
    const problem = checkImageFile(file);
    if (problem) return setError(problem);
    run(() => uploadBanner(file));
  }

  return (
    <div>
      <h1 className="sr-only">{title}</h1>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-ink-700 bg-ink-850 sm:aspect-[2/1] lg:aspect-[3/1]">
        {showImage ? (
          <img src={url} alt="" className="absolute inset-0 size-full object-cover" onError={() => setBroken(true)} />
        ) : (
          <div className="absolute inset-0 grid place-items-center border-2 border-dashed border-ink-600 p-6 text-center">
            {canEdit ? (
              <div className="max-w-md">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-ink-800 text-ink-400">
                  <ImageIcon className="size-6" aria-hidden />
                </span>
                <p className="mt-3 font-display text-lg font-semibold text-heading">Banner image goes here</p>
                <p className="mt-1 text-sm text-ink-400">Recommended 2400 × 800 px (3:1). JPG, PNG or WebP, up to 5 MB.</p>
              </div>
            ) : (
              <p aria-hidden className="max-w-2xl font-display text-2xl font-bold text-heading sm:text-4xl">
                {title}
              </p>
            )}
          </div>
        )}

        {canEdit && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 sm:inset-x-auto sm:right-3 sm:justify-end">
            <ImageControls hasImage={Boolean(showImage)} busy={busy} label="banner" onPick={onPick} onRemove={() => run(deleteBanner)} />
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-brand-300">
          {error}
        </p>
      )}
    </div>
  );
}
