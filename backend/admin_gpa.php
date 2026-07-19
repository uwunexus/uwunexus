<?php
require_once 'db.php';

// Check superadmin
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? '';

// ── GET handlers ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // List all modules (with optional search)
    if ($action === 'modules') {
        $search = $_GET['search'] ?? '';
        $degree_id = $_GET['degree_id'] ?? null;

        if ($degree_id) {
            $stmt = $pdo->prepare("
                SELECT m.id, m.module_code, m.module_name, m.credits, m.is_gpa,
                       cg.id as group_id, cg.group_name, cg.group_type,
                       cg.academic_year, cg.semester, cg.degree_id,
                       cm.is_mandatory,
                       d.degree_code
                FROM modules m
                JOIN curriculum_modules cm ON cm.module_id = m.id
                JOIN curriculum_groups cg ON cg.id = cm.group_id
                JOIN degrees d ON d.id = cg.degree_id
                WHERE cg.degree_id = ?
                " . ($search ? "AND (m.module_code LIKE ? OR m.module_name LIKE ?)" : "") . "
                ORDER BY cg.academic_year, cg.semester, cg.group_type, m.module_code
            ");
            if ($search) {
                $s = "%$search%";
                $stmt->execute([$degree_id, $s, $s]);
            } else {
                $stmt->execute([$degree_id]);
            }
        } else {
            $stmt = $pdo->prepare("
                SELECT m.id, m.module_code, m.module_name, m.credits, m.is_gpa
                FROM modules m
                " . ($search ? "WHERE m.module_code LIKE ? OR m.module_name LIKE ?" : "") . "
                ORDER BY m.module_code
                LIMIT 200
            ");
            if ($search) {
                $s = "%$search%";
                $stmt->execute([$s, $s]);
            } else {
                $stmt->execute();
            }
        }
        echo json_encode(['success' => true, 'modules' => $stmt->fetchAll()]);
        exit;
    }

    // List all degrees
    if ($action === 'degrees') {
        $stmt = $pdo->query("SELECT id, degree_code, degree_name FROM degrees ORDER BY degree_code");
        echo json_encode(['success' => true, 'degrees' => $stmt->fetchAll()]);
        exit;
    }

    // List curriculum groups for a degree
    if ($action === 'groups') {
        $degree_id = $_GET['degree_id'] ?? null;
        if (!$degree_id) { echo json_encode(['success' => false, 'message' => 'degree_id required']); exit; }
        $stmt = $pdo->prepare("
            SELECT cg.id, cg.academic_year, cg.semester, cg.group_type, cg.group_name, cg.min_credits_required,
                   COUNT(cm.module_id) as module_count
            FROM curriculum_groups cg
            LEFT JOIN curriculum_modules cm ON cm.group_id = cg.id
            WHERE cg.degree_id = ?
            GROUP BY cg.id
            ORDER BY cg.academic_year, cg.semester, cg.group_type
        ");
        $stmt->execute([$degree_id]);
        echo json_encode(['success' => true, 'groups' => $stmt->fetchAll()]);
        exit;
    }

    // Modules in a specific group
    if ($action === 'group_modules') {
        $group_id = $_GET['group_id'] ?? null;
        if (!$group_id) { echo json_encode(['success' => false, 'message' => 'group_id required']); exit; }
        $stmt = $pdo->prepare("
            SELECT m.id, m.module_code, m.module_name, m.credits, m.is_gpa, cm.is_mandatory
            FROM modules m
            JOIN curriculum_modules cm ON cm.module_id = m.id
            WHERE cm.group_id = ?
            ORDER BY m.module_code
        ");
        $stmt->execute([$group_id]);
        echo json_encode(['success' => true, 'modules' => $stmt->fetchAll()]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
    exit;
}

// ── POST handlers ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Update module fields (credits, is_gpa, module_name, module_code)
    if ($action === 'update_module') {
        $id = $input['id'] ?? null;
        if (!$id) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }

        $fields = [];
        $vals   = [];

        if (isset($input['module_code'])) { $fields[] = 'module_code = ?'; $vals[] = trim($input['module_code']); }
        if (isset($input['module_name'])) { $fields[] = 'module_name = ?'; $vals[] = trim($input['module_name']); }
        if (isset($input['credits']))     { $fields[] = 'credits = ?';     $vals[] = floatval($input['credits']); }
        if (isset($input['is_gpa']))      { $fields[] = 'is_gpa = ?';      $vals[] = intval($input['is_gpa']); }

        if (empty($fields)) { echo json_encode(['success' => false, 'message' => 'Nothing to update']); exit; }

        $vals[] = $id;
        $stmt = $pdo->prepare("UPDATE modules SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($vals);
        echo json_encode(['success' => true, 'message' => 'Module updated']);
        exit;
    }

    // Add new module and optionally assign to a group
    if ($action === 'add_module') {
        $code     = trim($input['module_code'] ?? '');
        $name     = trim($input['module_name'] ?? '');
        $credits  = floatval($input['credits'] ?? 0);
        $is_gpa   = intval($input['is_gpa'] ?? 1);
        $group_id = $input['group_id'] ?? null;
        $is_mandatory = intval($input['is_mandatory'] ?? 1);

        if (!$code || !$name || $credits <= 0) {
            echo json_encode(['success' => false, 'message' => 'module_code, module_name and credits are required']); exit;
        }

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO modules (module_code, module_name, credits, is_gpa) VALUES (?, ?, ?, ?)");
            $stmt->execute([$code, $name, $credits, $is_gpa]);
            $new_id = $pdo->lastInsertId();

            if ($group_id) {
                $stmt2 = $pdo->prepare("INSERT INTO curriculum_modules (group_id, module_id, is_mandatory) VALUES (?, ?, ?)");
                $stmt2->execute([$group_id, $new_id, $is_mandatory]);
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Module added', 'id' => $new_id]);
        } catch (\PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    // Delete module (removes from curriculum_modules too)
    if ($action === 'delete_module') {
        $id = $input['id'] ?? null;
        if (!$id) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }
        $pdo->prepare("DELETE FROM curriculum_modules WHERE module_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM modules WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Module deleted']);
        exit;
    }

    // Remove module from a specific group (but keep the module)
    if ($action === 'remove_from_group') {
        $module_id = $input['module_id'] ?? null;
        $group_id  = $input['group_id'] ?? null;
        if (!$module_id || !$group_id) { echo json_encode(['success' => false, 'message' => 'module_id and group_id required']); exit; }
        $pdo->prepare("DELETE FROM curriculum_modules WHERE module_id = ? AND group_id = ?")->execute([$module_id, $group_id]);
        echo json_encode(['success' => true, 'message' => 'Module removed from group']);
        exit;
    }

    // Assign existing module to a group
    if ($action === 'assign_to_group') {
        $module_id    = $input['module_id'] ?? null;
        $group_id     = $input['group_id'] ?? null;
        $is_mandatory = intval($input['is_mandatory'] ?? 1);
        if (!$module_id || !$group_id) { echo json_encode(['success' => false, 'message' => 'module_id and group_id required']); exit; }

        // Check if already assigned
        $check = $pdo->prepare("SELECT id FROM curriculum_modules WHERE module_id = ? AND group_id = ?");
        $check->execute([$module_id, $group_id]);
        if ($check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Module already in this group']); exit;
        }
        $pdo->prepare("INSERT INTO curriculum_modules (group_id, module_id, is_mandatory) VALUES (?, ?, ?)")
            ->execute([$group_id, $module_id, $is_mandatory]);
        echo json_encode(['success' => true, 'message' => 'Module assigned to group']);
        exit;
    }

    // Add curriculum group
    if ($action === 'add_group') {
        $degree_id = $input['degree_id'] ?? null;
        $year      = $input['academic_year'] ?? null;
        $sem       = $input['semester'] ?? null;
        $type      = $input['group_type'] ?? 'CORE';
        $name      = trim($input['group_name'] ?? '');
        $min_cr    = floatval($input['min_credits_required'] ?? 0);

        if (!$degree_id || !$year || !$sem || !$name) {
            echo json_encode(['success' => false, 'message' => 'degree_id, academic_year, semester, group_name required']); exit;
        }
        $stmt = $pdo->prepare("INSERT INTO curriculum_groups (degree_id, academic_year, semester, group_type, group_name, min_credits_required) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$degree_id, $year, $sem, $type, $name, $min_cr]);
        echo json_encode(['success' => true, 'message' => 'Group added', 'id' => $pdo->lastInsertId()]);
        exit;
    }

    // Update curriculum group
    if ($action === 'update_group') {
        $id   = $input['id'] ?? null;
        if (!$id) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }
        $fields = []; $vals = [];
        if (isset($input['group_name']))           { $fields[] = 'group_name = ?';           $vals[] = trim($input['group_name']); }
        if (isset($input['group_type']))           { $fields[] = 'group_type = ?';           $vals[] = $input['group_type']; }
        if (isset($input['min_credits_required'])) { $fields[] = 'min_credits_required = ?'; $vals[] = floatval($input['min_credits_required']); }
        if (empty($fields)) { echo json_encode(['success' => false, 'message' => 'Nothing to update']); exit; }
        $vals[] = $id;
        $pdo->prepare("UPDATE curriculum_groups SET " . implode(', ', $fields) . " WHERE id = ?")->execute($vals);
        echo json_encode(['success' => true, 'message' => 'Group updated']);
        exit;
    }

    // Delete curriculum group (removes all its modules from mapping)
    if ($action === 'delete_group') {
        $id = $input['id'] ?? null;
        if (!$id) { echo json_encode(['success' => false, 'message' => 'id required']); exit; }
        $pdo->prepare("DELETE FROM curriculum_modules WHERE group_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM curriculum_groups WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Group deleted']);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Unknown POST action']);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Method not allowed']);
