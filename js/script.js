document.addEventListener('DOMContentLoaded', function () {
  // 1. จัดการฟอร์มสร้าง Portfolio ด้านบน (ถ้ามี)
  const portfolioForm = document.getElementById('portfolio-form');
  if (portfolioForm) {
    portfolioForm.addEventListener('submit', function (event) {
      if (!portfolioForm.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        event.preventDefault();
        // ตัวอย่างการแสดงสถานะเมื่อบันทึกสำเร็จ
        alert('บันทึกข้อมูล Portfolio สำเร็จเรียบร้อยแล้ว!');
      }
      portfolioForm.classList.add('was-validated');
    });
  }

  // 2. จัดการฟอร์มเพิ่ม Portfolio Item ด้านล่าง (ตามรูปภาพโค้ดที่คุณส่งมา)
  const itemForm = document.getElementById('item-form');
  if (itemForm) {
    itemForm.addEventListener('submit', function (event) {
      // ตรวจสอบว่าข้อมูลในฟอร์มกรอกครบถ้วนตามเงื่อนไข HTML หรือยัง
      if (!itemForm.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        event.preventDefault();
        
        // ตรงนี้คือส่วนที่คุณสามารถใส่โค้ดบันทึกข้อมูล 
        // เมื่อบันทึกสำเร็จ ให้แสดงข้อความแจ้งเตือนสถานะความสำเร็จ[span_1](start_span)[span_1](end_span)
        alert('บันทึก Portfolio Item สำเร็จเรียบร้อยแล้ว!');
        
        // เคลียร์ฟอร์มและล้างสถานะ validation หลังบันทึกสำเร็จ
        itemForm.reset();
        itemForm.classList.remove('was-validated');
        return;
      }
      
      // ถ้าข้อมูลไม่ครบ จะแสดงข้อความแจ้งเตือนข้อผิดพลาด[span_2](start_span)[span_2](end_span)
      itemForm.classList.add('was-validated');
    });
  }
});