<?php
// API สำหรับอ่านและเพิ่ม Portfolio
require __DIR__ . '/storage.php';

// GET: ส่ง Portfolio ทั้งหมดพร้อม Items กลับไปให้หน้าเว็บ
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    sendJson(readPortfolios());
}

// POST: สร้าง Portfolio ใหม่ โดยรับข้อมูลจาก FormData ($_POST)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

$name = trim($_POST['name'] ?? '');
if ($name === '') sendJson(['error' => 'กรุณาระบุชื่อ Portfolio'], 400);

// สร้าง ID ฝั่ง Server เพื่อไม่ให้ Client กำหนด ID เอง
$portfolio = [
    'portfolioId' => uniqid('portfolio_', true),
    'name' => $name,
    'whatIEnjoy' => trim($_POST['whatIEnjoy'] ?? ''),
    'whatIveTried' => trim($_POST['whatIveTried'] ?? ''),
    'whatImCuriousAbout' => trim($_POST['whatImCuriousAbout'] ?? ''),
    'items' => []
];

$portfolios = readPortfolios();
$portfolios[] = $portfolio;
writePortfolios($portfolios);
sendJson($portfolio, 201);
?>
