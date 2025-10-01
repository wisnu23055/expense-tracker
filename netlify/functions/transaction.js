const { createClient } = require('@supabase/supabase-js');

// ✅ Credentials aman di server
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // ✅ Validate user token dari Authorization header
        const token = event.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return { 
                statusCode: 401, 
                headers, 
                body: JSON.stringify({ error: 'No authentication token provided' }) 
            };
        }

        // Verify token dengan Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return { 
                statusCode: 401, 
                headers, 
                body: JSON.stringify({ error: 'Invalid or expired token' }) 
            };
        }

        // GET - Load semua transactions user
        if (event.httpMethod === 'GET') {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        } 
        
        // POST - Add new transaction
        else if (event.httpMethod === 'POST') {
            const { description, amount, type, category } = JSON.parse(event.body);

            // Validation
            if (!description || !amount || !type) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            const { data, error } = await supabase
                .from('transactions')
                .insert([{
                    user_id: user.id,
                    description,
                    amount: parseFloat(amount),
                    type,
                    category
                }])
                .select()
                .single();

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        } 
        
        // DELETE - Delete transaction
        else if (event.httpMethod === 'DELETE') {
            const { id } = JSON.parse(event.body);

            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Transaction ID required' })
                };
            }

            // Ensure user can only delete own transactions
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Transaction deleted' })
            };
        }

        else {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

    } catch (error) {
        console.error('Transaction error:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};