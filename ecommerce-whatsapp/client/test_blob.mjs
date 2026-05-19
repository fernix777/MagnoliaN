import { list } from '@vercel/blob';

const token = 'vercel_blob_rw_Jxkj6FeScURdG6UL_sN4ofM9Lt2tqYjP32gEvy7AmENk6pw';

async function test() {
  try {
    const { blobs } = await list({ token });
    if (blobs.length > 0) {
      const b = blobs[0];
      
      const res = await fetch(b.url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Fetch with Auth status:', res.status);
    }
  } catch(e) {
    console.error('Error:', e.message);
  }
}

test();
