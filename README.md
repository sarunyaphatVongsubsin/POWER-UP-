คู่มือการเข้าใช้งานเว็บไซต์

### 1. เกี่ยวกับเว็บไซต์

POWER-UP เป็นเว็บไซต์สำหรับบันทึกข้อมูล Portfolio ของผู้ใช้

### 2. การเข้าใช้งานเว็บไซต์

สามารถเข้าใช้งานเว็บไซต์ได้ผ่านลิงก์ด้านล่าง

**Website URL:** https://sarunyaphatvongsubsin.github.io/POWER-UP-/

เว็บไซต์สามารถเปิดใช้งานผ่านเว็บเบราว์เซอร์ได้โดยตรง เช่น Google Chrome, Microsoft Edge และ Safari โดยไม่จำเป็นต้องติดตั้งโปรแกรมเพิ่มเติม

### 3. วิธีการใช้งาน

1. เปิดลิงก์เว็บไซต์ POWER-UP ผ่านเว็บเบราว์เซอร์
2. เข้าสู่หน้า Welcome (index.html)
3. เลือก Portfolios หรือ Quick Actions เพื่อไปยังหน้าจัดการ Portfolio (portfolio.html)
4. สร้าง Portfolio โดยกรอกข้อมูลในแบบฟอร์มที่กำหนด
5. เพิ่ม Item ที่ต้องการลงใน Portfolio
6. สามารถสร้าง Portfolio เพิ่มเติมและจัดการ Item ของแต่ละ Portfolio ได้
7. เมื่อดำเนินการเรียบร้อยแล้ว กดปุ่มบันทึกข้อมูล (Save)
8. สามารถกลับมาที่หน้า Welcome ได้โดยกดโลโก้หรือเมนู Home

### 4. ข้อควรทราบ

- ควรกรอกข้อมูลให้ครบถ้วนและถูกต้องตามรูปแบบที่กำหนด
- การบันทึกและเรียกคืนข้อมูลขึ้นอยู่กับระบบจัดเก็บข้อมูลของเว็บไซต์
- หากใช้งานผ่านอุปกรณ์หรือเว็บเบราว์เซอร์ที่แตกต่างกัน ข้อมูลอาจไม่สามารถแสดงร่วมกันได้ ขึ้นอยู่กับวิธีการจัดเก็บข้อมูลของระบบ

### 5. แหล่งเก็บซอร์สโค้ด

**GitHub Repository:**  
https://github.com/sarunyaphatVongsubsin/POWER-UP-

## 👥 Team Members & Responsibilities

### 👑 Project Management & Quality Assurance (QA & Delivery)

| No. | Member | Student ID | GitHub | Primary Role | Key Responsibilities |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | `นายศรัณยภัทร ว่องทรัพย์สิน` | `6909650704` | [@sarunyaphatVongsubsin](https://github.com/sarunyaphatVongsubsin) | **Repo Owner & Project Manager** | • บริหารจัดการและแจกจ่าย GitHub Issues<br>• ควบคุม Git Workflow, ตรวจสอบ Pull Requests และดูแล Branch กลาง<br>• กำกับดูแล Sprint ให้ตรงตามกำหนดเวลา |
| **2** | `นางสาวพัทธนันท์ อาจรัตนกูล` | `6909650621` | [@PattananAjrattanakul](https://github.com/PattananAjrattanakul) | **QA Lead & Submission Representative** | • ทดสอบระบบภาพรวม (E2E Test) ตาม Acceptance Criteria<br>• จัดทำคลิปวิดีโอสาธิตการทำงานและบรรยายระบบ<br>• รวบรวมเอกสารรายงาน PDF (Retrospective/Sprint Plan) และส่งงานบน Courseweb |

<br>

### 🎨 Frontend Development (UI / UX & Form Design)

| No. | Member | Student ID | GitHub | Assigned Issues | Focus Area |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **3** | `นางสาวอภัฏสลัณค์ สีทา` | `6909650787` | [@aphatsalanseetha](https://github.com/aphatsalanseetha) | `#1` Add Page to Repo<br>`#2` Design Portfolio Creation Form | **Base Structure & Portfolio Form** |
| **4** | `นางสาวนวพร สมพงศ์` | `6909650522` | [@nawaphonlnwza007](https://github.com/nawaphonlnwza007) | `#3` Design Portfolio Item Form<br>`#4` Display Portfolios and Items | **Item Form & Portfolio List Layout** |
| **5** | `นางสาวนภวรรณ เจิมจรุง` | `6909650514` | [@napawanjj](https://github.com/napawanjj) | `#5` Show Validation Errors and Save Status<br>`#6` Improve Responsive Design and Accessibility | **Form Feedback, A11y & Mobile Responsive** |

<br>

### ⚙️ Backend & Data Logic (State Management & Local Storage)

| No. | Member | Student ID | GitHub | Assigned Issues | Focus Area |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **6** | `นายภัทรพล วงษ์โฉม` | `6909650647` | [@Pattarapol-wongchom](https://github.com/Pattarapol-wongchom) | `#7` Define Portfolio Data Structure<br>`#8` Validate Portfolio and Item Data | **Data Schema Definition & Input Validation Logic** |
| **7** | `นายธัชธรรม ปั้นขุนทด` | `6909650480` | [@ThatchathamPankhunthod](https://github.com/ThatchathamPankhunthod) | `#9` Save and Load Data with localStorage<br>`#10` Add and Manage Portfolio Items | **Storage Engine & Item CRUD Management** |
| **8** | `นายวโรตม์ วิไล` | `6909650696` | [@varotvil-sketch](https://github.com/varotvil-sketch) | `#11` Support Multiple Portfolios and Data Selection<br>`#12` Prepare Sample Data and Reset Functionality | **Multi-Profile Switching & Sample/Reset Engine** |

### 6. ระบบจัดเก็บข้อมูลด้วย PHP (สำหรับเวอร์ชัน Server)

- เวอร์ชันที่เชื่อมต่อ PHP ต้องเปิดผ่าน Web Server ที่รองรับ PHP เท่านั้น เช่น Apache หรือ PHP Built-in Server
- GitHub Pages รองรับเฉพาะเว็บไซต์แบบ Static จึงไม่สามารถประมวลผลไฟล์ PHP หรือบันทึก Portfolio ลง Server ผ่าน PHP ได้
- วิธีตั้งค่าและทดลองใช้งานดูที่ไฟล์ `PHP-SETUP.md`
- ข้อมูล Portfolio และ Portfolio Item (รวม Reflection) จะถูกเก็บในไฟล์ JSON ฝั่ง Server ไม่ใช่ LocalStorage


### 6. PHP Server Storage และ Import / Export
- ระบบจัดเก็บข้อมูลหลักอยู่บน Server ผ่าน PHP API และไฟล์ JSON
- Import Portfolio Item ได้จากไฟล์ `.json` หรือวาง JSON พร้อม Preview และตรวจสอบข้อมูลก่อนบันทึก
- ป้องกันการ Import Item ID ซ้ำใน Portfolio เดียวกัน
- Export Portfolio เป็นไฟล์ JSON หรือ Copy JSON พร้อม Submission Checklist
- ตั้งค่าและวิธีทดลองระบบได้จาก `PHP-SETUP.md`
- ต้องเปิดผ่าน Hosting ที่รองรับ PHP หรือ PHP Built-in Server; GitHub Pages/Live Server ไม่สามารถประมวลผล PHP ได้


# 🃏 NUMBER RUSH — คิดให้ทัน ทำให้ถึง!

เกมประลองไหวพริบและทักษะการคำนวณ ผู้เล่นต้องใช้ตัวเลขจากไพ่ที่ได้รับมาสร้างสมการให้ได้ผลลัพธ์ตรงกับโจทย์ที่กำหนด ใครคิดได้เร็วและถูกต้องที่สุด รับคะแนนไปเลย!

## 🎯 เป้าหมายของเกม
สะสมคะแนนจากการแก้โจทย์คณิตศาสตร์ให้ถูกต้องและรวดเร็วที่สุดภายในเวลาที่กำหนด

## 👥 จำนวนผู้เล่น
- 3–6 คน
- ใช้ไพ่ป๊อกมาตรฐาน 1 สำรับ (52 ใบ)

## 🃏 การเตรียมเกม
1. สับไพ่และเตรียมกองไพ่สำหรับเล่น
2. ในแต่ละรอบ เปิดไพ่ตัวเลข 4 ใบไว้กลางโต๊ะ
3. เปิดไพ่เป้าหมาย 2 ใบ แล้วนำค่าตัวเลขทั้งสองมาบวกกันเพื่อกำหนดผลลัพธ์ที่ต้องการ
4. ผู้เล่นทุกคนใช้ชุดตัวเลขเดียวกันในการแก้โจทย์

**ค่าของไพ่**
- A = 1
- ไพ่ 2–10 = ตามหน้าไพ่
- J = 11
- Q = 12
- K = 13

## 📖 วิธีการเล่น
1. เมื่อเปิดไพ่ครบแล้ว ผู้เล่นเริ่มคิดสมการพร้อมกัน
2. ใช้ตัวเลขจากไพ่ทั้ง 4 ใบ โดยต้องใช้ทุกใบอย่างละ 1 ครั้ง
3. สามารถใช้เครื่องหมาย +, −, ×, ÷ และวงเล็บในการคำนวณ
4. ใครคิดคำตอบได้ก่อน ให้พูดว่า "RUSH!" เพื่อขอสิทธิ์ตอบ
5. ผู้เล่นต้องอธิบายวิธีคำนวณให้ถูกต้อง หากตอบถูกจะได้รับคะแนน
6. หากตอบผิด จะไม่ได้คะแนนในรอบนั้น และเปิดโอกาสให้ผู้เล่นคนอื่นตอบต่อ
7. กำหนดเวลาการเล่นรอบละ 60 วินาที

## 🏆 ระบบคะแนน

| อันดับ | คะแนน |
|---|---|
| คนแรกที่ตอบถูก | 3 คะแนน |
| คนที่สองที่ตอบถูก | 2 คะแนน |
| คนที่สามที่ตอบถูก | 1 คะแนน |
| ตอบไม่ถูกภายในเวลา | 0 คะแนน |

## 🥇 เงื่อนไขการชนะ
- เล่นทั้งหมด 5 รอบ
- รวมคะแนนจากทุกรอบ
- ผู้เล่นที่มีคะแนนรวมสูงที่สุดเป็นผู้ชนะ
- หากคะแนนเสมอกัน ให้เล่นรอบตัดสิน (Tie-breaker)

## ⚡ ระดับความยาก
- **Easy:** ใช้เครื่องหมายบวก (+) และลบ (−)
- **Medium:** ใช้เครื่องหมายบวก (+) ลบ (−) และคูณ (×)
- **Hard:** ใช้เครื่องหมายบวก (+) ลบ (−) คูณ (×) และหาร (÷) รวมถึงวงเล็บ

**พร้อมหรือยัง?** หยิบไพ่ ตั้งสมการ แล้ว RUSH ไปสู่ชัยชนะ!
