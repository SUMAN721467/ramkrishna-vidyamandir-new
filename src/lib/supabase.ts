// Native Lightweight Supabase Client for Ramkrishna Vidyamandir
// Works in all environments with zero external dependency bundling issues

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL || ''
).trim().replace(/\/$/, '');

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-supabase-project') &&
    !supabaseAnonKey.includes('your-anon-key') &&
    !supabaseAnonKey.includes('your-supabase')
);

type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

interface QueryFilter {
  column: string;
  op: FilterOp;
  value: any;
}

interface OrderSpec {
  column: string;
  ascending: boolean;
}

class QueryBuilder {
  private table: string;
  private selectCols = '*';
  private filters: QueryFilter[] = [];
  private orderSpecs: OrderSpec[] = [];
  private limitCount?: number;
  private onConflictCol?: string;
  private isSingle = false;
  private action: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private bodyData?: any;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = '*') {
    this.selectCols = cols;
    if (this.action !== 'insert' && this.action !== 'upsert' && this.action !== 'update' && this.action !== 'delete') {
      this.action = 'select';
    }
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.bodyData = data;
    return this;
  }

  upsert(data: any | any[], opts?: { onConflict?: string }) {
    this.action = 'upsert';
    this.bodyData = data;
    this.onConflictCol = opts?.onConflict || 'id';
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
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, op: 'gte', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, op: 'lte', value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, op: 'gt', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, op: 'lt', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderSpecs.push({
      column,
      ascending: opts?.ascending !== false,
    });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
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
    if (this.action === 'insert' || this.action === 'update' || this.action === 'upsert') {
      headers['Prefer'] = this.action === 'upsert'
        ? 'resolution=merge-duplicates,return=representation'
        : 'return=representation';
    }
    return headers;
  }

  private buildUrl(): string {
    const url = new URL(`${supabaseUrl}/rest/v1/${this.table}`);
    if (this.action === 'select' || this.selectCols !== '*') {
      url.searchParams.set('select', this.selectCols);
    }
    this.filters.forEach((f) => {
      if (f.op === 'in') {
        const valStr = Array.isArray(f.value) ? f.value.join(',') : String(f.value);
        url.searchParams.append(f.column, `in.(${valStr})`);
      } else {
        url.searchParams.append(f.column, `${f.op}.${f.value}`);
      }
    });
    if (this.orderSpecs.length > 0) {
      const orderParam = this.orderSpecs
        .map((o) => `${o.column}.${o.ascending ? 'asc' : 'desc'}`)
        .join(',');
      url.searchParams.set('order', orderParam);
    }
    if (this.limitCount !== undefined) {
      url.searchParams.set('limit', String(this.limitCount));
    }
    if (this.onConflictCol && this.action === 'upsert') {
      url.searchParams.set('on_conflict', this.onConflictCol);
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
      if (this.action === 'insert' || this.action === 'upsert') method = 'POST';
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
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.code === '23505') {
            if (errJson.message?.includes('pkey')) {
              errorMessage = 'A record with this ID already exists. Please try again.';
            } else {
              errorMessage = 'A record with this information already exists in the system.';
            }
          } else {
            errorMessage = errJson.message || errJson.error_description || errJson.details || errJson.hint || errText;
          }
        } catch {
          if (errText) errorMessage = errText;
        }
        const error = new Error(errorMessage);
        console.error(`[Supabase REST Error] ${method} ${this.table}:`, errorMessage);
        const res = { data: null, error };
        return onfulfilled ? onfulfilled(res) : (res as any);
      }

      let json: any = null;
      if (response.status !== 204) {
        const text = await response.text();
        if (text) {
          try {
            json = JSON.parse(text);
          } catch {
            json = null;
          }
        }
      }

      let data = json;
      if (this.isSingle && Array.isArray(json)) {
        data = json[0] || null;
      }

      const res = { data, error: null };
      return onfulfilled ? onfulfilled(res) : (res as any);
    } catch (err: any) {
      console.error(`[Supabase Network Error] ${this.table}:`, err);
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
          const errText = await res.text();
          let msg = errText;
          try {
            const j = JSON.parse(errText);
            msg = j.error_description || j.message || errText;
          } catch {}
          return { data: null, error: new Error(msg) };
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
          const errText = await res.text();
          let msg = errText;
          try {
            const j = JSON.parse(errText);
            msg = j.error_description || j.message || errText;
          } catch {}
          return { data: null, error: new Error(msg) };
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
        async upload(filePath: string, file: File | Blob, opts?: { contentType?: string; upsert?: boolean }) {
          try {
            if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase not configured') };
            const cleanPath = filePath.replace(/^\//, '');
            const headers: Record<string, string> = {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': opts?.contentType || file.type || 'application/octet-stream',
            };
            if (opts?.upsert) {
              headers['x-upsert'] = 'true';
            }
            const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${cleanPath}`, {
              method: 'POST',
              headers,
              body: file,
            });
            if (!res.ok) {
              const errText = await res.text();
              let msg = errText;
              try {
                const j = JSON.parse(errText);
                msg = j.message || j.error || errText;
              } catch {}
              return { data: null, error: new Error(msg) };
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
