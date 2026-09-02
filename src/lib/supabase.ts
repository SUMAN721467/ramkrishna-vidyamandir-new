// Native Lightweight Supabase Client for Ramkrishna Vidyamandir
// Works in all environments with zero external dependency bundling issues

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    'https://idfwwujtynmirkvywqjt.supabase.co'
  ).replace(/\/$/, '');

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-project')
);

interface QueryFilter {
  column: string;
  value: any;
}

class QueryBuilder {
  private table: string;
  private selectCols = '*';
  private filters: QueryFilter[] = [];
  private orderCol?: string;
  private isSingle = false;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private bodyData?: any;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = '*') {
    this.selectCols = cols;
    if (this.action !== 'insert' && this.action !== 'update' && this.action !== 'delete') {
      this.action = 'select';
    }
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.bodyData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.bodyData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, _opts?: { ascending?: boolean }) {
    this.orderCol = column;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    };
    if (this.action === 'insert' || this.action === 'update') {
      headers['Prefer'] = 'return=representation';
    }
    return headers;
  }

  private buildUrl(): string {
    const url = new URL(`${supabaseUrl}/rest/v1/${this.table}`);
    if (this.action === 'select') {
      url.searchParams.set('select', this.selectCols);
    }
    this.filters.forEach((f) => {
      url.searchParams.set(f.column, `eq.${f.value}`);
    });
    if (this.orderCol) {
      url.searchParams.set('order', this.orderCol);
    }
    return url.toString();
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      if (!isSupabaseConfigured) {
        const res = { data: null, error: new Error('Supabase is not configured') };
        return onfulfilled ? onfulfilled(res) : (res as any);
      }

      let method = 'GET';
      if (this.action === 'insert') method = 'POST';
      else if (this.action === 'update') method = 'PATCH';
      else if (this.action === 'delete') method = 'DELETE';

      const fetchOpts: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (this.bodyData) {
        fetchOpts.body = JSON.stringify(this.bodyData);
      }

      const response = await fetch(this.buildUrl(), fetchOpts);
      if (!response.ok) {
        const errText = await response.text();
        const res = { data: null, error: new Error(errText || `HTTP ${response.status}`) };
        return onfulfilled ? onfulfilled(res) : (res as any);
      }

      const json = await response.json().catch(() => null);
      let data = json;
      if (this.isSingle && Array.isArray(json)) {
        data = json[0] || null;
      }

      const res = { data, error: null };
      return onfulfilled ? onfulfilled(res) : (res as any);
    } catch (err: any) {
      const res = { data: null, error: err };
      return onfulfilled ? onfulfilled(res) : (res as any);
    }
  }
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async getSession() {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('rkvm_demo_user') : null;
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          return { data: { session: { user } }, error: null };
        } catch {}
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
        const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          return { data: null, error: new Error(await res.text()) };
        }
        const data = await res.json();
        return { data: { user: data.user, session: data }, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    async signUp({ email, password, options }: any) {
      try {
        if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
        const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, data: options?.data }),
        });
        if (!res.ok) {
          return { data: null, error: new Error(await res.text()) };
        }
        const data = await res.json();
        return { data: { user: data.user }, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    async signOut() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rkvm_demo_user');
      }
      return { error: null };
    },
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(filePath: string, file: File | Blob) {
          try {
            if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
            const cleanPath = filePath.replace(/^\//, '');
            const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${cleanPath}`, {
              method: 'POST',
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': file.type || 'application/octet-stream',
              },
              body: file,
            });
            if (!res.ok) {
              return { data: null, error: new Error(await res.text()) };
            }
            return { data: { path: cleanPath }, error: null };
          } catch (err: any) {
            return { data: null, error: err };
          }
        },
        getPublicUrl(filePath: string) {
          const cleanPath = filePath.replace(/^\//, '');
          return {
            data: {
              publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`,
            },
          };
        },
      };
    },
  },
};

