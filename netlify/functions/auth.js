const { createClient } = require('@supabase/supabase-js');

// ✅ GUNAKAN ANON KEY untuk signup (seperti client-side)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Admin client untuk operasi khusus (optional)
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
            console.log('📧 Signup attempt for:', email);
            
            // ✅ PAKAI supabase.auth.signUp (BUKAN admin.createUser)
            // Ini akan otomatis kirim email seperti client-side
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Redirect setelah confirm email
                    emailRedirectTo: `${process.env.URL || 'http://localhost:8888'}/`
                }
            });

            if (error) {
                console.error('❌ Signup error:', error);
                throw error;
            }

            console.log('✅ Signup success. User ID:', data.user?.id);
            console.log('📨 Email sent:', !data.user?.email_confirmed_at ? 'YES' : 'NO');

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: data.user?.email_confirmed_at 
                        ? 'Account created and confirmed!' 
                        : 'Account created! Please check your email for confirmation link.',
                    needsConfirmation: !data.user?.email_confirmed_at,
                    user: { 
                        id: data.user?.id, 
                        email: data.user?.email,
                        confirmed: !!data.user?.email_confirmed_at
                    }
                })
            };
        } 
        
        else if (action === 'signin') {
            console.log('🔑 Signin attempt for:', email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('❌ Signin error:', error);
                throw error;
            }

            // ✅ ALLOW login even without email confirmation (for testing)
            // Remove this check if you want strict email confirmation
            /*
            if (!data.user.email_confirmed_at) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Please confirm your email first. Check your inbox and spam folder.' 
                    })
                };
            }
            */

            console.log('✅ Signin success for user:', data.user.id);

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
        console.error('❌ Auth function error:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};