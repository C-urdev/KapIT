const generateUsername = async (baseName, client) => {
  const normalizedBase = String(baseName).toLowerCase().replace(/[^a-z0-9]/g, '');
  let finalUsername = normalizedBase;
  let counter = 1;
  let exists = true;
  
  while (exists) {
    const check = await client.query('SELECT 1 FROM users WHERE username = $1', [finalUsername]);
    if (check.rowCount === 0) {
      exists = false;
    } else {
      finalUsername = `${normalizedBase}${counter}`;
      counter++;
    }
  }
  return finalUsername;
};

module.exports = { generateUsername };
