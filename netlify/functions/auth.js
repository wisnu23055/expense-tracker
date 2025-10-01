const { createClient } = require('@supabase/supabase-js');

// ✅ Credentials aman di server environment variables
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY  // Service key untuk admin operations
);

exports.handler = async (event, context) => {
    // CORS headers untuk allow requests dari frontend
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Hanya terima POST request
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

    try {
        const { action, email, password } = JSON.parse(event.body);

        // Handle signup
        if (action === 'signup') {
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true  // Auto-confirm email untuk demo
            });

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'User created successfully',
                    user: { id: data.user.id, email: data.user.email }
                })
            };
        } 
        
        // Handle signin
        else if (action === 'signin') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

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