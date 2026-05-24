import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    // 1. Authenticate and verify role is admin
    const { user: currentAdmin } = await requireAdmin();

    // 2. Prevent self-demotion
    if (targetUserId === currentAdmin.id) {
      return NextResponse.json(
        { error: 'Self-demotion is blocked. You cannot modify your own administrative role.' },
        { status: 400 }
      );
    }

    const { role } = await request.json();

    if (!role || !['admin', 'reviewer', 'analyst'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specifier.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 3. Update role
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', targetUserId)
      .select('*')
      .single();

    if (error) throw error;

    // 4. Log this action to audit logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: currentAdmin.id,
      action: 'USER_ROLE_UPDATED',
      metadata: {
        target_user_id: targetUserId,
        target_name: updatedProfile.full_name,
        new_role: role,
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: unknown) {
    console.error('Role update error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
