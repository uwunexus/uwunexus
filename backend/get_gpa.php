<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing user_id"]);
    exit();
}

$user_id = intval($_GET['user_id']);
$degree_override = isset($_GET['degree_override']) ? strtoupper(trim($_GET['degree_override'])) : null;

try {
    // Get requester info including specialization
    $stmt = $pdo->prepare("SELECT degree, specialization, enrollment_number, batch, role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit();
    }

    $is_superadmin = $user['role'] === 'superadmin';

    // If superadmin and requesting all degrees list
    if ($is_superadmin && isset($_GET['list_degrees'])) {
        $degrees = $pdo->query("SELECT degree_code, degree_name FROM degrees ORDER BY degree_code")->fetchAll();
        echo json_encode(["success" => true, "degrees" => $degrees]);
        exit();
    }

    // Determine degree to use
    $needs_specialization = false;
    $base_degree_fallback = null; // for years 1-2 when specialization not yet selected

    if ($is_superadmin && $degree_override) {
        $degree_code = $degree_override;
        $preview_mode = true;
    } else {
        $raw_degree = strtoupper($user['degree']);
        $spec       = $user['specialization'] ? strtoupper($user['specialization']) : null;
        $preview_mode = false;

        // Resolve compound degrees (MRT → MRT-MPT or MRT-WST, SCT → SCT-*)
        $base_specs = [
            'MRT' => ['MPT' => 'MRT-MPT', 'WST' => 'MRT-WST'],
            'SCT' => ['FEB' => 'SCT-FEB', 'MST' => 'SCT-MST', 'MEC' => 'SCT-MEC'],
        ];
        $base_fallbacks = [
            'MRT' => 'MRT-MPT', // Y1-Y2 are identical, use MPT as proxy
            'SCT' => 'SCT-FEB', // Y1-Y2 are identical, use FEB as proxy
        ];

        if (isset($base_specs[$raw_degree])) {
            if ($spec && isset($base_specs[$raw_degree][$spec])) {
                // Specialization already selected → full curriculum
                $degree_code = $base_specs[$raw_degree][$spec];
            } else {
                // No specialization yet → load years 1-2 only from fallback degree
                $degree_code = $base_fallbacks[$raw_degree];
                $base_degree_fallback = $raw_degree;
                $needs_specialization = true;
            }
        } else {
            $degree_code = $raw_degree;
        }
    }

    // Allowed for normal users (Faculty of Applied Sciences only)
    $allowed_prefixes = ['IIT', 'CST', 'MRT', 'SCT'];
    if (!$is_superadmin) {
        $allowed = false;
        foreach ($allowed_prefixes as $prefix) {
            if (str_starts_with($degree_code, $prefix)) { $allowed = true; break; }
        }
        if (!$allowed || $degree_code === 'STAFF') {
            http_response_code(403);
            echo json_encode([
                "success" => false, "not_eligible" => true,
                "message" => "The Smart GPA Calculator is currently available only for Faculty of Applied Sciences students (IIT, CST, MRT, SCT)."
            ]);
            exit();
        }
    }

    // Get degree record
    $stmt = $pdo->prepare("SELECT * FROM degrees WHERE degree_code = ?");
    $stmt->execute([$degree_code]);
    $degree = $stmt->fetch();

    if (!$degree) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Degree programme '$degree_code' not found in database"]);
        exit();
    }

    // Curriculum — limit to years 1-2 if specialization not yet chosen
    $year_filter = $needs_specialization ? "AND cg.academic_year <= 2" : "";
    $stmt = $pdo->prepare("
        SELECT
            cg.id AS group_id, cg.academic_year, cg.semester,
            cg.group_type, cg.group_name, cg.min_credits_required,
            m.id AS module_id, m.module_code, m.module_name,
            m.credits, m.is_gpa, cm.is_mandatory
        FROM curriculum_groups cg
        JOIN curriculum_modules cm ON cm.group_id = cg.id
        JOIN modules m ON m.id = cm.module_id
        WHERE cg.degree_id = ? $year_filter
        ORDER BY cg.academic_year, cg.semester, cg.group_type, m.module_code
    ");
    $stmt->execute([$degree['id']]);
    $rows = $stmt->fetchAll();

    // Grades — in preview mode, use no grades; otherwise load user's grades
    $grades = [];
    if (!$preview_mode) {
        $stmt = $pdo->prepare("
            SELECT ug.module_id, ug.grade, ug.gpv, ug.academic_year, ug.semester, ug.attempt_number
            FROM user_grades ug
            WHERE ug.user_id = ? AND ug.is_best_grade = 1
        ");
        $stmt->execute([$user_id]);
        foreach ($stmt->fetchAll() as $g) $grades[$g['module_id']] = $g;
    }

    // GPA summary — only for real student view
    $gpa_summary = ["current_gpa" => 0, "total_gpa_credits" => 0, "modules_completed" => 0, "degree_class" => "Not Enough Data"];
    if (!$preview_mode) {
        $stmt = $pdo->prepare("
            SELECT ROUND(SUM(m.credits * ug.gpv) / NULLIF(SUM(m.credits), 0), 2) AS current_gpa,
                   SUM(m.credits) AS total_gpa_credits, COUNT(ug.id) AS modules_completed
            FROM user_grades ug
            JOIN modules m ON m.id = ug.module_id
            WHERE ug.user_id = ? AND ug.is_best_grade = 1 AND m.is_gpa = 1
        ");
        $stmt->execute([$user_id]);
        $s = $stmt->fetch();
        $gpa = (float)($s['current_gpa'] ?? 0);
        if ($gpa >= 3.70)     $class = 'First Class Honours';
        elseif ($gpa >= 3.30) $class = 'Second Class Upper Division';
        elseif ($gpa >= 3.00) $class = 'Second Class Lower Division';
        elseif ($gpa >= 2.00) $class = 'General Pass';
        elseif ($gpa > 0)     $class = 'Below Minimum';
        else                   $class = 'Not Enough Data';
        $gpa_summary = ["current_gpa" => $gpa, "total_gpa_credits" => (int)($s['total_gpa_credits'] ?? 0), "modules_completed" => (int)($s['modules_completed'] ?? 0), "degree_class" => $class];
    }

    // Build curriculum structure
    $curriculum = [];
    foreach ($rows as $row) {
        $yr = $row['academic_year']; $sem = $row['semester']; $gid = $row['group_id'];
        if (!isset($curriculum[$yr])) $curriculum[$yr] = [];
        if (!isset($curriculum[$yr][$sem])) $curriculum[$yr][$sem] = [];
        if (!isset($curriculum[$yr][$sem][$gid])) {
            $curriculum[$yr][$sem][$gid] = [
                'group_id' => $gid, 'group_type' => $row['group_type'],
                'group_name' => $row['group_name'], 'min_credits_required' => $row['min_credits_required'],
                'modules' => []
            ];
        }
        $g = $grades[$row['module_id']] ?? null;
        $curriculum[$yr][$sem][$gid]['modules'][] = [
            'module_id' => $row['module_id'], 'module_code' => $row['module_code'],
            'module_name' => $row['module_name'], 'credits' => $row['credits'],
            'is_gpa' => $row['is_gpa'], 'is_mandatory' => $row['is_mandatory'],
            'grade' => $g ? $g['grade'] : null, 'gpv' => $g ? $g['gpv'] : null,
        ];
    }

    // Specialization options for selection prompt
    $spec_options = [];
    $raw_deg = strtoupper($user['degree'] ?? '');
    if (in_array($raw_deg, ['MRT', 'SCT'])) {
        $map = [
            'MRT' => [['code'=>'MPT','label'=>'Mineral Processing Technology'],['code'=>'WST','label'=>'Water Science and Technology']],
            'SCT' => [['code'=>'FEB','label'=>'Food Engineering & Bioprocess Technology'],['code'=>'MST','label'=>'Material Science and Technology'],['code'=>'MEC','label'=>'Mechatronics']],
        ];
        $spec_options = $map[$raw_deg] ?? [];
        if (!$base_degree_fallback) $base_degree_fallback = $raw_deg;
    }

    echo json_encode([
        "success"              => true,
        "preview_mode"         => $preview_mode,
        "is_superadmin"        => $is_superadmin,
        "needs_specialization" => $needs_specialization,
        "base_degree"          => $base_degree_fallback,
        "spec_options"         => $spec_options,
        "user"                 => ["degree_code" => $degree_code, "degree_name" => $degree['degree_name'], "enrollment_number" => $user['enrollment_number'], "batch" => $user['batch'], "raw_degree" => strtoupper($user['degree'])],
        "gpa_summary"          => $gpa_summary,
        "curriculum"           => $curriculum,
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
