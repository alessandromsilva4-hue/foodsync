// Supabase client used during the gradual Firebase -> Supabase migration.
// Firebase remains the login provider; the ID token is forwarded to Supabase
// after the project's Firebase third-party Auth integration and RLS are ready.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.0";
import { auth } from "./firebase.js";

const SUPABASE_URL = "https://riieljjuecgeafumykmo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_cG4c1hAdEMt5bY_FSpNByw_PP3dXPxp";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    accessToken: async () => {
        const user = auth.currentUser;
        return user ? user.getIdToken() : null;
    }
});
