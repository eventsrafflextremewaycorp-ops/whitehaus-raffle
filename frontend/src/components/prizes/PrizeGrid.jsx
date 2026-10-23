import { Gamepad2, Headphones, Monitor, Printer, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageControls } from "@/components/ui/ImageControls";
import { useAuth } from "@/context/AuthContext";
import { ApiError, deletePrizeImage, uploadPrizeImage } from "@/lib/api";
import { checkImageFile } from "@/lib/images";
import { EmptyState } from "@/components/ui/States";
import { formatPeso } from "@/lib/format";
/** Icon tile used until a photo is uploaded. Admins and superadmins upload photos right here (JPG, PNG or WebP, up to 5 MB). */
function prizeIcon(name) {
    const n = name.toLowerCase();
    if (n.includes("switch") || n.includes("console"))
        return <Gamepad2 className="size-10" aria-hidden/>;
    if (n.includes("monitor"))
        return <Monitor className="size-10" aria-hidden/>;
    if (n.includes("printer"))
        return <Printer className="size-10" aria-hidden/>;
    if (n.includes("shokz") || n.includes("headphone") || n.includes("earbud") || n.includes("airpods"))
        return <Headphones className="size-10" aria-hidden/>;
    return <Trophy className="size-10" aria-hidden/>;
}
export function PrizeGrid({ prizes }) {
    const { user } = useAuth();
    const canEdit = Boolean(user?.can?.manage_records);
    const [items, setItems] = useState(prizes);
    const [busyId, setBusyId] = useState(null);
    const [errors, setErrors] = useState({});
    useEffect(() => setItems(prizes), [prizes]);
    async function run(id, action) {
        setBusyId(id);
        setErrors((e) => ({ ...e, [id]: null }));
        try {
            const updated = await action();
            setItems((list) => list.map((p) => (p.id === id ? { ...p, image_url: updated.image_url } : p)));
        }
        catch (e) {
            setErrors((all) => ({ ...all, [id]: e instanceof ApiError || e instanceof Error ? e.message : "Something went wrong. Please try again." }));
        }
        finally {
            setBusyId(null);
        }
    }
    function onPick(id, file) {
        const problem = checkImageFile(file);
        if (problem)
            return setErrors((e) => ({ ...e, [id]: problem }));
        run(id, () => uploadPrizeImage(id, file));
    }
    if (items.length === 0) {
        return <EmptyState title="Prizes will be announced soon" message="Check back for the raffle prize list."/>;
    }
    return (<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((prize) => (<li key={prize.id} className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink-700 bg-ink-900">
          <div className="relative grid aspect-[4/3] place-items-center bg-ink-850 text-ink-300">
            {prize.image_url ? (
            <img src={prize.image_url} alt={prize.name} className="size-full object-contain p-6"/>) : (prizeIcon(prize.name))}
            <span className="absolute left-3 top-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-xs font-semibold text-heading">
              {prize.quantity} {prize.quantity === 1 ? "winner" : "winners"}
            </span>
            {canEdit && (<div className="absolute inset-x-0 bottom-0 flex justify-center p-2.5">
                <ImageControls compact hasImage={Boolean(prize.image_url)} busy={busyId === prize.id} label="image" onPick={(file) => onPick(prize.id, file)} onRemove={() => run(prize.id, () => deletePrizeImage(prize.id))}/>
              </div>)}
          </div>
          <div className="flex flex-1 flex-col gap-1 p-5">
            <h3 className="text-lg font-semibold text-heading">{prize.name}</h3>
            <p className="text-sm text-ink-400">
              worth <span className="font-semibold text-brand-300">{formatPeso(prize.value)}</span>
            </p>
            {errors[prize.id] && (<p role="alert" className="text-sm font-medium text-brand-300">{errors[prize.id]}</p>)}
          </div>
        </li>))}
    </ul>);
}
