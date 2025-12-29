
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfile() {
    const email = 'user@test.com';
    const password = 'Test@Pass123';
    console.log(`Authenticating as: ${email}`);

    // 1. Sign In
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError || !session) {
        console.error('Error logging in:', loginError);
        return;
    }

    const user = session.user;
    console.log(`Logged in. User ID: ${user.id}`);

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        console.log('Profile already exists:', profile);
        return;
    }

    console.log('Profile missing. Creating...');

    // 3. Insert Profile
    const { error: insertError } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            email: email,
            name: 'Test User', // Required by schema
        });

    if (insertError) {
        console.error('Error inserting profile:', insertError);
    } else {
        console.log('Profile created successfully.');
    }
}

fixProfile();
