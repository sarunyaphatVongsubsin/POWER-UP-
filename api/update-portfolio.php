<?php
// อัปเดตข้อมูล Profile ของ Portfolio เดิม โดยคง portfolioId และ Items ไว้
require __DIR__ . '/storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['error' => 'Method not allowed'], 405);
}

$portfolioId = trim($_POST['portfolioId'] ?? '');
$name = trim($_POST['name'] ?? '');
if ($portfolioId === '') sendJson(['error' => 'ไม่พบ Portfolio ID'], 400);
if ($name === '') sendJson(['error' => 'กรุณาระบุ Display Name'], 400);

$portfolios = readPortfolios();
foreach ($portfolios as $index => $portfolio) {
    if (($portfolio['portfolioId'] ?? '') === $portfolioId) {
        $portfolios[$index]['name'] = $name;
        $portfolios[$index]['whatIEnjoy'] = trim($_POST['whatIEnjoy'] ?? '');
        $portfolios[$index]['whatIveTried'] = trim($_POST['whatIveTried'] ?? '');
        $portfolios[$index]['whatImCuriousAbout'] = trim($_POST['whatImCuriousAbout'] ?? '');
        writePortfolios($portfolios);
        sendJson($portfolios[$index]);
    }
}
sendJson(['error' => 'ไม่พบ Portfolio ที่ต้องการแก้ไข'], 404);
?>
