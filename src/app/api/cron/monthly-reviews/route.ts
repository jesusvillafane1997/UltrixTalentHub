import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Cron endpoint: Runs on the 1st of each month to generate reviews for all active assignments
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const currentDate = new Date();
    const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-10`;

    // Find all active assignments
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, person_id, client_id, account_manager_id, clients(account_manager_id)')
      .eq('status', 'Active');

    if (error || !assignments) {
      return NextResponse.json({
        success: true,
        message: `0 active assignments found for ${yearMonth}`,
        reviews: [],
      });
    }

    const generatedReviews = (assignments as any[]).map((assignment) => {
      const reviewerId = assignment.account_manager_id || assignment.clients?.account_manager_id;

      return {
        id: crypto.randomUUID(),
        person_id: assignment.person_id,
        assignment_id: assignment.id,
        period: yearMonth,
        reviewer_id: reviewerId,
        due_date: dueDate,
        status: 'Pending',
        created_at: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedReviews.length} monthly review cycles for period ${yearMonth}`,
      reviews: generatedReviews,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
