
<?php
// นำเข้า Portfolio Item จาก JSON
// และบันทึกลง Server JSON ผ่าน storage.php

require __DIR__ . '/storage.php';

// ตรวจสอบ Method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

// รับ JSON
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

// ตรวจสอบโครงสร้าง JSON
if (
    !is_array($payload) ||
    !isset($payload['portfolioId'], $payload['item']) ||
    !is_array($payload['item'])
) {
    sendJson(['error' => 'รูปแบบข้อมูล Import ไม่ถูกต้อง'], 400);
}

$portfolioId = trim((string)$payload['portfolioId']);
$item = $payload['item'];

// ตรวจสอบข้อมูลที่จำเป็น
$required = [
    'id',
    'title',
    'type',
    'date',
    'role',
    'description'
];

foreach ($required as $field) {
    if (
        !isset($item[$field]) ||
        !is_string($item[$field]) ||
        trim($item[$field]) === ''
    ) {
        sendJson(['error' => "ข้อมูล $field ไม่ครบถ้วน"], 400);
    }
}

// ========================================
// ตรวจสอบวันที่ (แก้ไข)
// ========================================

// ตัดช่องว่างก่อนและหลังวันที่
$item['date'] = trim($item['date']);

// ตรวจสอบรูปแบบ YYYY-MM-DD
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $item['date'])) {
    sendJson([
        'error' => 'date ต้องอยู่ในรูปแบบ YYYY-MM-DD'
    ], 400);
}

// ตรวจสอบว่าเป็นวันที่จริง
$date = DateTime::createFromFormat('!Y-m-d', $item['date']);
$errors = DateTime::getLastErrors();

if (
    !$date ||
    ($errors !== false &&
        ($errors['warning_count'] > 0 || $errors['error_count'] > 0)
    ) ||
    $date->format('Y-m-d') !== $item['date']
) {
    sendJson([
        'error' => 'วันที่ไม่ถูกต้อง กรุณาระบุวันที่จริง'
    ], 400);
}

// ========================================
// ตรวจสอบ Skills, Reflection และ Evidence
// ========================================

if (
    !isset($item['skills']) ||
    !is_array($item['skills']) ||
    !isset($item['reflection']) ||
    !is_array($item['reflection']) ||
    !isset($item['evidence']) ||
    !is_array($item['evidence'])
) {
    sendJson([
        'error' => 'skills, reflection และ evidence ต้องเป็น Array/Object ตามโครงสร้าง'
    ], 400);
}

// ตรวจสอบ Reflection
foreach (
    ['whatIDid', 'whatILearned', 'challenge', 'nextStep']
    as $field
) {
    if (
        !isset($item['reflection'][$field]) ||
        !is_string($item['reflection'][$field])
    ) {
        sendJson([
            'error' => "reflection.$field ต้องเป็นข้อความ"
        ], 400);
    }
}

// จำกัดจำนวนข้อมูล
if (count($item['skills']) > 20 || count($item['evidence']) > 10) {
    sendJson([
        'error' => 'จำนวน skills หรือ evidence เกินกำหนด'
    ], 400);
}

// ตรวจสอบ Evidence URL
foreach ($item['evidence'] as $url) {
    if (!is_string($url) || trim($url) === '') {
        sendJson(['error' => 'Evidence URL ไม่ถูกต้อง'], 400);
    }

    $parts = parse_url($url);

    if (
        !$parts ||
        !isset($parts['scheme'], $parts['host']) ||
        !in_array(strtolower($parts['scheme']), ['http', 'https'], true)
    ) {
        sendJson([
            'error' => 'Evidence ต้องเป็น HTTP/HTTPS URL'
        ], 400);
    }
}

// ========================================
// บันทึกข้อมูลลง Server
// ========================================

$portfolios = readPortfolios();

foreach ($portfolios as $index => $portfolio) {

    if (($portfolio['portfolioId'] ?? '') !== $portfolioId) {
        continue;
    }

    $items = $portfolio['items'] ?? [];

    if (!is_array($items)) {
        $items = [];
    }

    // ตรวจสอบ ID ซ้ำ
    foreach ($items as $existing) {
        if (($existing['id'] ?? '') === $item['id']) {
            sendJson([
                'error' => 'Item ID นี้มีอยู่ใน Portfolio แล้ว ไม่สามารถ Import ซ้ำได้'
            ], 409);
        }
    }

    // เก็บ Metadata เพิ่มเติม
    $item['importStatus'] = 'pending';

    // เพิ่ม Item
    $items[] = $item;
    $portfolios[$index]['items'] = $items;

    // บันทึกข้อมูล
    writePortfolios($portfolios);

    sendJson([
        'success' => true,
        'item' => $item
    ], 201);
}

// ไม่พบ Portfolio
sendJson([
    'error' => 'ไม่พบ Portfolio ปลายทาง'
], 404);

?>
