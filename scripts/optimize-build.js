#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting build optimization...\n');

// Step 1: Clean previous build
console.log('🧹 Cleaning previous build...');
try {
  execSync('rm -rf dist', { stdio: 'inherit' });
  console.log('✅ Clean completed\n');
} catch (error) {
  console.log('⚠️  Clean failed (directory might not exist)\n');
}

// Step 2: Build the project
console.log('🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Analyze build output
console.log('📊 Analyzing build output...');
try {
  const distPath = join(process.cwd(), 'dist');
  const files = execSync('find dist -type f -name "*.js" -o -name "*.css" -o -name "*.html"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  let totalSize = 0;
  const fileSizes = [];

  files.forEach(file => {
    try {
      const stats = execSync(`stat -c%s "${file}"`, { encoding: 'utf8' });
      const size = parseInt(stats.trim());
      totalSize += size;
      fileSizes.push({ file, size });
    } catch (error) {
      // Skip files that can't be analyzed
    }
  });

  // Ensure totalSize is defined
  if (typeof totalSize === 'undefined') {
    totalSize = 0;
  }

  // Sort by size
  fileSizes.sort((a, b) => b.size - a.size);

  console.log('\n📈 Build Analysis:');
  console.log(`Total files: ${files.length}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

  console.log('🔝 Largest files:');
  fileSizes.slice(0, 10).forEach(({ file, size }, index) => {
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`${index + 1}. ${file} (${sizeKB} KB)`);
  });

  console.log('\n✅ Analysis completed\n');
} catch (error) {
  console.log('⚠️  Analysis failed:', error.message);
}

// Step 4: Generate performance report
console.log('📋 Generating performance report...');
try {
  const report = {
    timestamp: new Date().toISOString(),
    buildSize: totalSize,
    fileCount: files.length,
    largestFiles: fileSizes.slice(0, 5),
    recommendations: []
  };

  // Add recommendations based on analysis
  if (totalSize > 1024 * 1024) { // > 1MB
    report.recommendations.push('Consider code splitting for large bundles');
  }

  const largeFiles = fileSizes.filter(f => f.size > 100 * 1024); // > 100KB
  if (largeFiles.length > 0) {
    report.recommendations.push(`Consider optimizing ${largeFiles.length} large files`);
  }

  writeFileSync('build-report.json', JSON.stringify(report, null, 2));
  console.log('✅ Performance report generated: build-report.json\n');
} catch (error) {
  console.log('⚠️  Report generation failed:', error.message);
}

console.log('🎉 Build optimization completed!');
console.log('\nNext steps:');
console.log('- Review build-report.json for optimization opportunities');
console.log('- Test the build with: npm run preview');
console.log('- Run lighthouse audit for performance metrics');
