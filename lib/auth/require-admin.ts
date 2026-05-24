import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error('Unauthorized');
  }

  // Fetch role from profile using the admin client to bypass recursive RLS policies on the server side
  const supabaseAdmin = createAdminClient();
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profErr || !profile || profile.role !== 'admin') {
    throw new Error('Forbidden');
  }

  return { user, profile };
}
