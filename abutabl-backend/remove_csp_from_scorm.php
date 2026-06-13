<?php
/**
 * Script to remove Content-Security-Policy meta tags from SCORM HTML index files
 * 
 * This script searches for all SCORM HTML index files (index.html, index_lms.html, story.html)
 * in the public/scrom directory and removes CSP meta tags that block JavaScript execution.
 */

// Base directory for SCORM files
$baseDir = __DIR__ . '/public/scrom';

// HTML index file names to search for
$indexFiles = ['index.html', 'index_lms.html', 'story.html'];

// Counter for processed files
$processedCount = 0;
$removedCount = 0;
$errorCount = 0;

/**
 * Recursively find and process SCORM HTML index files
 */
function processScormFiles($dir, $indexFiles, &$processedCount, &$removedCount, &$errorCount) {
    if (!is_dir($dir)) {
        echo "Directory does not exist: $dir\n";
        return;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && in_array($file->getFilename(), $indexFiles)) {
            $filePath = $file->getRealPath();
            processHtmlFile($filePath, $processedCount, $removedCount, $errorCount);
        }
    }
}

/**
 * Process a single HTML file to remove CSP meta tags
 */
function processHtmlFile($filePath, &$processedCount, &$removedCount, &$errorCount) {
    $processedCount++;
    
    echo "Processing: $filePath\n";
    
    // Read the file content
    $content = file_get_contents($filePath);
    
    if ($content === false) {
        echo "  ERROR: Could not read file\n";
        $errorCount++;
        return;
    }
    
    $originalContent = $content;
    
    // Comprehensive pattern to match CSP meta tags (case-insensitive)
    // Matches: <meta http-equiv="Content-Security-Policy" ...>
    // Handles variations like single/double quotes, different spacing, etc.
    // This pattern matches the entire meta tag from <meta to >
    $cspPattern = '/<meta[^>]*http-equiv\s*=\s*["\']Content-Security-Policy["\'][^>]*>/i';
    
    // Check if CSP tag exists
    if (preg_match($cspPattern, $content)) {
        // Create backup file
        $backupPath = $filePath . '.backup.' . date('Y-m-d_His');
        if (file_put_contents($backupPath, $originalContent) === false) {
            echo "  WARNING: Could not create backup file\n";
        } else {
            echo "  Backup created: " . basename($backupPath) . "\n";
        }
        
        // Remove all CSP meta tags (in case there are multiple)
        $content = preg_replace($cspPattern, '', $content);
        
        // Clean up any extra whitespace/newlines that might be left
        $content = preg_replace('/\n\s*\n\s*\n/', "\n\n", $content);
        
        // Write the modified content back to the file
        if (file_put_contents($filePath, $content) !== false) {
            echo "  ✓ CSP meta tag removed successfully\n";
            $removedCount++;
        } else {
            echo "  ERROR: Could not write to file\n";
            $errorCount++;
            
            // Restore from backup if write failed
            if (file_exists($backupPath)) {
                copy($backupPath, $filePath);
                echo "  Restored from backup\n";
            }
        }
    } else {
        echo "  - No CSP meta tag found (or already removed)\n";
    }
}

// Main execution
echo "========================================\n";
echo "SCORM CSP Removal Script\n";
echo "========================================\n\n";

echo "Searching for SCORM HTML index files in: $baseDir\n\n";

// Process content directory
if (is_dir($baseDir . '/content')) {
    echo "Processing content directory...\n";
    processScormFiles($baseDir . '/content', $indexFiles, $processedCount, $removedCount, $errorCount);
}

// Process games directory
if (is_dir($baseDir . '/games')) {
    echo "\nProcessing games directory...\n";
    processScormFiles($baseDir . '/games', $indexFiles, $processedCount, $removedCount, $errorCount);
}

// Summary
echo "\n========================================\n";
echo "Summary\n";
echo "========================================\n";
echo "Total files processed: $processedCount\n";
echo "Files with CSP removed: $removedCount\n";
echo "Errors encountered: $errorCount\n";
echo "========================================\n";

