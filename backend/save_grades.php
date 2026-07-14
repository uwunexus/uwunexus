<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['grades']) || !is_array($data['grades'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing fields"]);
    exit();
}

$user_id = intval($data['user_id']);
$grades  = $data['grades']; // Array of { module_id, academic_year, semester, grade, gpv }

// GPV map
$GPV_MAP = [
    'A+' => 4.00, 'A' => 4.00, 'A-' => 3.70,
    'B+' => 3.30, 'B' => 3.00, 'B-' => 2.70,
    'C+' => 2.30, 'C' => 2.00, 'C-' => 1.70,
    'D+' => 1.30, 'D' => 1.00, 'E'  => 0.00,
];

try {
    // Verify user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit();
    }

    $pdo->beginTransaction();

    foreach ($grades as $entry) {
        $module_id    = intval($entry['module_id']);
        $academic_year = intval($entry['academic_year']);
        $semester     = intval($entry['semester']);
        $grade        = strtoupper(trim($entry['grade']));

        if (!isset($GPV_MAP[$grade])) {
            // Empty grade ("") means user cleared it → delete all records for this module
            if ($grade === '') {
                $pdo->prepare("DELETE FROM user_grades WHERE user_id = ? AND module_id = ?")
                    ->execute([$user_id, $module_id]);
            }
            continue; // skip invalid/non-empty non-grade values
        }

        $gpv = $GPV_MAP[$grade];

        // Check existing best grade
        $stmt = $pdo->prepare("
            SELECT id, grade, gpv, attempt_number FROM user_grades
            WHERE user_id = ? AND module_id = ? AND is_best_grade = 1
        ");
        $stmt->execute([$user_id, $module_id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            // First attempt
            $stmt = $pdo->prepare("
                INSERT INTO user_grades (user_id, module_id, academic_year, semester, grade, gpv, attempt_number, is_best_grade)
                VALUES (?, ?, ?, ?, ?, ?, 1, 1)
            ");
            $stmt->execute([$user_id, $module_id, $academic_year, $semester, $grade, $gpv]);
        } else {
            // Same grade unchanged — skip
            if ($existing['grade'] === $grade) continue;

            // Is this a simple correction/edit of the existing best grade?
            // If the best grade is already a passing grade (GPV >= 2.00), they cannot repeat it.
            // Any change is simply a correction to the grade.
            if ($existing['gpv'] >= 2.00) {
                $stmt = $pdo->prepare("
                    UPDATE user_grades 
                    SET grade = ?, gpv = ? 
                    WHERE id = ?
                ");
                $stmt->execute([$grade, $gpv, $existing['id']]);
            } else {
                // It is a repeat attempt (since previous best was a fail/weak pass < 2.00)
                $new_attempt = $existing['attempt_number'] + 1;
                if ($new_attempt > 3) continue; // max 3 attempts

                // Cap repeat grade at C (gpv 2.00)
                $capped_gpv   = min($gpv, 2.00);
                $capped_grade = $grade;
                if ($gpv > 2.00) { 
                    $capped_gpv = 2.00; 
                    $capped_grade = 'C'; 
                } // Cap repeat grade at C (gpv 2.00) if they got a better grade

                $is_best_grade = 0;
                if ($capped_gpv > $existing['gpv']) {
                    $is_best_grade = 1;
                    // Mark old as not best
                    $pdo->prepare("UPDATE user_grades SET is_best_grade = 0 WHERE user_id = ? AND module_id = ?")->execute([$user_id, $module_id]);
                }

                // Check if this attempt number already exists to avoid Duplicate Key Violation
                $stmt = $pdo->prepare("SELECT id FROM user_grades WHERE user_id = ? AND module_id = ? AND attempt_number = ?");
                $stmt->execute([$user_id, $module_id, $new_attempt]);
                $dup = $stmt->fetch();

                if ($dup) {
                    // Update the existing attempt instead of inserting
                    $stmt = $pdo->prepare("
                        UPDATE user_grades 
                        SET grade = ?, gpv = ?, is_best_grade = ?, academic_year = ?, semester = ? 
                        WHERE id = ?
                    ");
                    $stmt->execute([$capped_grade, $capped_gpv, $is_best_grade, $academic_year, $semester, $dup['id']]);
                } else {
                    // Insert new attempt
                    $stmt = $pdo->prepare("
                        INSERT INTO user_grades (user_id, module_id, academic_year, semester, grade, gpv, attempt_number, is_best_grade)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([$user_id, $module_id, $academic_year, $semester, $capped_grade, $capped_gpv, $new_attempt, $is_best_grade]);
                }
            }
        }
    }

    $pdo->commit();

    // Return updated GPA
    $stmt = $pdo->prepare("
        SELECT ROUND(SUM(m.credits * ug.gpv) / NULLIF(SUM(m.credits), 0), 2) AS current_gpa,
               SUM(m.credits) AS total_gpa_credits,
               COUNT(ug.id)   AS modules_completed
        FROM user_grades ug
        JOIN modules m ON m.id = ug.module_id
        WHERE ug.user_id = ? AND ug.is_best_grade = 1 AND m.is_gpa = 1
    ");
    $stmt->execute([$user_id]);
    $summary = $stmt->fetch();

    $gpa = (float)($summary['current_gpa'] ?? 0);
    if ($gpa >= 3.70)     $class = 'First Class';
    elseif ($gpa >= 3.30) $class = 'Second Class Upper';
    elseif ($gpa >= 3.00) $class = 'Second Class Lower';
    elseif ($gpa >= 2.00) $class = 'General Pass';
    elseif ($gpa > 0)     $class = 'Academic Probation';
    else                   $class = 'Not Enough Data';

    echo json_encode([
        "success" => true,
        "message" => "Grades saved successfully",
        "gpa_summary" => [
            "current_gpa"       => $gpa,
            "total_gpa_credits" => (int)($summary['total_gpa_credits'] ?? 0),
            "modules_completed" => (int)($summary['modules_completed'] ?? 0),
            "degree_class"      => $class,
        ]
    ]);

} catch (\PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
