const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
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
            // ✅ KIRIM EMAIL CONFIRMATION
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: false,  // ❌ Ubah jadi false
                user_metadata: {
                    // Optional: tambah metadata
                }
            });

            if (error) throw error;

            // Kirim confirmation email manual
            const { error: emailError } = await supabase.auth.admin.generateLink({
                type: 'signup',
                email: email,
                options: {
                    redirectTo: 'https://your-app.netlify.app'  // ✅ Ganti dengan URL Netlify Anda
                }
            });

            if (emailError) {
                console.error('Email error:', emailError);
                // Tapi tetap lanjutkan signup
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Account created! Please check your email to confirm your account.',
                    user: { id: data.user.id, email: data.user.email }
                })
            };
        } 
        
        else if (action === 'signin') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // ✅ CEK apakah email sudah di-confirm
            if (!data.user.email_confirmed_at) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Please confirm your email first. Check your inbox.' 
                    })
                };
            }

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
        console.error('Auth error:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};