/**
 * ESLint Configuration for Code Cleanup
 * Enforces rules to prevent unused code and maintain clean codebase
 */

module.exports = {
  extends: [
    '@expo/eslint-config',
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'unused-imports'
  ],
  rules: {
    // Unused code detection
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }
    ],
    
    // Unused imports
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        'vars': 'all',
        'varsIgnorePattern': '^_',
        'args': 'after-used',
        'argsIgnorePattern': '^_'
      }
    ],
    
    // Import organization
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    
    // Prevent duplicate imports
    'import/no-duplicates': 'error',
    
    // React specific cleanup rules
    'react/jsx-no-unused-vars': 'error',
    'react/no-unused-prop-types': 'error',
    'react/no-unused-state': 'error',
    
    // React Hooks cleanup
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // TypeScript specific cleanup
    '@typescript-eslint/no-unused-expressions': 'error',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-empty-interface': 'error',
    
    // General code quality
    'no-console': 'warn', // Allow console but warn
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-unreachable': 'error',
    'no-dead-code': 'error',
    
    // Deprecated patterns
    'no-var': 'error', // Use const/let instead
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    
    // React Native specific
    'react-native/no-unused-styles': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    
    // Performance
    'react/jsx-no-bind': 'warn',
    'react/jsx-no-literals': 'off', // Allow literals for now
    
    // Accessibility
    'react-native/no-raw-text': 'off', // Allow for now
    
    // Code complexity
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', 100],
    
    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'interface',
        'format': ['PascalCase'],
        'prefix': ['I']
      },
      {
        'selector': 'typeAlias',
        'format': ['PascalCase']
      },
      {
        'selector': 'enum',
        'format': ['PascalCase']
      }
    ]
  },
  
  // Environment settings
  env: {
    'react-native/react-native': true,
    'es6': true,
    'node': true
  },
  
  // Parser options
  parserOptions: {
    'ecmaVersion': 2021,
    'sourceType': 'module',
    'ecmaFeatures': {
      'jsx': true
    }
  },
  
  // Settings
  settings: {
    'react': {
      'version': 'detect'
    },
    'react-native/style-sheet-object-names': [
      'StyleSheet',
      'styles'
    ]
  },
  
  // Override for specific file patterns
  overrides: [
    {
      // More lenient rules for test files
      files: ['**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**/*'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-console': 'off'
      }
    },
    {
      // Stricter rules for service files
      files: ['**/services/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        'complexity': ['error', 8],
        'max-lines-per-function': ['error', 80]
      }
    },
    {
      // Component-specific rules
      files: ['**/components/**/*.{ts,tsx}'],
      rules: {
        'react/jsx-no-bind': 'error',
        'react/no-unused-prop-types': 'error'
      }
    }
  ],
  
  // Ignore patterns
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '*.config.js',
    'cleanup-backups/',
    'import-cleanup-backups/',
    'scripts/analyze-unused-code.js'
  ]
};
