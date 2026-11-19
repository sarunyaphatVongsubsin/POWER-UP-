<?php
// Shared helpers for the Portfolio API (แนวทางเดียวกับ Starter ของอาจารย์)
// Local PHP server: เก็บข้อมูลใน api/local-data ซึ่งไม่ควรนำขึ้น GitHub
// Production (Apache/EC2): เก็บข้อมูลนอกโฟลเดอร์เว็บไซต์ที่ /var/www/data
if (php_sapi_name() === 'cli-server') {
    define('DATA_DIR', __DIR__ . '/local-data');
} else {
    define('DATA_DIR', '/var/www/data');
}

// สร้างโฟลเดอร์เก็บข้อมูลเมื่อยังไม่มี
if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0775, true) && !is_dir(DATA_DIR)) {
    sendJson(['error' => 'Cannot create data directory: ' . DATA_DIR], 500);
}

define('DATA_FILE', DATA_DIR . '/portfolios.json');

// รหัสผ่านสำหรับการลบและ Reset ข้อมูล (แก้ไขค่าได้ตรงนี้เพียงจุดเดียว)
define('DELETE_PASSWORD', '1234');

// ล็อกไฟล์ระหว่างอ่าน/เขียน ป้องกัน Request หลายรายการเขียนทับกัน
function lockData() {
    static $lock = null;
    if ($lock === null) {
        $lock = @fopen(DATA_DIR . '/data.lock', 'c');
        if ($lock === false) {
            sendJson(['error' => 'Server cannot open data lock file'], 500);
        }
        if (!flock($lock, LOCK_EX)) {
            sendJson(['error' => 'Server cannot lock data file'], 500);
        }
    }
}

// อ่าน Portfolio ทั้งหมดจาก JSON; หากยังไม่มีไฟล์ให้คืน Array ว่าง
function readPortfolios() {
    lockData();
    if (!file_exists(DATA_FILE)) return [];

    $json = @file_get_contents(DATA_FILE);
    if ($json === false) sendJson(['error' => 'Cannot read portfolio data'], 500);
    $data = json_decode($json, true);
    if (!is_array($data)) sendJson(['error' => 'Portfolio data file contains invalid JSON'], 500);
    return $data;
}

// เขียนข้อมูลลงไฟล์ชั่วคราวก่อน แล้วจึงแทนที่ไฟล์จริง
function writePortfolios($portfolios) {
    lockData();
    $json = json_encode($portfolios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) sendJson(['error' => 'Cannot encode portfolio data'], 500);

    if (@file_put_contents(DATA_FILE, $json, LOCK_EX) === false) {
        sendJson(['error' => 'Server cannot save portfolio data. Check folder permissions.'], 500);
    }
}

// ส่งผลลัพธ์ JSON กลับไปยัง JavaScript
function sendJson($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
?>
