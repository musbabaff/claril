import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    // 1. Authenticate and verify role is admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const actionFilter = searchParams.get('action');
    const userFilter = searchParams.get('user_id');

    const supabaseAdmin = createAdminClient();

    // 2. Fetch audit logs (up to 100 entries for view, all for export)
    let query = supabaseAdmin
      .from('audit_logs')
      .select('id, case_id, user_id, action, metadata, created_at')
      .order('created_at', { ascending: false });

    if (actionFilter) {
      query = query.eq('action', actionFilter);
    }
    if (userFilter) {
      query = query.eq('user_id', userFilter);
    }

    if (format !== 'csv') {
      query = query.limit(100);
    }

    const { data: logsData, error } = await query;
    if (error) throw error;

    // 3. Fetch profiles to map user metadata
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, role');
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const logs = (logsData || []).map(log => {
      const p = profileMap.get(log.user_id);
      return {
        id: log.id,
        created_at: log.created_at,
        action: log.action,
        metadata: log.metadata || {},
        case_id: log.case_id,
        userName: p ? p.full_name : 'System Operation',
        userRole: p ? p.role : 'operator',
      };
    });

    // 4. Handle CSV export directly in API
    if (format === 'csv') {
      const csvHeader = 'Log ID,Timestamp,Operator,Operator Role,Action,Metadata\n';
      const csvRows = logs.map(l => {
        const id = `"${l.id}"`;
        const time = `"${l.created_at}"`;
        const name = `"${l.userName.replace(/"/g, '""')}"`;
        const role = `"${l.userRole}"`;
        const action = `"${l.action}"`;
        const meta = `"${JSON.stringify(l.metadata).replace(/"/g, '""')}"`;
        return [id, time, name, role, action, meta].join(',');
      });

      return new Response(csvHeader + csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="claril_audit_logs.csv"',
        },
      });
    }

    // List of unique actions for filters dropdown
    const { data: allActions } = await supabaseAdmin.from('audit_logs').select('action');
    const uniqueActions = Array.from(new Set((allActions || []).map(a => a.action)));

    return NextResponse.json({
      success: true,
      logs,
      uniqueActions,
      profiles: (profiles || []).map(p => ({ id: p.id, name: p.full_name })),
    });
  } catch (err: unknown) {
    console.error('Audit route error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
