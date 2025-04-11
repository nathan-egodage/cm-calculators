const axios = require('axios');

module.exports = async function (context, req) {
    context.log('Processing HelloSign signature requests');
    
    try {
        // Get API key from environment
        const apiKey = process.env.HELLOSIGN_API_KEY;
        if (!apiKey) {
            throw new Error('HelloSign API key not found in environment variables');
        }

        // Make request to HelloSign API
        const response = await axios.get('https://api.hellosign.com/v3/signature_request/list', {
            headers: {
                'Authorization': `Basic ${apiKey}`,
                'Content-Type': 'application/json'
            },
            params: {
                page: 1,
                page_size: 100,
                query: req.query.search || ''
            },
            timeout: 30000 // 30 second timeout
        });

        // Return the response
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            },
            body: response.data
        };
    } catch (error) {
        context.log.error('HelloSign API Error:', error);
        
        // Return appropriate error response
        context.res = {
            status: error.response?.status || 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                error: 'Failed to fetch signature requests',
                details: error.response?.data || error.message
            }
        };
    }
}; 