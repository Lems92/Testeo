const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Auth Middlewares
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Invalid token');
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const authorizeAdmin = async (req, res, next) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || profile?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Routes
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Tests Routes
app.get('/api/tests', authenticate, async (req, res) => {
    const { recruiter_id } = req.query;
    try {
        let query = supabase
            .from('tests')
            .select('*, submissions(count)')
            .order('created_at', { ascending: false });
        
        if (recruiter_id) {
            query = query.eq('recruiter_id', recruiter_id);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        const formattedData = data.map(test => ({
            ...test,
            submissions_count: test.submissions[0]?.count || 0
        }));
        
        res.json(formattedData);
    } catch (error) {
        console.error('GET /api/tests Error:', error);
        res.status(500).json({ error: error.message, detail: error });
    }
});

app.get('/api/tests/:id', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tests')
            .select('*, scenes(*)')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('GET /api/tests/:id Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tests', authenticate, authorizeAdmin, async (req, res) => {
    const { scenes, ...testData } = req.body;
    try {
        const { data, error } = await supabase
            .from('tests')
            .insert([testData])
            .select();
        
        if (error) throw error;
        const testId = data[0].id;

        if (scenes && scenes.length > 0) {
            const scenesWithId = scenes.map((s, index) => ({
                ...s,
                test_id: testId,
                order_index: index
            }));
            const { error: sceneError } = await supabase
                .from('scenes')
                .insert(scenesWithId);
            if (sceneError) throw sceneError;
        }

        res.json(data[0]);
    } catch (error) {
        console.error('POST /api/tests Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tests/:id', authenticate, authorizeAdmin, async (req, res) => {
    const { scenes, ...testData } = req.body;
    const testId = req.params.id;
    try {
        const { data, error } = await supabase
            .from('tests')
            .update(testData)
            .eq('id', testId)
            .select();
        
        if (error) throw error;

        // Sync scenes
        await supabase.from('scenes').delete().eq('test_id', testId);
        
        if (scenes && scenes.length > 0) {
            const scenesWithId = scenes.map((s, index) => ({
                ...s,
                test_id: testId,
                order_index: index
            }));
            const { error: sceneError } = await supabase
                .from('scenes')
                .insert(scenesWithId);
            if (sceneError) throw sceneError;
        }

        res.json(data[0]);
    } catch (error) {
        console.error('PUT /api/tests/:id Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tests/:id', authenticate, authorizeAdmin, async (req, res) => {
    const testId = req.params.id;
    try {
        console.log(`Attempting to delete test ${testId} and related data...`);
        
        // Delete related data first to avoid FK constraints
        const { error: scenesError } = await supabase.from('scenes').delete().eq('test_id', testId);
        if (scenesError) {
            console.error('Error deleting scenes:', scenesError);
            throw scenesError;
        }

        const { error: subsError } = await supabase.from('submissions').delete().eq('test_id', testId);
        if (subsError) {
            console.error('Error deleting submissions:', subsError);
            throw subsError;
        }
        
        const { error: testError } = await supabase
            .from('tests')
            .delete()
            .eq('id', testId);
        
        if (testError) {
            console.error('Error deleting test:', testError);
            throw testError;
        }
        
        res.json({ message: 'Test and related data deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/tests/:id Error:', error);
        res.status(500).json({ error: error.message, detail: error });
    }
});

// Submissions Routes
app.get('/api/submissions', authenticate, authorizeAdmin, async (req, res) => {
    try {
        console.log('GET /api/submissions - Request received');
        // Try the most standard join first. If this fails, the error will be logged.
        const { data, error } = await supabase
            .from('submissions')
            .select('*, tests(title), profiles(full_name, email)')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error fetching global submissions:', error);
            // Fallback: try without any joins if that was the issue
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (fallbackError) {
                console.error('Global fallback fetch failed:', fallbackError);
                throw fallbackError;
            }
            console.log(`Global fallback successful: found ${fallbackData?.length || 0} submissions`);
            return res.json(fallbackData);
        }
        
        console.log(`Global success: found ${data?.length || 0} submissions with joins`);
        res.json(data);
    } catch (error) {
        console.error('GET /api/submissions Error:', error);
        res.status(500).json({ error: error.message, detail: error });
    }
});

app.get('/api/submissions/:testId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        console.log(`GET /api/submissions/${req.params.testId} - Request received`);
        const { data, error } = await supabase
            .from('submissions')
            .select('*, profiles(full_name, email)')
            .eq('test_id', req.params.testId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(`Supabase error fetching test submissions for ${req.params.testId}:`, error);
            // Fallback
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('submissions')
                .select('*')
                .eq('test_id', req.params.testId)
                .order('created_at', { ascending: false });
            
            if (fallbackError) {
                console.error('Fallback fetch also failed:', fallbackError);
                throw fallbackError;
            }
            console.log(`Fallback successful: found ${fallbackData?.length || 0} submissions`);
            return res.json(fallbackData);
        }
        console.log(`Success: found ${data?.length || 0} submissions with profile joins`);
        res.json(data);
    } catch (error) {
        console.error('GET /api/submissions/:testId Error:', error);
        res.status(500).json({ error: error.message, detail: error });
    }
});

app.post('/api/submissions', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .insert([req.body])
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/submissions/:id', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .update(req.body)
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
