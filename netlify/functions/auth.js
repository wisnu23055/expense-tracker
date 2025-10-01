const { createClient } = require('@supabase/supabase-js');

// ✅ GUNAKAN ANON KEY untuk signup (bukan service key)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY  // ← Change ini!
);

// Service key untuk admin operations
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

    try {
        const { action, email, password } = JSON.parse(event.body);

        if (action === 'signup') {
            console.log('📧 Attempting signup for:', email);
            
            // ✅ GUNAKAN supabase.auth.signUp (akan kirim email otomatis)
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: 'https://exxpensettracker.netlify.app/'  // ✅ Ganti URL
                }
            });

            if (error) {
                console.error('Signup error:', error);
                throw error;
            }

            console.log('✅ Signup success:', data.user?.id);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Please check your email for confirmation link',
                    needsConfirmation: !data.user?.email_confirmed_at,
                    user: { id: data.user?.id, email: data.user?.email }
                })
            };
        } 
        
        else if (action === 'signin') {
            console.log('🔑 Attempting signin for:', email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Signin error:', error);
                throw error;
            }

            // ✅ CEK email confirmation
            if (!data.user.email_confirmed_at) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Please confirm your email first. Check your inbox and spam folder.' 
                    })
                };
            }

            console.log('✅ Signin success:', data.user.id);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    session: data.session,
                    user: data.user
                })
            };
        }
        
        else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid action' })
            };
        }

    } catch (error) {
        console.error('Auth function error:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};