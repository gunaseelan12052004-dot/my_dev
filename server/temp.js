// temp-hash.js - Multiple hashes generate pannalaam, no duplicates
const bcrypt = require('bcryptjs');

// 1. Simple callback style for quick one password
bcrypt.hash('1234', 12, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log("Hash for '1234'          :", hash);
});

// 2. Async/await style - better for modern code
async function generateHash(password) {
  try {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    console.log(`Hash for '${password}' :`, hash);
    console.log(`SQL ready: UPDATE doctors SET password = '${hash}' WHERE email = 'your@email.com';`);
    console.log('---');
  } catch (err) {
    console.error('Error generating hash:', err);
  }
}

// Run multiple passwords
(async () => {
  await generateHash('1234');       // doctor demo password
  await generateHash('doctor123');
  await generateHash('admin123');   // admin-ku try panna
  await generateHash('mysecret456'); // extra example
})();