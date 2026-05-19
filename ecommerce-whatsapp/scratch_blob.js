const { list, head } = require('@vercel/blob');

const token = 'vercel_blob_rw_Jxkj6FeScURdG6UL_sN4ofM9Lt2tqYjP32gEvy7AmENk6pw';

async function testBlob() {
  try {
    console.log('Testing Vercel Blob list...');
    const result = await list({ token });
    console.log('Success! Found', result.blobs.length, 'blobs.');
    if (result.blobs.length > 0) {
      console.log('First blob URL:', result.blobs[0].url);
    }
  } catch (err) {
    console.error('Error testing Vercel Blob:', err.message);
  }
}

testBlob();
