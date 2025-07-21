#!/usr/bin/env node

/**
 * Unused Code Analysis Script
 * Scans the mobile app for unused components, screens, and functions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Mobile App for Unused Code');
console.log('=======================================\n');

// Configuration
const config = {
  rootDir: process.cwd(),
  sourceExtensions: ['.tsx', '.ts', '.js', '.jsx'],
  excludeDirs: ['node_modules', '.git', '.expo', 'dist', 'build', '__tests__'],
  componentDirs: ['components', 'screens', 'app'],
  entryPoints: [
    'app/_layout.tsx',
    'app/index.tsx',
    'app/(tabs)/_layout.tsx',
    'app/(auth)/_layout.tsx',
    'app/(modal)/_layout.tsx'
  ]
};

// Results storage
const results = {
  allFiles: new Set(),
  allExports: new Map(), // file -> exports
  allImports: new Map(), // file -> imports
  usedExports: new Set(),
  unusedFiles: new Set(),
  unusedExports: new Map(),
  duplicateComponents: new Map(),
  deprecatedPatterns: []
};

/**
 * Get all source files recursively
 */
function getAllSourceFiles(dir, files = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(config.rootDir, fullPath);
      
      // Skip excluded directories
      if (entry.isDirectory() && !config.excludeDirs.some(exclude => 
        relativePath.includes(exclude) || entry.name.startsWith('.')
      )) {
        getAllSourceFiles(fullPath, files);
      } else if (entry.isFile() && config.sourceExtensions.some(ext => 
        entry.name.endsWith(ext)
      )) {
        files.push(relativePath);
        results.allFiles.add(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Extract exports from a file
 */
function extractExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exports = new Set();
    
    // Export patterns to match
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /export\s*\{\s*([^}]+)\s*\}/g,
      /export\s*\*\s+from/g
    ];
    
    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          // Handle named exports in braces
          if (match[1].includes(',')) {
            match[1].split(',').forEach(name => {
              const cleanName = name.trim().split(' as ')[0].trim();
              if (cleanName && cleanName !== 'default') {
                exports.add(cleanName);
              }
            });
          } else {
            exports.add(match[1].trim());
          }
        }
      }
    });
    
    // Check for default export
    if (content.includes('export default')) {
      const defaultMatch = content.match(/export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (defaultMatch) {
        exports.add(defaultMatch[1]);
      } else {
        // Anonymous default export
        exports.add('default');
      }
    }
    
    return exports;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return new Set();
  }
}

/**
 * Extract imports from a file
 */
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = new Set();
    
    // Import patterns
    const importPatterns = [
      /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"]([^'"]+)['"]/g,
      /import\s*\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g,
      /import\s*\*\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"]([^'"]+)['"]/g,
      /import\s+(['"][^'"]+['"])/g
    ];
    
    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1] && match[2]) {
          // Named or default imports
          if (match[1].includes(',')) {
            match[1].split(',').forEach(name => {
              const cleanName = name.trim().split(' as ')[0].trim();
              if (cleanName) {
                imports.add(`${cleanName}:${match[2]}`);
              }
            });
          } else {
            imports.add(`${match[1].trim()}:${match[2]}`);
          }
        } else if (match[1]) {
          // Side-effect imports
          imports.add(`side-effect:${match[1].replace(/['"]/g, '')}`);
        }
      }
    });
    
    return imports;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return new Set();
  }
}

/**
 * Check if a component/function is used
 */
function isExportUsed(exportName, exportFile) {
  for (const [file, imports] of results.allImports.entries()) {
    if (file === exportFile) continue; // Skip self-imports
    
    for (const importStr of imports) {
      const [importName, importPath] = importStr.split(':');
      
      // Check if this import matches our export
      if (importName === exportName) {
        // Resolve relative imports
        const resolvedPath = resolveImportPath(importPath, file);
        if (resolvedPath === exportFile) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Resolve import path to actual file
 */
function resolveImportPath(importPath, fromFile) {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // Relative import
    const fromDir = path.dirname(fromFile);
    const resolved = path.resolve(fromDir, importPath);
    const relativePath = path.relative(config.rootDir, resolved);
    
    // Try different extensions
    for (const ext of config.sourceExtensions) {
      const withExt = `${relativePath}${ext}`;
      if (results.allFiles.has(withExt)) {
        return withExt;
      }
    }
    
    // Try index files
    for (const ext of config.sourceExtensions) {
      const indexFile = `${relativePath}/index${ext}`;
      if (results.allFiles.has(indexFile)) {
        return indexFile;
      }
    }
  }
  
  return null;
}

/**
 * Find duplicate components
 */
function findDuplicateComponents() {
  const componentNames = new Map();
  
  for (const file of results.allFiles) {
    if (file.includes('/components/') || file.includes('/screens/')) {
      const fileName = path.basename(file, path.extname(file));
      
      if (!componentNames.has(fileName)) {
        componentNames.set(fileName, []);
      }
      componentNames.get(fileName).push(file);
    }
  }
  
  // Find duplicates
  for (const [name, files] of componentNames.entries()) {
    if (files.length > 1) {
      results.duplicateComponents.set(name, files);
    }
  }
}

/**
 * Find deprecated patterns
 */
function findDeprecatedPatterns() {
  const deprecatedPatterns = [
    { pattern: /StyleSheet\.create/, description: 'StyleSheet.create (consider NativeWind)' },
    { pattern: /import.*react-native-vector-icons/, description: 'react-native-vector-icons (use Lucide instead)' },
    { pattern: /AsyncStorage/, description: 'AsyncStorage (use @react-native-async-storage/async-storage)' },
    { pattern: /componentWillMount|componentWillReceiveProps|componentWillUpdate/, description: 'Deprecated lifecycle methods' },
    { pattern: /findDOMNode/, description: 'findDOMNode (deprecated)' },
    { pattern: /UNSAFE_/, description: 'UNSAFE_ lifecycle methods' }
  ];
  
  for (const file of results.allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const { pattern, description } of deprecatedPatterns) {
        if (pattern.test(content)) {
          results.deprecatedPatterns.push({
            file,
            pattern: description,
            matches: content.match(pattern) || []
          });
        }
      }
    } catch (error) {
      console.error(`Error checking deprecated patterns in ${file}:`, error.message);
    }
  }
}

/**
 * Main analysis function
 */
async function analyzeUnusedCode() {
  console.log('📁 Scanning source files...');
  const allFiles = getAllSourceFiles(config.rootDir);
  console.log(`   Found ${allFiles.length} source files\n`);
  
  console.log('📤 Extracting exports...');
  for (const file of allFiles) {
    const exports = extractExports(file);
    if (exports.size > 0) {
      results.allExports.set(file, exports);
    }
  }
  console.log(`   Found exports in ${results.allExports.size} files\n`);
  
  console.log('📥 Extracting imports...');
  for (const file of allFiles) {
    const imports = extractImports(file);
    if (imports.size > 0) {
      results.allImports.set(file, imports);
    }
  }
  console.log(`   Found imports in ${results.allImports.size} files\n`);
  
  console.log('🔍 Analyzing usage...');
  for (const [file, exports] of results.allExports.entries()) {
    const unusedInFile = new Set();
    
    for (const exportName of exports) {
      if (!isExportUsed(exportName, file)) {
        unusedInFile.add(exportName);
      } else {
        results.usedExports.add(`${exportName}:${file}`);
      }
    }
    
    if (unusedInFile.size > 0) {
      results.unusedExports.set(file, unusedInFile);
    }
    
    // If all exports are unused, mark file as unused
    if (unusedInFile.size === exports.size) {
      results.unusedFiles.add(file);
    }
  }
  
  console.log('🔍 Finding duplicate components...');
  findDuplicateComponents();
  
  console.log('🔍 Finding deprecated patterns...');
  findDeprecatedPatterns();
  
  // Generate report
  generateReport();
}

/**
 * Generate cleanup report
 */
function generateReport() {
  console.log('\n📊 UNUSED CODE ANALYSIS REPORT');
  console.log('================================\n');
  
  // Unused files
  if (results.unusedFiles.size > 0) {
    console.log('🗑️  UNUSED FILES (Safe to delete):');
    for (const file of results.unusedFiles) {
      console.log(`   ❌ ${file}`);
    }
    console.log(`   Total: ${results.unusedFiles.size} files\n`);
  } else {
    console.log('✅ No completely unused files found\n');
  }
  
  // Unused exports
  if (results.unusedExports.size > 0) {
    console.log('🗑️  UNUSED EXPORTS (Review and remove):');
    for (const [file, exports] of results.unusedExports.entries()) {
      console.log(`   📄 ${file}:`);
      for (const exportName of exports) {
        console.log(`      ❌ ${exportName}`);
      }
    }
    console.log(`   Total: ${Array.from(results.unusedExports.values()).reduce((sum, set) => sum + set.size, 0)} unused exports\n`);
  } else {
    console.log('✅ No unused exports found\n');
  }
  
  // Duplicate components
  if (results.duplicateComponents.size > 0) {
    console.log('👥 DUPLICATE COMPONENTS (Merge or remove):');
    for (const [name, files] of results.duplicateComponents.entries()) {
      console.log(`   🔄 ${name}:`);
      for (const file of files) {
        console.log(`      📄 ${file}`);
      }
    }
    console.log(`   Total: ${results.duplicateComponents.size} duplicate component names\n`);
  } else {
    console.log('✅ No duplicate components found\n');
  }
  
  // Deprecated patterns
  if (results.deprecatedPatterns.length > 0) {
    console.log('⚠️  DEPRECATED PATTERNS (Update or remove):');
    const groupedPatterns = new Map();
    
    for (const item of results.deprecatedPatterns) {
      if (!groupedPatterns.has(item.pattern)) {
        groupedPatterns.set(item.pattern, []);
      }
      groupedPatterns.get(item.pattern).push(item.file);
    }
    
    for (const [pattern, files] of groupedPatterns.entries()) {
      console.log(`   ⚠️  ${pattern}:`);
      for (const file of files) {
        console.log(`      📄 ${file}`);
      }
    }
    console.log(`   Total: ${results.deprecatedPatterns.length} deprecated pattern usages\n`);
  } else {
    console.log('✅ No deprecated patterns found\n');
  }
  
  // Summary
  console.log('📈 SUMMARY:');
  console.log(`   📁 Total files scanned: ${results.allFiles.size}`);
  console.log(`   🗑️  Unused files: ${results.unusedFiles.size}`);
  console.log(`   📤 Files with unused exports: ${results.unusedExports.size}`);
  console.log(`   👥 Duplicate components: ${results.duplicateComponents.size}`);
  console.log(`   ⚠️  Files with deprecated patterns: ${new Set(results.deprecatedPatterns.map(p => p.file)).size}`);
  
  const totalIssues = results.unusedFiles.size + results.unusedExports.size + 
                     results.duplicateComponents.size + results.deprecatedPatterns.length;
  
  if (totalIssues === 0) {
    console.log('\n🎉 Codebase is clean! No unused code found.');
  } else {
    console.log(`\n🧹 Found ${totalIssues} cleanup opportunities.`);
  }
}

// Run the analysis
analyzeUnusedCode().catch(error => {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
});
