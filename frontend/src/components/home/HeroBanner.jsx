import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { ImageControls } from "@/components/ui/ImageControls";
import { useAuth } from "@/context/AuthContext";
import { ApiError, deleteBanner, deleteMobileBanner, uploadBanner, uploadMobileBanner } from "@/lib/api";
import { checkImageFile } from "@/lib/images";

/**
 * Home page banner.
 * Admins and superadmins upload the artwork right here (JPG, PNG or WebP, up to 5 MB each):
 *  - the main banner, 2400 x 800 px (3:1), for tablets and computers;
 *  - an optional mobile banner (for example 1080 x 1350 px, 4:5) shown on phones. Without it, phones show the
 *    main banner in full, never cropped.
 * Everyone else just sees the image, or a plain placeholder until one has been uploaded.
 * The page title stays in the document as a visually hidden <h1> for screen readers and search engines.
 */
export function HeroBanner({ title, initialUrl = null, initialMobileUrl = null }) {
  const { user } = useAuth();
  const canEdit = Boolean(user?.can?.manage_records);
  const [url, setUrl] = useState(initialUrl);
  const [mobileUrl, setMobileUrl] = useState(initialMobileUrl);
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(null); // "main" | "mobile" | null
  const [error, setError] = useState(null);
  const showImage = (url || mobileUrl) && !broken;

  async function run(which, action, set) {
    setBusy(which);
    setError(null);
    try {
      set(await action());
      setBroken(false);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function pick(which, upload, set) {
    return (file) => {
      const problem = checkImageFile(file);
      if (problem) return setError(problem);
      run(which, () => upload(file), set);
    };
  }

  return (
    <div>
      <h1 className="sr-only">{title}</h1>
      <div
        className={`relative overflow-hidden rounded-[var(--radius-card)] border border-ink-700 bg-ink-850 ${
          showImage ? "" : "aspect-[4/3] sm:aspect-[2/1] lg:aspect-[3/1]"
        }`}
      >
        {showImage ? (
          // Phones: the mobile image if there is one, else the whole main image. Wider screens: the main banner at 3:1.
          <picture>
            {mobileUrl && <source media="(max-width: 639px)" srcSet={mobileUrl} />}
            <img
              src={url || mobileUrl}
              alt=""
              className="block h-auto w-full object-cover sm:aspect-[2/1] lg:aspect-[3/1]"
              onError={() => setBroken(true)}
            />
          </picture>
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
      </div>

      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 rounded-[var(--radius-card)] border border-ink-700 bg-ink-850 p-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-300">Banner for computers and tablets (2400 × 800 px)</p>
            <ImageControls hasImage={Boolean(url)} busy={busy === "main"} label="banner" onPick={pick("main", uploadBanner, setUrl)} onRemove={() => run("main", deleteBanner, setUrl)} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-300">Banner for phones (optional, for example 1080 × 1350 px)</p>
            <ImageControls hasImage={Boolean(mobileUrl)} busy={busy === "mobile"} label="mobile banner" onPick={pick("mobile", uploadMobileBanner, setMobileUrl)} onRemove={() => run("mobile", deleteMobileBanner, setMobileUrl)} />
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-brand-300">
          {error}
        </p>
      )}
    </div>
  );
}
