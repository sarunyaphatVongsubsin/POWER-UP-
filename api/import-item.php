<?php
// Import Portfolio Items แบบ Single / Batch ลง Server JSON
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'PHP Error: ' . $message], JSON_UNESCAPED_UNICODE);
    exit;
});

require __DIR__ . '/storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 1024 * 1024) {
    sendJson(['error' => 'ข้อมูล Import ต้องมีขนาดไม่เกิน 1 MB'], 413);
}

$payload = json_decode($raw, true);
if (!is_array($payload) || !isset($payload['portfolioId'])) {
    sendJson(['error' => 'รูปแบบข้อมูล Import ไม่ถูกต้อง'], 400);
}

$portfolioId = trim((string)$payload['portfolioId']);
if ($portfolioId === '') {
    sendJson(['error' => 'กรุณาระบุ Portfolio ปลายทาง'], 400);
}

// รองรับทั้ง clients รุ่นเก่า (item) และรุ่นใหม่ (items)
if (isset($payload['items']) && is_array($payload['items'])) {
    $items = $payload['items'];
} elseif (isset($payload['item']) && is_array($payload['item'])) {
    $items = [$payload['item']];
} else {
    sendJson(['error' => 'ไม่พบรายการ Item ที่ต้องการ Import'], 400);
}

if (count($items) < 1 || count($items) > 100) {
    sendJson(['error' => 'Import ได้ตั้งแต่ 1 ถึง 100 Items ต่อครั้ง'], 400);
}

function importTextLength($value) {
    if (function_exists('mb_strlen')) return mb_strlen($value, 'UTF-8');
    $count = preg_match_all('/./us', $value, $matches);
    return $count === false ? strlen($value) : $count;
}

function validateImportItem($item, $index) {
    $prefix = 'Item ลำดับที่ ' . ($index + 1) . ': ';

    if (!is_array($item)) return $prefix . 'ข้อมูลต้องเป็น Object';

    foreach (['id', 'title', 'type', 'date', 'role', 'description'] as $field) {
        if (!isset($item[$field]) || !is_string($item[$field]) || trim($item[$field]) === '') {
            return $prefix . "ข้อมูล $field ไม่ครบถ้วน";
        }
    }

    foreach (['title' => 150, 'type' => 100, 'role' => 150, 'description' => 2000] as $field => $max) {
        if (importTextLength(trim($item[$field])) > $max) {
            return $prefix . "$field มีความยาวเกินกำหนด";
        }
    }

    $item['id'] = trim($item['id']);
    $item['date'] = trim($item['date']);
    $date = DateTime::createFromFormat('!Y-m-d', $item['date']);
    $dateErrors = DateTime::getLastErrors();

    if (
        !preg_match('/^\d{4}-\d{2}-\d{2}$/', $item['date']) ||
        !$date ||
        ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0)) ||
        $date->format('Y-m-d') !== $item['date']
    ) {
        return $prefix . 'date ต้องเป็นวันที่จริงรูปแบบ YYYY-MM-DD';
    }

    if (
        !isset($item['skills']) || !is_array($item['skills']) ||
        count($item['skills']) > 20
    ) {
        return $prefix . 'skills ต้องเป็น Array (ไม่เกิน 20 รายการ)';
    }
    foreach ($item['skills'] as $skill) {
        if (!is_string($skill) || trim($skill) === '' || importTextLength($skill) > 50) {
            return $prefix . 'skills ต้องเป็นข้อความที่ถูกต้อง';
        }
    }

    if (!isset($item['reflection']) || !is_array($item['reflection'])) {
        return $prefix . 'reflection ต้องเป็น Object';
    }
    foreach (['whatIDid', 'whatILearned', 'challenge', 'nextStep'] as $field) {
        if (!isset($item['reflection'][$field]) || !is_string($item['reflection'][$field]) ||
            importTextLength($item['reflection'][$field]) > 2000) {
            return $prefix . "reflection.$field ต้องเป็นข้อความไม่เกิน 2,000 ตัวอักษร";
        }
    }

    if (!isset($item['evidence']) || !is_array($item['evidence']) || count($item['evidence']) > 10) {
        return $prefix . 'evidence ต้องเป็น Array (ไม่เกิน 10 รายการ)';
    }
    foreach ($item['evidence'] as $url) {
        if (!is_string($url) || trim($url) === '') return $prefix . 'Evidence URL ไม่ถูกต้อง';
        $parts = parse_url($url);
        if (!$parts || !isset($parts['scheme'], $parts['host']) ||
            !in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            return $prefix . 'Evidence ต้องเป็น HTTP/HTTPS URL';
        }
    }

    if (isset($item['schemaVersion']) && $item['schemaVersion'] !== '1.0') {
        return $prefix . 'schemaVersion ต้องเป็น "1.0"';
    }
    if (isset($item['category']) && !in_array($item['category'], ['discover', 'mix', 'levelup'], true)) {
        return $prefix . 'category ไม่ถูกต้อง';
    }
    foreach (['challengeId', 'hostGroup'] as $field) {
        if (isset($item[$field]) && (!is_string($item[$field]) || trim($item[$field]) === '' ||
            importTextLength($item[$field]) > 100)) {
            return $prefix . "$field ไม่ถูกต้อง";
        }
    }

    return null;
}

// ตรวจสอบทุก Item ก่อนแตะต้องข้อมูล เพื่อให้การ Import เป็นแบบ All-or-Nothing
$seenIds = [];
foreach ($items as $index => $item) {
    $error = validateImportItem($item, $index);
    if ($error !== null) sendJson(['error' => $error], 400);

    $id = trim($item['id']);
    if (isset($seenIds[$id])) {
        sendJson(['error' => 'พบ Item ID "' . $id . '" ซ้ำภายในไฟล์'], 409);
    }
    $seenIds[$id] = true;
}

$portfolios = readPortfolios();
foreach ($portfolios as $index => $portfolio) {
    if (($portfolio['portfolioId'] ?? '') !== $portfolioId) continue;

    $existingItems = $portfolio['items'] ?? [];
    if (!is_array($existingItems)) $existingItems = [];

    $existingIds = [];
    foreach ($existingItems as $existing) {
        if (isset($existing['id'])) $existingIds[(string)$existing['id']] = true;
    }

    foreach ($items as $item) {
        $id = trim($item['id']);
        if (isset($existingIds[$id])) {
            sendJson(['error' => 'Item ID "' . $id . '" มีอยู่ใน Portfolio แล้ว ไม่สามารถ Import ซ้ำได้'], 409);
        }
    }

    $savedItems = [];
    foreach ($items as $item) {
        $item['id'] = trim($item['id']);
        $item['date'] = trim($item['date']);
        $item['importStatus'] = 'pending';
        $savedItems[] = $item;
    }

    $portfolio['items'] = array_merge($existingItems, $savedItems);
    $portfolios[$index] = $portfolio;
    writePortfolios($portfolios);

    sendJson([
        'success' => true,
        'importedCount' => count($savedItems),
        'items' => $savedItems
    ], 201);
}

sendJson(['error' => 'ไม่พบ Portfolio ปลายทาง'], 404);
