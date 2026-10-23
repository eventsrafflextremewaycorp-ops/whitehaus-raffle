<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prize;
use App\Support\SiteImages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Home banner and prize photos, managed by admins and superadmins (gate: manage-records).
 */
class SiteImageController extends Controller
{
    private const RULES = ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

    public function setBanner(Request $request): JsonResponse
    {
        return $this->replace($request, 'banner', 'The banner must be 5 MB or smaller.');
    }

    public function clearBanner(): JsonResponse
    {
        SiteImages::forgetBanners('banner');

        return $this->bannerResponse();
    }

    /** Optional phone-sized banner (shown on small screens instead of the wide one). */
    public function setMobileBanner(Request $request): JsonResponse
    {
        return $this->replace($request, 'bannermobile', 'The mobile banner must be 5 MB or smaller.');
    }

    public function clearMobileBanner(): JsonResponse
    {
        SiteImages::forgetBanners('bannermobile');

        return $this->bannerResponse();
    }

    private function replace(Request $request, string $prefix, string $tooBig): JsonResponse
    {
        $request->validate(['image' => self::RULES], [
            'image.mimes' => 'Upload a JPG, PNG or WebP image.',
            'image.image' => 'Upload a JPG, PNG or WebP image.',
            'image.max' => $tooBig,
        ]);

        $path = SiteImages::store($request->file('image'), '', $prefix);
        // Keep only the newest file of this kind.
        foreach (glob(SiteImages::dir().'/'.$prefix.'-*.*') ?: [] as $old) {
            if ('uploads/'.basename($old) !== $path) {
                SiteImages::forget('uploads/'.basename($old));
            }
        }

        return $this->bannerResponse();
    }

    private function bannerResponse(): JsonResponse
    {
        return response()->json(['data' => ['banner_url' => SiteImages::bannerUrl(), 'banner_mobile_url' => SiteImages::mobileBannerUrl()]]);
    }

    public function setPrizeImage(Request $request, Prize $prize): JsonResponse
    {
        $request->validate(['image' => self::RULES], [
            'image.mimes' => 'Upload a JPG, PNG or WebP image.',
            'image.image' => 'Upload a JPG, PNG or WebP image.',
            'image.max' => 'The image must be 5 MB or smaller.',
        ]);

        $old = $prize->image_path;
        $prize->update(['image_path' => SiteImages::store($request->file('image'), 'prizes', 'prize-'.$prize->id)]);
        SiteImages::forget($old);

        return response()->json(['data' => $this->present($prize)]);
    }

    public function clearPrizeImage(Prize $prize): JsonResponse
    {
        SiteImages::forget($prize->image_path);
        $prize->update(['image_path' => null]);

        return response()->json(['data' => $this->present($prize)]);
    }

    /** @return array<string, mixed> */
    private function present(Prize $prize): array
    {
        return [
            'id' => $prize->id,
            'name' => $prize->name,
            'value' => (float) $prize->value,
            'quantity' => $prize->quantity,
            'image_url' => $prize->image_path ? asset($prize->image_path) : null,
        ];
    }
}
