const supabasePkgName = '@supabase/supabase-js';
let createClientFn: any = null;

try {
  // @ts-ignore
  const supabaseModule = await import(/* @vite-ignore */ supabasePkgName).catch(() => null);
  if (supabaseModule?.createClient) {
    createClientFn = supabaseModule.createClient;
  }
} catch {
  // Module loading fallback
}

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  createClientFn &&
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClientFn(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase client not loaded') }),
        signOut: async () => {},
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: new Error('Storage unavailable') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    } as any);
