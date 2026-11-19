<?php
// API สำหรับเพิ่ม Portfolio Item (Reflection อยู่ภายใน Item)
require __DIR__ . '/storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

$portfolioId = trim($_POST['portfolioId'] ?? '');
$title = trim($_POST['title'] ?? '');
if ($portfolioId === '') sendJson(['error' => 'ไม่พบ Portfolio ID'], 400);
if ($title === '') sendJson(['error' => 'กรุณาระบุชื่อผลงาน'], 400);

// แปลงรายการ Skills และ Evidence ที่คั่นด้วย comma หรือขึ้นบรรทัดใหม่เป็น Array
$skills = array_values(array_filter(array_map('trim', preg_split('/[,\\r\\n]+/', $_POST['skills'] ?? ''))));
$evidence = array_values(array_filter(array_map('trim', preg_split('/[\\r\\n]+/', $_POST['evidence'] ?? ''))));

$item = [
    'id' => uniqid('item_', true),
    'title' => $title,
    'type' => trim($_POST['type'] ?? ''),
    'date' => trim($_POST['date'] ?? ''),
    'role' => trim($_POST['role'] ?? ''),
    'description' => trim($_POST['description'] ?? ''),
    'skills' => $skills,
    // Reflection เป็นข้อมูลย่อยของ Portfolio Item ตามที่กำหนด
    'reflection' => [
        'whatIDid' => trim($_POST['whatIDid'] ?? ''),
        'whatILearned' => trim($_POST['whatILearned'] ?? ''),
        'challenge' => trim($_POST['challenge'] ?? ''),
        'nextStep' => trim($_POST['nextStep'] ?? '')
    ],
    'evidence' => $evidence
];

$portfolios = readPortfolios();
foreach ($portfolios as $index => $portfolio) {
    if (($portfolio['portfolioId'] ?? '') === $portfolioId) {
        if (!isset($portfolios[$index]['items']) || !is_array($portfolios[$index]['items'])) {
            $portfolios[$index]['items'] = [];
        }
        $portfolios[$index]['items'][] = $item;
        writePortfolios($portfolios);
        sendJson($item, 201);
    }
}

sendJson(['error' => 'ไม่พบ Portfolio ที่ต้องการเพิ่ม Item'], 404);
?>
