<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
    <tr><td>
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#dc2626;font-weight:bold;">WhiteHaus</p>
      <h1 style="margin:0 0 16px;font-size:20px;">Thank you for placing your Apple iPhone 18 with WhiteHaus!</h1>
      <p style="margin:0 0 16px;">Dear {{ $r->full_name }},</p>
      <p style="margin:0 0 8px;">Your registration was received. Keep your ticket number safe:</p>
      <p style="margin:0 0 20px;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:20px;font-weight:bold;letter-spacing:.04em;text-align:center;">{{ $r->ticket_code }}</p>

      <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
        <tr><td style="color:#52525b;width:40%;">Unit</td><td>{{ $r->unit }}</td></tr>
        <tr><td style="color:#52525b;">Participating branch</td><td>{{ $r->branch?->name }}</td></tr>
        <tr><td style="color:#52525b;">Purchase date</td><td>{{ $r->purchase_date?->format('F j, Y') }}</td></tr>
        <tr><td style="color:#52525b;">Reference number</td><td>{{ $r->reference_number }}</td></tr>
        <tr><td style="color:#52525b;">Promo period</td><td>{{ $periodStart }} to {{ $periodEnd }}</td></tr>
        <tr><td style="color:#52525b;">Raffle draw</td><td>{{ $drawAt }}</td></tr>
      </table>

      <p style="margin:20px 0 0;font-size:14px;">Your ticket enters the raffle once your purchase is fully paid and validated by our team.</p>
      <p style="margin:20px 0 0;font-size:12px;color:#71717a;">{{ $permit }}<br>Authorized Apple Reseller</p>
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">*** This is a system generated message. DO NOT REPLY TO THIS EMAIL. ***</p>
    </td></tr>
  </table>
</body>
</html>
