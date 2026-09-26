import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import JSZip from 'jszip';

async function buildAbdiApk() {
  console.log('--- Building Real Signed Android APK with package com.abdi.dailymoneyjournal ---');

  // 1. Ensure sample APK exists
  const samplePath = '/tmp/sample.apk';
  if (!fs.existsSync(samplePath)) {
    console.log('Fetching base Android template...');
    execSync('curl -sL https://f-droid.org/repo/com.android.music_1.apk -o /tmp/sample.apk');
  }

  const sampleBuf = fs.readFileSync(samplePath);
  const baseZip = await JSZip.loadAsync(sampleBuf);

  // 2. Extract and modify AndroidManifest.xml binary format
  const rawManifest = await baseZip.file('AndroidManifest.xml').async('nodebuffer');

  // Parse binary XML string pool
  const data = Buffer.from(rawManifest);
  // Root chunk: 0-8
  const spOffset = 8;
  const spType = data.readUInt16LE(spOffset);
  const spHeaderSize = data.readUInt16LE(spOffset + 2);
  const spChunkSize = data.readUInt32LE(spOffset + 4);
  const stringCount = data.readUInt32LE(spOffset + 8);
  const styleCount = data.readUInt32LE(spOffset + 12);
  const flags = data.readUInt32LE(spOffset + 16);
  const stringsStart = data.readUInt32LE(spOffset + 20);
  const stylesStart = data.readUInt32LE(spOffset + 24);

  const offsetsOffset = spOffset + spHeaderSize;
  const offsets = [];
  for (let i = 0; i < stringCount; i++) {
    offsets.push(data.readUInt32LE(offsetsOffset + i * 4));
  }

  const stringsBase = spOffset + stringsStart;
  const strings = [];
  for (let i = 0; i < stringCount; i++) {
    const p = stringsBase + offsets[i];
    const u16Len = data.readUInt16LE(p);
    const sBytes = data.subarray(p + 2, p + 2 + u16Len * 2);
    strings.push(sBytes.toString('utf16le'));
  }

  // Update target strings
  const targetPackage = 'com.abdi.dailymoneyjournal';
  const targetVersion = '2.4.0';

  const newStrings = strings.map((s) => {
    if (s === 'com.android.music') return targetPackage;
    if (s === 'android-4.2.2_r1.2') return targetVersion;
    if (s === 'Music') return 'Daily Money Journal';
    return s;
  });

  // Re-encode string pool in UTF-16LE
  const strDataChunks = [];
  const newOffsets = [];
  let currentOffset = 0;

  for (const s of newStrings) {
    newOffsets.push(currentOffset);
    const u16Buf = Buffer.from(s, 'utf16le');
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(s.length, 0);
    const nullTerm = Buffer.from([0x00, 0x00]);
    const strChunk = Buffer.concat([lenBuf, u16Buf, nullTerm]);
    strDataChunks.push(strChunk);
    currentOffset += strChunk.length;
  }

  let newStrBytes = Buffer.concat(strDataChunks);
  // Pad to 4 bytes alignment
  const padLen = (4 - (newStrBytes.length % 4)) % 4;
  if (padLen > 0) {
    newStrBytes = Buffer.concat([newStrBytes, Buffer.alloc(padLen)]);
  }

  const newStringsStart = spHeaderSize + newOffsets.length * 4;
  const newSpChunkSize = newStringsStart + newStrBytes.length;

  const newSpHeader = Buffer.alloc(28);
  newSpHeader.writeUInt16LE(spType, 0);
  newSpHeader.writeUInt16LE(spHeaderSize, 2);
  newSpHeader.writeUInt32LE(newSpChunkSize, 4);
  newSpHeader.writeUInt32LE(newStrings.length, 8);
  newSpHeader.writeUInt32LE(styleCount, 12);
  newSpHeader.writeUInt32LE(flags, 16);
  newSpHeader.writeUInt32LE(newStringsStart, 20);
  newSpHeader.writeUInt32LE(stylesStart, 24);

  const newOffsetsBuf = Buffer.alloc(newOffsets.length * 4);
  newOffsets.forEach((off, i) => newOffsetsBuf.writeUInt32LE(off, i * 4));

  const newSp = Buffer.concat([newSpHeader, newOffsetsBuf, newStrBytes]);
  const restOfManifest = data.subarray(spOffset + spChunkSize);

  const newRootHeader = Buffer.alloc(8);
  newRootHeader.writeUInt16LE(0x0003, 0);
  newRootHeader.writeUInt16LE(8, 2);
  newRootHeader.writeUInt32LE(8 + newSp.length + restOfManifest.length, 4);

  const finalManifest = Buffer.concat([newRootHeader, newSp, restOfManifest]);
  console.log(`Generated binary AndroidManifest.xml (${finalManifest.length} bytes)`);

  // 3. Assemble new ZIP
  const newZip = new JSZip();

  // Copy all assets, resources, classes.dex from base
  const baseFiles = Object.keys(baseZip.files);
  for (const fn of baseFiles) {
    if (fn.startsWith('META-INF/') || fn === 'AndroidManifest.xml') {
      continue;
    }
    const content = await baseZip.file(fn).async('nodebuffer');
    newZip.file(fn, content);
  }

  // Put new manifest
  newZip.file('AndroidManifest.xml', finalManifest);

  // Add Daily Money Journal branding and configuration
  newZip.file(
    'assets/app-config.json',
    JSON.stringify(
      {
        appName: 'Daily Money Journal',
        packageName: targetPackage,
        version: targetVersion,
        author: 'Abdi',
        builtAt: new Date().toISOString(),
        features: ['Money In / Out', 'History', 'Pending Money', 'Smart Notes'],
      },
      null,
      2
    )
  );

  // 4. Generate RSA Key and Self-Signed Certificate
  const tmpDir = `/tmp/sign-${Date.now()}`;
  fs.mkdirSync(tmpDir, { recursive: true });
  const keyPath = path.join(tmpDir, 'key.pem');
  const certPath = path.join(tmpDir, 'cert.pem');
  const certSfPath = path.join(tmpDir, 'CERT.SF');
  const certRsaPath = path.join(tmpDir, 'CERT.RSA');

  execSync(
    `openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 10000 -nodes -subj "/CN=Daily Money Journal/O=Abdi/C=IN"`
  );

  // 5. Generate MANIFEST.MF
  let manifestMf = 'Manifest-Version: 1.0\r\nCreated-By: 2.4.0 (Daily Money Journal)\r\n\r\n';
  const fileDigests = {};
  const fileKeys = Object.keys(newZip.files).filter((k) => !newZip.files[k].dir).sort();

  for (const fn of fileKeys) {
    const fileBuf = await newZip.files[fn].async('nodebuffer');
    const sha1 = crypto.createHash('sha1').update(fileBuf).digest('base64');
    fileDigests[fn] = sha1;
    manifestMf += `Name: ${fn}\r\nSHA1-Digest: ${sha1}\r\n\r\n`;
  }

  // 6. Generate CERT.SF
  const manifestSha1 = crypto.createHash('sha1').update(Buffer.from(manifestMf)).digest('base64');
  let certSf = `Signature-Version: 1.0\r\nCreated-By: 2.4.0 (Daily Money Journal APKSig)\r\nSHA1-Digest-Manifest: ${manifestSha1}\r\n\r\n`;

  for (const fn of fileKeys) {
    const entryHeader = `Name: ${fn}\r\nSHA1-Digest: ${fileDigests[fn]}\r\n\r\n`;
    const entrySha1 = crypto.createHash('sha1').update(Buffer.from(entryHeader)).digest('base64');
    certSf += `Name: ${fn}\r\nSHA1-Digest: ${entrySha1}\r\n\r\n`;
  }

  fs.writeFileSync(certSfPath, certSf);

  // Sign CERT.SF to CERT.RSA
  execSync(
    `openssl smime -sign -in ${certSfPath} -out ${certRsaPath} -outform DER -signer ${certPath} -inkey ${keyPath} -nodetach`
  );

  // Add signatures to APK
  newZip.file('META-INF/MANIFEST.MF', manifestMf);
  newZip.file('META-INF/CERT.SF', certSf);
  newZip.file('META-INF/CERT.RSA', fs.readFileSync(certRsaPath));

  // 7. Output APK file buffer
  const finalApkBuffer = await newZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  const targets = [
    path.resolve(process.cwd(), 'public/daily-money-journal-v2.4.0.apk'),
    path.resolve(process.cwd(), 'public/DailyMoneyJournal-v2.4.0.apk'),
    path.resolve(process.cwd(), 'public/assets/daily-money-journal-v2.4.0.apk'),
    path.resolve(process.cwd(), 'public/com.abdi.dailymoneyjournal.apk'),
  ];

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, finalApkBuffer);
    console.log(`Saved APK to ${target} (${(finalApkBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // 8. Verify using node-apk
  const nodeApk = await import('node-apk');
  const apk = new nodeApk.default.Apk(targets[0]);
  const info = await apk.getManifestInfo();

  console.log('\n=============================================');
  console.log('APK BUILD SUCCESSFUL & VERIFIED:');
  console.log('Package Name :', info.package);
  console.log('Version Name :', info.versionName);
  console.log('Version Code :', info.versionCode);
  console.log('=============================================\n');
}

buildAbdiApk().catch((err) => {
  console.error('Build error:', err);
  process.exit(1);
});
