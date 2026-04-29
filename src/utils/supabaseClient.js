import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qsszaqmyrhkqycaymfvm.supabase.co"; // ✅ FIXED
const supabaseKey = "sb_publishable_D-a086poIitS8N7-CLBd3A_mCUPkoCu";

export const supabase = createClient(supabaseUrl, supabaseKey);