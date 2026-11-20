<?php
// อัปเดต Portfolio Item ตาม portfolioId และ itemId โดยรักษา ID และ metadata เดิม
require __DIR__ . '/storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

$portfolioId = trim($_POST['portfolioId'] ?? '');
$itemId = trim($_POST['itemId'] ?? '');
$title = trim($_POST['title'] ?? '');
if ($portfolioId === '' || $itemId === '') sendJson(['error' => 'ข้อมูล ID ไม่ครบถ้วน'], 400);
if ($title === '') sendJson(['error' => 'กรุณาระบุชื่อผลงาน'], 400);

$skills = array_values(array_filter(array_map('trim', preg_split('/[,\\r\\n]+/', $_POST['skills'] ?? ''))));
$evidence = array_values(array_filter(array_map('trim', preg_split('/[\\r\\n]+/', $_POST['evidence'] ?? ''))));

$portfolios = readPortfolios();
foreach ($portfolios as $portfolioIndex => $portfolio) {
    if (($portfolio['portfolioId'] ?? '') !== $portfolioId) continue;
    foreach (($portfolio['items'] ?? []) as $itemIndex => $item) {
        if (($item['id'] ?? '') !== $itemId) continue;

        // array_replace รักษาฟิลด์ metadata ที่ระบบอื่นอาจเพิ่มไว้
        $updated = array_replace($item, [
            'id' => $itemId,
            'title' => $title,
            'type' => trim($_POST['type'] ?? ''),
            'date' => trim($_POST['date'] ?? ''),
            'role' => trim($_POST['role'] ?? ''),
            'description' => trim($_POST['description'] ?? ''),
            'skills' => $skills,
            'reflection' => [
                'whatIDid' => trim($_POST['whatIDid'] ?? ''),
                'whatILearned' => trim($_POST['whatILearned'] ?? ''),
                'challenge' => trim($_POST['challenge'] ?? ''),
                'nextStep' => trim($_POST['nextStep'] ?? '')
            ],
            'evidence' => $evidence
        ]);
        $portfolios[$portfolioIndex]['items'][$itemIndex] = $updated;
        writePortfolios($portfolios);
        sendJson($updated);
    }
    sendJson(['error' => 'ไม่พบ Item ที่ต้องการแก้ไข'], 404);
}
sendJson(['error' => 'ไม่พบ Portfolio ที่ต้องการแก้ไข'], 404);
?>
