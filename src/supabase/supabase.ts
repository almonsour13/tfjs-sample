
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvkjvldovrwltwdmhdre.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2p2bGRvdnJ3bHR3ZG1oZHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NDExNTksImV4cCI6MjA1MzExNzE1OX0.uABgmhWAPHsoGQ7RtpuwZSFC7L3T2Z_GvjBWvUnHm1A'
export const supabase = createClient(supabaseUrl, supabaseKey)