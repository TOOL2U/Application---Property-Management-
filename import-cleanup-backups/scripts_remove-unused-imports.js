#!/usr/bin/env node

/**
 * Remove Unused Imports Script
 * Scans and removes unused import statements, variables, and props
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Removing Unused Imports and Variables');
console.log('=========================================\n');

// Configuration
const config = {
  sourceExtensions: ['.tsx', '.ts', '.js', '.jsx'],
  excludeDirs: ['node_modules', '.git', '.expo', 'dist', 'build', '__tests__', 'cleanup-backups'],
  backupDir: 'import-cleanup-backups'
};

// Statistics
let processedFiles = 0;
let modifiedFiles = 0;
let removedImports = 0;
let removedVariables = 0;

/**
 * Get all source files
 */
function getAllSourceFiles(dir, files = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      if (entry.isDirectory() && !config.excludeDirs.some(exclude => 
        relativePath.includes(exclude) || entry.name.startsWith('.')
      )) {
        getAllSourceFiles(fullPath, files);
      } else if (entry.isFile() && config.sourceExtensions.some(ext => 
        entry.name.endsWith(ext)
      )) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Extract imports from file content
 */
function extractImports(content) {
  const imports = [];
  const importRegex = /^import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"][^'"]+['"];?$/gm;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return imports;
}

/**
 * Check if an imported item is used in the code
 */
function isImportUsed(importName, content, importStatement) {
  // Skip checking the import statement itself
  const contentWithoutImports = content.replace(/^import.*$/gm, '');
  
  // Common patterns to check
  const patterns = [
    new RegExp(`\\b${importName}\\b`, 'g'), // Direct usage
    new RegExp(`${importName}\\.`, 'g'), // Property access
    new RegExp(`<${importName}`, 'g'), // JSX component
    new RegExp(`${importName}\\(`, 'g'), // Function call
    new RegExp(`extends\\s+${importName}`, 'g'), // Class extension
    new RegExp(`implements\\s+${importName}`, 'g'), // Interface implementation
    new RegExp(`:\\s*${importName}`, 'g'), // Type annotation
    new RegExp(`as\\s+${importName}`, 'g') // Type assertion
  ];
  
  return patterns.some(pattern => pattern.test(contentWithoutImports));
}

/**
 * Parse import statement to extract imported items
 */
function parseImportStatement(importStatement) {
  const items = [];
  
  // Default import: import Something from 'module'
  const defaultMatch = importStatement.match(/import\s+(\w+)\s+from/);
  if (defaultMatch) {
    items.push({ name: defaultMatch[1], type: 'default' });
  }
  
  // Named imports: import { a, b, c } from 'module'
  const namedMatch = importStatement.match(/import\s+\{([^}]+)\}/);
  if (namedMatch) {
    const namedImports = namedMatch[1].split(',').map(item => {
      const trimmed = item.trim();
      const asMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
      if (asMatch) {
        return { name: asMatch[2], originalName: asMatch[1], type: 'named' };
      }
      return { name: trimmed, type: 'named' };
    });
    items.push(...namedImports);
  }
  
  // Namespace import: import * as Something from 'module'
  const namespaceMatch = importStatement.match(/import\s+\*\s+as\s+(\w+)/);
  if (namespaceMatch) {
    items.push({ name: namespaceMatch[1], type: 'namespace' });
  }
  
  return items;
}

/**
 * Remove unused imports from content
 */
function removeUnusedImports(content) {
  const imports = extractImports(content);
  let modifiedContent = content;
  let removedCount = 0;
  
  // Process imports in reverse order to maintain indices
  for (let i = imports.length - 1; i >= 0; i--) {
    const importInfo = imports[i];
    const importStatement = importInfo.fullMatch;
    
    // Skip side-effect imports (import 'module')
    if (!importStatement.includes('from')) {
      continue;
    }
    
    const importedItems = parseImportStatement(importStatement);
    const usedItems = [];
    
    // Check which items are actually used
    for (const item of importedItems) {
      if (isImportUsed(item.name, content, importStatement)) {
        usedItems.push(item);
      }
    }
    
    // If no items are used, remove the entire import
    if (usedItems.length === 0) {
      const beforeImport = modifiedContent.substring(0, importInfo.startIndex);
      const afterImport = modifiedContent.substring(importInfo.endIndex);
      
      // Remove the import line and any trailing newline
      let replacement = '';
      if (afterImport.startsWith('\n')) {
        modifiedContent = beforeImport + afterImport.substring(1);
      } else {
        modifiedContent = beforeImport + afterImport;
      }
      
      removedCount++;
      console.log(`   ❌ Removed unused import: ${importStatement.trim()}`);
    }
    // If some items are used, reconstruct the import with only used items
    else if (usedItems.length < importedItems.length) {
      const moduleMatch = importStatement.match(/from\s+['"]([^'"]+)['"]/);
      if (moduleMatch) {
        const moduleName = moduleMatch[1];
        let newImportStatement = 'import ';
        
        const defaultItems = usedItems.filter(item => item.type === 'default');
        const namedItems = usedItems.filter(item => item.type === 'named');
        const namespaceItems = usedItems.filter(item => item.type === 'namespace');
        
        const parts = [];
        
        if (defaultItems.length > 0) {
          parts.push(defaultItems[0].name);
        }
        
        if (namedItems.length > 0) {
          const namedPart = '{ ' + namedItems.map(item => 
            item.originalName && item.originalName !== item.name 
              ? `${item.originalName} as ${item.name}` 
              : item.name
          ).join(', ') + ' }';
          parts.push(namedPart);
        }
        
        if (namespaceItems.length > 0) {
          parts.push(`* as ${namespaceItems[0].name}`);
        }
        
        newImportStatement += parts.join(', ') + ` from '${moduleName}';`;
        
        const beforeImport = modifiedContent.substring(0, importInfo.startIndex);
        const afterImport = modifiedContent.substring(importInfo.endIndex);
        modifiedContent = beforeImport + newImportStatement + afterImport;
        
        console.log(`   🔧 Modified import: ${newImportStatement}`);
      }
    }
  }
  
  return { content: modifiedContent, removedCount };
}

/**
 * Remove unused variables (basic detection)
 */
function removeUnusedVariables(content) {
  let modifiedContent = content;
  let removedCount = 0;
  
  // Find variable declarations
  const variableRegex = /(?:const|let|var)\s+(\w+)\s*=/g;
  const variables = [];
  
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    variables.push({
      name: match[1],
      fullMatch: match[0],
      startIndex: match.index
    });
  }
  
  // Check if variables are used
  for (const variable of variables) {
    const usageRegex = new RegExp(`\\b${variable.name}\\b`, 'g');
    const matches = content.match(usageRegex) || [];
    
    // If variable is only mentioned once (in its declaration), it's unused
    if (matches.length === 1) {
      // Find the full line containing the variable declaration
      const lines = content.split('\n');
      let lineIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(variable.fullMatch)) {
          lineIndex = i;
          break;
        }
      }
      
      if (lineIndex !== -1) {
        // Remove the line if it only contains the variable declaration
        const line = lines[lineIndex].trim();
        if (line.startsWith('const ') || line.startsWith('let ') || line.startsWith('var ')) {
          lines.splice(lineIndex, 1);
          modifiedContent = lines.join('\n');
          removedCount++;
          console.log(`   ❌ Removed unused variable: ${variable.name}`);
        }
      }
    }
  }
  
  return { content: modifiedContent, removedCount };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = originalContent;
    let fileModified = false;
    let fileRemovedImports = 0;
    let fileRemovedVariables = 0;
    
    console.log(`📄 Processing: ${path.relative(process.cwd(), filePath)}`);
    
    // Remove unused imports
    const importResult = removeUnusedImports(modifiedContent);
    modifiedContent = importResult.content;
    fileRemovedImports = importResult.removedCount;
    
    // Remove unused variables (basic detection)
    const variableResult = removeUnusedVariables(modifiedContent);
    modifiedContent = variableResult.content;
    fileRemovedVariables = variableResult.removedCount;
    
    // Check if file was modified
    if (modifiedContent !== originalContent) {
      // Create backup
      const backupDir = config.backupDir;
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const relativePath = path.relative(process.cwd(), filePath);
      const backupPath = path.join(backupDir, relativePath.replace(/[\/\\]/g, '_'));
      fs.writeFileSync(backupPath, originalContent);
      
      // Write modified content
      fs.writeFileSync(filePath, modifiedContent);
      
      fileModified = true;
      modifiedFiles++;
      removedImports += fileRemovedImports;
      removedVariables += fileRemovedVariables;
      
      console.log(`   ✅ Modified (${fileRemovedImports} imports, ${fileRemovedVariables} variables removed)`);
    } else {
      console.log(`   ✅ No changes needed`);
    }
    
    processedFiles++;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main cleanup function
 */
function performImportCleanup() {
  console.log('🔍 Scanning for source files...');
  const sourceFiles = getAllSourceFiles(process.cwd());
  
  // Filter out files that were marked as unused
  const activeFiles = sourceFiles.filter(file => {
    const relativePath = path.relative(process.cwd(), file);
    return !relativePath.includes('cleanup-backups') && 
           !relativePath.includes('import-cleanup-backups');
  });
  
  console.log(`📁 Found ${activeFiles.length} source files to process\n`);
  
  // Process each file
  for (const filePath of activeFiles) {
    processFile(filePath);
  }
  
  // Generate report
  console.log('\n📊 IMPORT CLEANUP REPORT');
  console.log('=========================');
  console.log(`📁 Files processed: ${processedFiles}`);
  console.log(`🔧 Files modified: ${modifiedFiles}`);
  console.log(`❌ Unused imports removed: ${removedImports}`);
  console.log(`❌ Unused variables removed: ${removedVariables}`);
  
  if (modifiedFiles > 0) {
    console.log('\n🎉 IMPORT CLEANUP SUCCESSFUL!');
    console.log(`   Modified ${modifiedFiles} files`);
    console.log(`   Removed ${removedImports} unused imports`);
    console.log(`   Removed ${removedVariables} unused variables`);
    console.log('   Backups created in ./import-cleanup-backups/');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Test your app to ensure nothing is broken');
    console.log('   2. Run: npm run lint (to check for any issues)');
    console.log('   3. If everything works, delete ./import-cleanup-backups/');
    console.log('   4. Commit the cleanup changes');
  } else {
    console.log('\n✅ No unused imports or variables found!');
  }
}

// Run the cleanup
performImportCleanup();
