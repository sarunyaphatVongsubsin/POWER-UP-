<?php
// API สำหรับ Reset ข้อมูล Portfolio กลับเป็นข้อมูลตัวอย่างที่มากับโปรเจกต์
require __DIR__ . '/storage.php';

// อนุญาตเฉพาะ POST เพื่อไม่ให้การเปิด URL โดยตรงสั่ง Reset ข้อมูลได้
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

// ตรวจสอบรหัสผ่านบน Server ด้วย if-else ก่อนเขียนทับข้อมูลเดิม
$submittedPassword = $_POST['password'] ?? '';
if ($submittedPassword === DELETE_PASSWORD) {
    // ผ่านการตรวจสอบ จึงดำเนินการ Reset ได้
} else {
    sendJson(['error' => 'รหัสผ่านไม่ถูกต้อง ไม่สามารถ Reset ข้อมูลได้'], 403);
}

// อ่านข้อมูลตัวอย่างจากไฟล์ JSON ที่อยู่ในโฟลเดอร์หลักของเว็บไซต์
$sampleFiles = [
    __DIR__ . '/../sample-portfolio-1.json',
    __DIR__ . '/../sample-portfolio-2.json'
];
$samplePortfolios = [];

foreach ($sampleFiles as $file) {
    if (!is_readable($file)) {
        sendJson(['error' => 'ไม่พบไฟล์ข้อมูลตัวอย่าง: ' . basename($file)], 500);
    }

    $json = file_get_contents($file);
    $portfolio = json_decode($json, true);

    // ตรวจสอบว่าไฟล์ JSON อ่านได้และมีข้อมูล Portfolio ตามรูปแบบที่ต้องการ
    if (json_last_error() !== JSON_ERROR_NONE ||
        !is_array($portfolio) ||
        empty($portfolio['portfolioId']) ||
        empty($portfolio['name']) ||
        !isset($portfolio['items']) ||
        !is_array($portfolio['items'])) {
        sendJson(['error' => 'รูปแบบไฟล์ข้อมูลตัวอย่างไม่ถูกต้อง'], 500);
    }

    $samplePortfolios[] = $portfolio;
}

// เขียนข้อมูลตัวอย่างทับข้อมูลเดิมบน Server
writePortfolios($samplePortfolios);

// ส่งข้อมูลชุดใหม่กลับไปให้ JavaScript วาดหน้าเว็บอีกครั้ง
sendJson([
    'message' => 'Reset ข้อมูลกลับเป็นชุดตัวอย่างเรียบร้อยแล้ว',
    'portfolios' => $samplePortfolios
]);
?>
