// src/middleware/supabaseAuth.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

let supabase;
if (!supabaseUrl || !supabaseServiceRole) {
    console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE missing. Auth will fail.');
} else {
    supabase = createClient(supabaseUrl, supabaseServiceRole);
}

/**
 * Verifies Authorization Bearer token from client (supabase access token)
 * Attaches user to req.user (with id and email)
 */
async function verifySupabaseToken(req, res, next) {
    if (!supabase) return res.status(500).json({ msg: 'Server auth not configured' });
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) return res.status(401).json({ msg: 'Invalid token' });

        // attach user object
        req.user = {
            id: data.user.id,      // this is auth.users.id (uuid)
            email: data.user.email
        };
        next();
    } catch (e) {
        console.error('auth err', e);
        return res.status(500).json({ msg: 'Auth error' });
    }
}

module.exports = { verifySupabaseToken, supabaseClient: supabase };
