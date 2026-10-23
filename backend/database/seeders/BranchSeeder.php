<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

/**
 * WhiteHaus participating stores (promo mechanics document for Weeks 2 to 10, Oct 2026; the
 * https://xtremewaycorp.com/whitehaus/participating-branches.php page lists the same 13 stores).
 * No street addresses are published for most of them, so `address` is left null.
 * The regions are only used to group the list on the site.
 */
class BranchSeeder extends Seeder
{
    public const BRANCHES = [
        'Metro Manila' => [
            'SM City East Ortigas', 'SM City Sucat', 'SM City Southmall', 'Sta. Lucia Grand Mall',
            'Ayala Malls Feliz', 'SM City Novaliches',
        ],
        'North Luzon' => [
            'SM City Cauayan', 'SM City Pulilan', 'Ayala Malls Harbor Point', 'SM City Rosales',
        ],

    ];

    public function run(): void
    {
        $order = 0;

        foreach (self::BRANCHES as $region => $names) {
            foreach ($names as $name) {
                Branch::updateOrCreate(
                    ['name' => $name],
                    ['region' => $region, 'is_online' => false, 'sort_order' => ++$order, 'is_active' => true]
                );
            }
        }

        // The "register online" option on the registration form (no website address published yet).
        Branch::updateOrCreate(
            ['name' => 'WhiteHaus Website'],
            ['region' => 'Website', 'address' => null, 'is_online' => true, 'sort_order' => ++$order, 'is_active' => true]
        );
    }
}
