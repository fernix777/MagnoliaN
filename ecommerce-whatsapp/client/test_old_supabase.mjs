import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://dsovrmquhgkquqsvkptc.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3ZybXF1aGdrcXVxc3ZrcHRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNzI1MiwiZXhwIjoyMDkxNTEzMjUyfQ.wXoOTwXEJaEA-PHuQ9TfwnvEWpXAd-VkcRRlzKzqtXw';

const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function testOldSupabase() {
    try {
        console.log('Fetching buckets from old project...');
        const { data: buckets, error: bucketError } = await oldSupabase.storage.listBuckets();
        if (bucketError) {
            console.error('Error listing buckets:', bucketError);
            return;
        }
        
        console.log('Buckets found:', buckets.map(b => b.name));

        // For each bucket, list first 5 files
        for (const b of buckets) {
            const { data: files, error: fileError } = await oldSupabase.storage.from(b.name).list('', { limit: 5 });
            if (fileError) {
                console.error(`Error listing files in ${b.name}:`, fileError);
            } else {
                console.log(`Files in ${b.name}:`, files.length > 0 ? files.map(f => f.name) : 'No files found');
            }
        }

    } catch (e) {
        console.error('Exception:', e);
    }
}

testOldSupabase();
