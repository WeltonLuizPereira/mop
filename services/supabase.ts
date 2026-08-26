
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vaqdyvatllansjxnweht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWR5dmF0bGxhbnNqeG53ZWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDA0OTksImV4cCI6MjEwMzMxNjQ5OX0.ndr12qmY2P62nfmDTUUypWwpcFhnywAMd7QRoMMgHxo';

export const supabase = createClient(supabaseUrl, supabaseKey);
