import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Use createClient for service role
import crypto from 'crypto';

// Get Supabase URL and Service Role Key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN; // Add your Bot Token to .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key');
  // Avoid throwing error at module scope, handle it in the request
}

if (!telegramBotToken) {
    console.warn('Missing TELEGRAM_BOT_TOKEN for initData verification');
}

// Create a Supabase client with SERVICE_ROLE_KEY for admin operations
// Ensure this client is only used on the server-side
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!,
    {
        auth: {
            persistSession: false // Disable session persistence for server-side client
        }
    }
);

// --- Type Definitions ---
interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface PublicUser {
  id: string; // UUID, Foreign Key to auth.users.id
  telegram_id: number; // Keep for reference/lookup
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone_number?: string;
  wallet_balance?: number;
  aicore_balance?: number;
  level?: number;
  core?: number;
  paid_referrals?: number;
  reinvest_setup?: number;
  referrer_id?: number;
  created_at?: string;
  updated_at?: string;
}

// --- Helper Functions ---

/**
 * Verifies the integrity of the data received from Telegram.
 * Replace with actual verification logic using crypto.
 */
function verifyTelegramData(initData: string, botToken: string): boolean {
    if (!initData || !botToken) return false;
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        if (!hash) return false;

        urlParams.delete('hash'); // Remove hash before verification
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        const isValid = calculatedHash === hash;
        if (!isValid) {
            console.warn('Telegram data verification failed: Hash mismatch');
        }
        return isValid;
    } catch (error) {
        console.error('Error verifying Telegram initData:', error);
        return false;
    }
}

// --- API Route Handler ---

export async function POST(request: Request) {
  // Ensure Supabase client is available
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase credentials' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { telegramUser, initData } = body as { telegramUser?: TelegramUser; initData?: string };

    // 1. Validate Input
    if (!telegramUser || !telegramUser.id || !initData) {
      return NextResponse.json(
        { error: 'Missing Telegram user data or initData' },
        { status: 400 }
      );
    }
    const telegramId = telegramUser.id;

    // 2. Verify Telegram Data (CRITICAL FOR SECURITY)
    if (!telegramBotToken || !verifyTelegramData(initData, telegramBotToken)) {
        // Decide if you want to allow requests without a token during development
        if (process.env.NODE_ENV === 'production') {
            console.error(`Invalid initData for Telegram ID: ${telegramId}`);
            return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 403 });
        }
        console.warn(`Proceeding without initData verification for Telegram ID: ${telegramId} (NODE_ENV=${process.env.NODE_ENV})`);
    }

    console.log(`Processing validated request for Telegram ID: ${telegramId}`);

    // 3. Find or Create User in auth.users
    let authUserId: string;
    let wasAuthUserCreated = false;

    // Attempt to find user by telegram_id in metadata
    const { data: { users: existingAuthUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        // Note: Filtering by metadata might be less efficient at scale.
        // Consider alternative linking strategies if performance becomes an issue.
        // This filter syntax assumes telegram_id is stored directly under raw_user_meta_data.
        // Supabase syntax for metadata filtering might vary or require specific indexing.
         page: 1, perPage: 1 // Assuming telegram_id is unique enough
    });

    // Hacky filter after listing - Replace with direct Supabase filter if possible
    const foundAuthUser = existingAuthUsers.find(u =>
        u.user_metadata?.telegram_id === telegramId
    );


    if (listError && !foundAuthUser) { // Only error if listing failed AND we didn't find the user anyway
        console.error(`Error listing users to find telegram_id ${telegramId}:`, listError);
        // Don't necessarily fail here, maybe the user just doesn't exist yet
    }

    if (foundAuthUser) {
      authUserId = foundAuthUser.id;
      console.log(`Found existing auth user ${authUserId} for Telegram ID: ${telegramId}`);
    } else {
      console.log(`No auth user found for Telegram ID: ${telegramId}. Creating new auth user.`);
      // User not found in auth.users, create them
      const dummyEmail = `telegram_${telegramId}@yourapp.supabase.co`; // Replace with your domain
      const randomPassword = crypto.randomBytes(16).toString('hex');

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password: randomPassword,
        email_confirm: true, // Auto-confirm as verification is via Telegram
        user_metadata: {
          telegram_id: telegramId,
          telegram_username: telegramUser.username,
          // Store initial profile data here if desired, reduces queries later
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          avatar_url: telegramUser.photo_url
        },
      });

      if (createError) {
        console.error(`Error creating auth user for Telegram ID ${telegramId}:`, createError);
        return NextResponse.json(
          { error: `Failed to create auth user: ${createError.message}` },
          { status: 500 }
        );
      }

      if (!newUser || !newUser.user) {
        console.error(`createUser response missing user object for Telegram ID ${telegramId}`);
        return NextResponse.json({ error: 'Failed to get created auth user details' }, { status: 500 });
      }

      authUserId = newUser.user.id;
      wasAuthUserCreated = true;
      console.log(`Created new auth user ${authUserId} for Telegram ID: ${telegramId}`);
    }

    // 4. Upsert User Profile in public.users
    const profileData = {
      id: authUserId, // Link to auth.users using UUID
      telegram_id: telegramId,
      telegram_username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      avatar_url: telegramUser.photo_url,
      // Set default values for other fields if needed, otherwise they'll be null/default
      updated_at: new Date().toISOString(), // Manually set updated_at on upsert
    };

    const { data: upsertedProfile, error: upsertError } = await supabaseAdmin
      .from('users') // Your public users table
      .upsert(profileData, { onConflict: 'id' }) // Upsert based on the UUID 'id'
      .select()
      .single();

    if (upsertError) {
      console.error(`Error upserting profile for auth user ${authUserId}:`, upsertError);
      return NextResponse.json(
        { error: `Database error while saving profile: ${upsertError.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully upserted profile for auth user ${authUserId}`);

    // --- [Optional] Add Default Goal if User Was Just Created in Auth --- 
    // Note: This check (wasAuthUserCreated) relies on the logic above being correct.
    if (wasAuthUserCreated) {
        console.log(`Adding default goal 1 for newly created auth user ${authUserId}`);
        try {
            const { error: goalError } = await supabaseAdmin
            .from('user_goals')
            .insert({ 
                user_id: authUserId, // Use the UUID 
                goal_id: 1, 
                status: 'not_started' 
            });

            if (goalError) {
                // Log error but don't fail the request
                console.error(`Failed to add default goal for new user ${authUserId}:`, goalError);
            } else {
                console.log(`Successfully added default goal 1 for new user ${authUserId}`);
            }
        } catch (e) {
            console.error(`Exception while adding default goal for user ${authUserId}:`, e);
        }
    }
    // --- [End Optional Section] ---

    // 5. Return Profile Data
    return NextResponse.json({ success: true, user: upsertedProfile as PublicUser });

  } catch (error: any) {
    console.error('Unhandled error in POST /api/auth/telegram-user:', error);
    // Avoid exposing detailed error messages in production
    const errorMessage = (error instanceof Error) ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 