<?php
require 'db.php';

try {
    $pdo->exec("
        ALTER TABLE users 
        ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN verification_token VARCHAR(255) NULL,
        ADD COLUMN reset_token VARCHAR(255) NULL,
        ADD COLUMN reset_token_expires_at DATETIME NULL;
    ");
    
    // Set existing users to verified to avoid locking them out
    $pdo->exec("UPDATE users SET is_verified = TRUE");

    echo "Authentication columns added and existing users verified.\n";

} catch (\PDOException $e) {
    echo "Error migrating auth: " . $e->getMessage() . "\n";
}
?>
