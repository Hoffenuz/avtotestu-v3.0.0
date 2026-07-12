'use strict';

/**
 * Supabase admin client — uses service_role key.
 * NEVER expose this client or its key to the frontend.
 * NEVER import this file in any frontend code.
 */
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);

module.exports = supabaseAdmin;
