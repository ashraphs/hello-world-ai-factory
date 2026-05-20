const http = require('http');
const { app, server } = require('./server');

const PORT = process.env.PORT || 3000;

function testApp() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Test timeout'));
    }, 5000);

    // Wait a bit for server to start
    setTimeout(() => {
      http.get(`http://localhost:${PORT}/`, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          clearTimeout(timeout);
          server.close();

          if (res.statusCode !== 200) {
            reject(new Error(`Expected status 200, got ${res.statusCode}`));
            return;
          }

          if (!data.includes('Hello World')) {
            reject(new Error('Response does not contain "Hello World"'));
            return;
          }

          console.log('✓ App starts successfully');
          console.log('✓ GET / returns HTTP 200');
          console.log('✓ Response contains "Hello World"');
          console.log('\nAll tests passed!');
          resolve();
        });
      }).on('error', (err) => {
        clearTimeout(timeout);
        server.close();
        reject(err);
      });
    }, 500);
  });
}

testApp()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err.message);
    process.exit(1);
  });
