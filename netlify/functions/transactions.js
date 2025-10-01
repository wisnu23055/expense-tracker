const { createClient } = require('@supabase/supabase-js');

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
        // ✅ Debug logging
        console.log('📝 Transaction request:', event.httpMethod, event.path);
        console.log('🔍 Headers:', event.headers);

        const token = event.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            console.log('❌ No token provided');
            return { 
                statusCode: 401, 
                headers, 
                body: JSON.stringify({ error: 'No authentication token provided' }) 
            };
        }

        console.log('🔑 Token received:', token.substring(0, 50) + '...');

        // Verify token dengan Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            console.log('❌ Auth error:', authError);
            return { 
                statusCode: 401, 
                headers, 
                body: JSON.stringify({ error: 'Invalid or expired token' }) 
            };
        }

        console.log('✅ User authenticated:', user.id, user.email);

        if (event.httpMethod === 'GET') {
            console.log('📊 Loading transactions for user:', user.id);

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            console.log('📈 Query result:', data?.length || 0, 'transactions');

            if (error) {
                console.log('❌ Query error:', error);
                throw error;
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        } 
        
        else if (event.httpMethod === 'POST') {
            // ✅ Parse body dengan error handling
            let requestBody;
            try {
                requestBody = JSON.parse(event.body);
            } catch (parseError) {
                console.log('❌ JSON Parse error:', parseError);
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid JSON in request body' })
                };
            }

            const { description, amount, type, category } = requestBody;

            console.log('➕ Adding transaction:', { description, amount, type, category });

            // Validation
            if (!description || !amount || !type) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields: description, amount, type' })
                };
            }

            const { data, error } = await supabase
                .from('transactions')
                .insert([{
                    user_id: user.id,
                    description,
                    amount: parseFloat(amount),
                    type,
                    category: category || 'other'
                }])
                .select()
                .single();

            if (error) {
                console.log('❌ Insert error:', error);
                throw error;
            }

            console.log('✅ Transaction added:', data.id);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        } 
        
        else if (event.httpMethod === 'DELETE') {
            let requestBody;
            try {
                requestBody = JSON.parse(event.body);
            } catch (parseError) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid JSON in request body' })
                };
            }

            const { id } = requestBody;

            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Transaction ID required' })
                };
            }

            console.log('🗑️ Deleting transaction:', id);

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                console.log('❌ Delete error:', error);
                throw error;
            }

            console.log('✅ Transaction deleted');

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
        console.error('❌ Transaction function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};