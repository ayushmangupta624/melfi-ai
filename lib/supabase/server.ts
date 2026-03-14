// import { createServerClient } from "@supabase/ssr";
// import { cookies } from "next/headers";

// /**
//  * Especially important if using Fluid compute: Don't put this client in a
//  * global variable. Always create a new client within each function when using
//  * it.
//  */
// export async function createClient() {
//   const cookieStore = await cookies();

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return cookieStore.getAll();
//         },
//         setAll(cookiesToSet) {
//           try {
//             cookiesToSet.forEach(({ name, value, options }) =>
//               cookieStore.set(name, value, options),
//             );
//           } catch {
//             // The `setAll` method was called from a Server Component.
//             // This can be ignored if you have proxy refreshing
//             // user sessions.
//           }
//         },
//       },
//     },
//   );
// }

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const cookieHandlers = async () => {
  const cookieStore = await cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      } catch {
        // Called from a Server Component — safe to ignore
      }
    },
  };
};

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: await cookieHandlers() },
  );
}

export async function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: await cookieHandlers() },
  );
}