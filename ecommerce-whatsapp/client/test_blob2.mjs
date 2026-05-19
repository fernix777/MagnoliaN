import { list } from '@vercel/blob';

const token = 'vercel_blob_rw_Jxkj6FeScURdG6UL_sN4ofM9Lt2tqYjP32gEvy7AmENk6pw';

async function test() {
  try {
    const { blobs } = await list({ token });
    if (blobs.length > 0) {
      const b = blobs[0];
      
      const res = await fetch(b.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.magnolia-n.com/'
        }
      });
      console.log('Fetch with prod referer status:', res.status);
    }
  } catch(e) {
    console.error('Error:', e.message);
  }
}

test();
