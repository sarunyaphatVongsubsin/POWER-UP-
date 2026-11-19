<?php
// API สำหรับลบ Portfolio หรือ Portfolio Item โดยต้องตรวจสอบรหัสผ่านฝั่ง Server
require __DIR__ . '/storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

// ตั้งรหัสผ่านสำหรับการลบตรงนี้ก่อนนำขึ้นใช้งานจริง
// PHP ทำงานบน Server จึงไม่ส่งค่ารหัสผ่านนี้ไปให้ JavaScript
$deletePassword = DELETE_PASSWORD; // ใช้รหัสผ่านที่กำหนดไว้ใน storage.php
$submittedPassword = $_POST['password'] ?? '';

// ใช้ if-else ตามรูปแบบที่ผู้ใช้ต้องการ
if ($submittedPassword === $deletePassword) {
    // ผ่านการตรวจสอบ จึงอนุญาตให้ดำเนินการลบ
} else {
    sendJson(['error' => 'รหัสผ่านไม่ถูกต้อง ไม่สามารถลบข้อมูลได้'], 403);
}

$portfolioId = trim($_POST['portfolioId'] ?? '');
$itemId = trim($_POST['itemId'] ?? '');
if ($portfolioId === '') sendJson(['error' => 'ไม่พบ Portfolio ID'], 400);

$portfolios = readPortfolios();
$portfolioFound = false;

foreach ($portfolios as $index => $portfolio) {
    if (($portfolio['portfolioId'] ?? '') !== $portfolioId) continue;
    $portfolioFound = true;

    // ถ้ามี itemId ให้ลบเฉพาะ Item; ถ้าไม่มีให้ลบ Portfolio ทั้งชุด
    if ($itemId !== '') {
        $before = count($portfolios[$index]['items'] ?? []);
        $portfolios[$index]['items'] = array_values(array_filter(
            $portfolios[$index]['items'] ?? [],
            function ($item) use ($itemId) { return ($item['id'] ?? '') !== $itemId; }
        ));
        if (count($portfolios[$index]['items']) === $before) {
            sendJson(['error' => 'ไม่พบ Portfolio Item ที่ต้องการลบ'], 404);
        }
        writePortfolios($portfolios);
        sendJson(['message' => 'ลบ Portfolio Item สำเร็จ']);
    }

    // ลบ Portfolio จะลบ Items และ Reflection ที่อยู่ภายในไปพร้อมกัน
    array_splice($portfolios, $index, 1);
    writePortfolios($portfolios);
    sendJson(['message' => 'ลบ Portfolio สำเร็จ']);
}

if (!$portfolioFound) sendJson(['error' => 'ไม่พบ Portfolio ที่ต้องการลบ'], 404);
?>
