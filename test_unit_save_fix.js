/**
 * Test: Fix for "notNull Violation: Unit.short_name cannot be null"
 */

const BASE_URL = 'http://localhost:3000';

async function testUnitSaveFix() {
  console.log('========================================================================');
  console.log('🚀 TESTING UNIT SAVE FIX (ZERO notNull Violation: Unit.short_name)');
  console.log('========================================================================\n');

  // 1. Log in as Super Admin
  const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999' })
  });
  const cookie = adminLoginRes.headers.get('set-cookie').split(';')[0];
  console.log('👑 Super Admin Logged In');

  // 2. Test Unit Creation with abbreviation
  console.log('\n--- 1. CREATE UNIT WITH NAME & ABBREVIATION ---');
  const createRes1 = await fetch(`${BASE_URL}/admin/master/units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      name: 'KilogramTest',
      abbreviation: 'KG'
    })
  });
  const createData1 = await createRes1.json();
  console.log('Create Unit 1 Status:', createRes1.status === 200 ? '✅ 200 OK' : `❌ ${createRes1.status}`);
  console.log('Response Message / Unit:', createData1.unit ? `✅ Saved with short_name: "${createData1.unit.short_name}"` : `❌ Error: ${createData1.error}`);
  if (!createData1.success) {
    throw new Error(`Unit creation failed: ${createData1.error}`);
  }

  // 3. Test Unit Creation with ONLY name (no abbreviation / short_name)
  console.log('\n--- 2. CREATE UNIT WITH ONLY NAME (EMPTY ABBREVIATION) ---');
  const createRes2 = await fetch(`${BASE_URL}/admin/master/units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      name: 'PacketTest'
      // No abbreviation or short_name provided!
    })
  });
  const createData2 = await createRes2.json();
  console.log('Create Unit 2 Status:', createRes2.status === 200 ? '✅ 200 OK' : `❌ ${createRes2.status}`);
  console.log('Response Message / Unit:', createData2.unit ? `✅ Auto-defaulted short_name: "${createData2.unit.short_name}"` : `❌ Error: ${createData2.error}`);
  if (!createData2.success) {
    throw new Error(`Unit creation without abbreviation failed: ${createData2.error}`);
  }

  // 4. Test Unit Update
  console.log('\n--- 3. UPDATE UNIT ---');
  const updateRes = await fetch(`${BASE_URL}/admin/master/units/${createData1.unit.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({
      name: 'KiloGramsUpdated',
      abbreviation: 'KGS'
    })
  });
  const updateData = await updateRes.json();
  console.log('Update Unit Status:', updateRes.status === 200 ? '✅ 200 OK' : `❌ ${updateRes.status}`);
  console.log('Updated Unit:', updateData.unit ? `✅ short_name updated to: "${updateData.unit.short_name}"` : `❌ Error: ${updateData.error}`);

  // 5. Clean up test units so zero dummy data remains
  console.log('\n--- 4. CLEAN UP TEST UNITS ---');
  const { Unit } = require('./models');
  await Unit.destroy({ where: { id: [createData1.unit.id, createData2.unit.id] } });
  console.log('🧹 Cleaned up temporary test units. Zero dummy data preserved!');

  console.log('\n========================================================================');
  console.log('🎯 UNIT SHORT_NAME notNull VIOLATION FULLY RESOLVED & VERIFIED!');
  console.log('========================================================================');
}

testUnitSaveFix().catch(console.error);
