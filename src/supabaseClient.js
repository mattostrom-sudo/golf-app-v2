import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oygrmmblboerejywxtjh.supabase.co";
// MAKE SURE there are no spaces and it ends with a "
const supabaseAnonKey = "sb_publishable_5pQx5ekc25_1g7LGmgvvag_XWduHNCH";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
window.supabase = supabase;
