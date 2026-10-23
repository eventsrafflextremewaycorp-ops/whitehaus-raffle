Dear {{ $r->full_name }},

Thank you for placing your Apple iPhone 18 with WhiteHaus!

Ticket Number: {{ $r->ticket_code }}

Unit: {{ $r->unit }}
Participating branch: {{ $r->branch?->name }}
Purchase date: {{ $r->purchase_date?->format('F j, Y') }}
Reference number: {{ $r->reference_number }}
Promo period: {{ $periodStart }} to {{ $periodEnd }}
Raffle draw: {{ $drawAt }}

Your ticket enters the raffle once your purchase is fully paid and validated by our team.

{{ $permit }}
Authorized Apple Reseller

*** This is a system generated message. DO NOT REPLY TO THIS EMAIL. ***
