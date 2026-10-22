import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Cron endpoint: Runs daily to detect contracts expiring in 30 days and 7 days
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const referenceDate = Date.now();

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, person_id, type, end_date, status, people(full_name)')
      .eq('status', 'Signed');

    if (error || !contracts) {
      return NextResponse.json({ success: true, alerts_count: 0, alerts: [] });
    }

    const alerts = [];

    for (const contract of contracts as any[]) {
      if (contract.end_date) {
        const endMs = new Date(contract.end_date).getTime();
        const daysUntilExpiry = Math.ceil((endMs - referenceDate) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          alerts.push({
            contract_id: contract.id,
            person_id: contract.person_id,
            person_name: contract.people?.full_name || 'Talent',
            contract_type: contract.type,
            end_date: contract.end_date,
            days_until_expiry: daysUntilExpiry,
            urgency: daysUntilExpiry <= 7 ? 'CRITICAL_7_DAYS' : 'WARNING_30_DAYS',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      alerts_count: alerts.length,
      alerts,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
