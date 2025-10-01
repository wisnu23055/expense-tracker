const { createClient } = require('@supabase/supabase-js');

// ✅ GUNAKAN ANON KEY untuk signup
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
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
            
            // ✅ FIX: Get actual site URL from Netlify headers
            const siteUrl = event.headers.host 
                ? `https://${event.headers.host}` 
                : 'http://localhost:8888';
            
            console.log('🌐 Site URL:', siteUrl);
            
            // ✅ PAKAI supabase.auth.signUp dengan URL yang benar
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${siteUrl}/?confirmed=true`
                }
            });

            if (error) {
                console.error('❌ Signup error:', error);
                throw error;
            }

            console.log('✅ Signup success. User ID:', data.user?.id);
            console.log('📧 Email confirmed at signup:', data.user?.email_confirmed_at);
            console.log('📨 Should send email:', !data.user?.email_confirmed_at ? 'YES' : 'NO');

            // ✅ Better response with more info
            const needsConfirmation = !data.user?.email_confirmed_at;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: needsConfirmation
                        ? 'Account created! Please check your email (including spam folder) for confirmation link.'
                        : 'Account created and confirmed! You can now sign in.',
                    needsConfirmation,
                    user: { 
                        id: data.user?.id, 
                        email: data.user?.email,
                        confirmed: !!data.user?.email_confirmed_at
                    },
                    debug: {
                        emailRedirectTo: `${siteUrl}/?confirmed=true`,
                        emailConfirmedAt: data.user?.email_confirmed_at,
                        siteUrl
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

            console.log('✅ Signin success for user:', data.user.id);
            console.log('📧 Email confirmed:', !!data.user.email_confirmed_at);

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