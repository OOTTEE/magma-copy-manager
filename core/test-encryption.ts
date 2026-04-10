import { settingsService } from './services/settings/settings.service';
import { serverConfig } from './config/server.config';

async function testEncryption() {
  console.log('--- Testing Settings Encryption ---');
  console.log('Config Encryption Key:', serverConfig.encryptionKey.slice(0, 10) + '...');

  const originalToken = 'nex_tok_123456789abc';
  console.log('Original Token:', originalToken);

  // 1. Update setting
  await settingsService.updateSetting('nexudus_token', originalToken);
  console.log('Token updated in DB.');

  // 2. Get setting (should be masked)
  const allSettings = await settingsService.getAllSettings();
  console.log('Masked Token (UI):', allSettings['nexudus_token']);

  // 3. Get secret setting
  const decryptedToken = await settingsService.getSecretSetting('nexudus_token');
  console.log('Decrypted Token (Backend):', decryptedToken);

  if (originalToken === decryptedToken) {
    console.log('✅ Encryption/Decryption works perfectly!');
  } else {
    console.log('❌ Encryption/Decryption failed!');
  }
}

testEncryption();
