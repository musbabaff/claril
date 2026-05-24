import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

// Defensive in-memory fallback cache in case platform_settings table has not been migrated yet
const inMemorySettings: Record<string, unknown> = {
  default_ai_provider: 'gemini',
  max_file_size_mb: 25,
  registration_open: true,
};

export async function GET() {
  try {
    // 1. Authenticate and verify role is admin
    await requireAdmin();

    const supabaseAdmin = createAdminClient();

    // 2. Fetch platform settings from Supabase, fallback to memory cache if table is missing
    const settings = { ...inMemorySettings };
    try {
      const { data: dbSettings, error: dbErr } = await supabaseAdmin
        .from('platform_settings')
        .select('*');

      if (!dbErr && dbSettings) {
        dbSettings.forEach(s => {
          settings[s.key] = s.value;
        });
      }
    } catch {
      // Table doesn't exist yet, proceed with fallback settings
    }

    // 3. Inspect which providers are configured in .env (without exposing raw values)
    const providerStatus = {
      gemini: !!process.env.GEMINI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY || !!process.env.OPENAI_API_KEY_MOCK,
    };

    return NextResponse.json({
      success: true,
      settings,
      providerStatus,
    });
  } catch (err: unknown) {
    console.error('Settings GET endpoint error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    // 1. Authenticate and verify role is admin
    const { user: currentAdmin } = await requireAdmin();

    const body = await request.json();
    const { settings: newSettings, action: dangerAction } = body;

    const supabaseAdmin = createAdminClient();

    // 2. Handle Danger Zone destructive operations defensively
    if (dangerAction === 'CLEAR_FAILED_CASES') {
      const { count, error } = await supabaseAdmin
        .from('cases')
        .delete({ count: 'exact' })
        .eq('status', 'failed');

      if (error) throw error;

      await supabaseAdmin.from('audit_logs').insert({
        user_id: currentAdmin.id,
        action: 'DANGER_ZONE_CLEAR_FAILED_CASES',
        metadata: {
          deleted_count: count || 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully cleared ${count || 0} failed cases from the platform.`,
      });
    }

    if (dangerAction === 'RESET_AUDIT_LOGS') {
      // Supabase RLS deletes can run, but let's defensively empty it
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

      if (error) throw error;

      await supabaseAdmin.from('audit_logs').insert({
        user_id: currentAdmin.id,
        action: 'DANGER_ZONE_AUDIT_LOGS_RESET',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Platform audit logs successfully reset.',
      });
    }

    // 3. Normal settings update
    if (newSettings && typeof newSettings === 'object') {
      const updatedKeys: string[] = [];

      for (const [key, val] of Object.entries(newSettings)) {
        inMemorySettings[key] = val; // Always update fallback cache
        updatedKeys.push(key);

        try {
          // Upsert to DB setting row
          await supabaseAdmin
            .from('platform_settings')
            .upsert({
              key,
              value: val,
              updated_at: new Date().toISOString(),
              updated_by: currentAdmin.id,
            });
        } catch {
          // Ignore if table missing; cache handles it
        }
      }

      await supabaseAdmin.from('audit_logs').insert({
        user_id: currentAdmin.id,
        action: 'PLATFORM_SETTINGS_UPDATED',
        metadata: {
          updated_keys: updatedKeys,
        },
      });

      return NextResponse.json({
        success: true,
        settings: { ...inMemorySettings },
      });
    }

    return NextResponse.json({ error: 'No operation provided.' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Settings PATCH endpoint error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
