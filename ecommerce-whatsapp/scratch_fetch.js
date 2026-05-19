const url = 'https://jxkj6fescurdg6ul.public.blob.vercel-storage.com/categories/category_LIBRERIA_1775487383090_mjwlukgh9.jpg';

fetch(url)
  .then(res => {
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
  })
  .catch(err => {
    console.error('Fetch error:', err.message);
  });
