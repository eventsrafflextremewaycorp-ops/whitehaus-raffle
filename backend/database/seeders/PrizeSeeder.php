<?php

namespace Database\Seeders;

use App\Models\Prize;
use Illuminate\Database\Seeder;

/**
 * Raffle prizes for Weeks 2 to 10 (promo mechanics document, Oct 2026): 11 winners in total.
 * Week 1 prizes are kept in the table (winners may point at them) but switched off, so they no longer
 * show on the Prizes page or in the draw's prize list.
 */
class PrizeSeeder extends Seeder
{
    public const CURRENT = [
        ['name' => 'MSI 274QF Monitor', 'value' => 14995.00, 'quantity' => 1],
        ['name' => 'Shokz E320-ST-BK Earbuds OpenDots 2', 'value' => 12990.00, 'quantity' => 1],
        ['name' => 'Airpods 4 ANC', 'value' => 9000.00, 'quantity' => 2],
        ['name' => 'Shokz OpenRun Air 2 Headset', 'value' => 8990.00, 'quantity' => 1],
        ['name' => 'Razer Kishi V3', 'value' => 5895.00, 'quantity' => 6],
    ];

    public const RETIRED = ['Nintendo Switch 2', 'Canon G1010 Printer', 'Shokz Open Run Pro 2'];

    public function run(): void
    {
        Prize::whereIn('name', self::RETIRED)->update(['is_active' => false]);

        foreach (self::CURRENT as $i => $prize) {
            Prize::updateOrCreate(['name' => $prize['name']], $prize + ['sort_order' => $i + 1, 'is_active' => true]);
        }
    }
}
