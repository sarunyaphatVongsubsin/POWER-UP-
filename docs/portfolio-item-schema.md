# รูปแบบ JSON สำหรับ Import Portfolio Item

## 1. โครงสร้างหลัก

ไฟล์ JSON ใช้โครงสร้าง Portfolio Item โดยตรง ไม่ต้องมี Wrapper เช่น `schema`, `exchangeId`, `issuedAt` หรือ `source`

```json
{
  "id": "item001",
  "title": "My First Website",
  "type": "Course Assignment",
  "date": "2026-10-18",
  "role": "Developer",
  "description": "Created a personal website",
  "skills": ["HTML", "CSS"],
  "reflection": {
    "whatIDid": "Built the website",
    "whatILearned": "Responsive design",
    "challenge": "Mobile layout",
    "nextStep": "Improve the design"
  },
  "evidence": ["https://example.com/my-work"]
}
```

## 2. ฟิลด์หลัก

| Field | Type | เงื่อนไข |
|---|---|---|
| `id` | String | จำเป็น และห้ามซ้ำใน Portfolio ปลายทาง |
| `title` | String | จำเป็น ไม่เกิน 150 ตัวอักษร |
| `type` | String | จำเป็น ไม่เกิน 100 ตัวอักษร |
| `date` | String | จำเป็น รูปแบบวันที่จริง `YYYY-MM-DD` |
| `role` | String | จำเป็น ไม่เกิน 150 ตัวอักษร |
| `description` | String | จำเป็น ไม่เกิน 2,000 ตัวอักษร |
| `skills` | Array[String] | จำเป็น สูงสุด 20 รายการ รายการละไม่เกิน 50 ตัวอักษร |
| `reflection` | Object | จำเป็น ต้องมี 4 ฟิลด์ตามตารางด้านล่าง; อนุญาตข้อความว่างเพื่อรอ Reflection |
| `evidence` | Array[String] | จำเป็น; อนุญาต `[]` เพื่อรอแนบ Evidence |

### Reflection

- `whatIDid`
- `whatILearned`
- `challenge`
- `nextStep`

ทุกฟิลด์ต้องเป็น String และยาวไม่เกิน 2,000 ตัวอักษร

รายการใน `evidence` หากมีค่า ต้องเป็น URL ที่ใช้ HTTP หรือ HTTPS

## 3. Optional Metadata

ฟิลด์ต่อไปนี้ไม่จำเป็นต้องมี และไม่แสดงในหน้า Preview หรือหน้า Portfolio แต่ระบบจะเก็บไว้เมื่อส่งมา

| Field | เงื่อนไข |
|---|---|
| `schemaVersion` | String ต้องเป็น `"1.0"` |
| `challengeId` | String ไม่เกิน 100 ตัวอักษร |
| `hostGroup` | String ไม่เกิน 100 ตัวอักษร |
| `category` | เลือก `discover`, `mix` หรือ `levelup` |

ระบบจะกำหนด `importStatus: "pending"` ให้ Item ที่ Import โดยอัตโนมัติ เพื่อใช้ต่อยอด Issue 10 และไม่แสดงสถานะนี้ในหน้า Portfolio

## 4. ข้อจำกัดและการป้องกันข้อมูล

- ข้อความ JSON และไฟล์ `.json` ต้องมีขนาดไม่เกิน 256 KB
- ตรวจนามสกุลไฟล์ `.json` โดยไม่อาศัย MIME type เพียงอย่างเดียว
- ตรวจสอบ JSON Syntax, ชนิดข้อมูล, ความยาวฟิลด์ และ URL
- ตรวจสอบ ID ซ้ำใน Portfolio ปลายทางก่อนบันทึก
- หาก ID ซ้ำ ระบบปฏิเสธการ Import และไม่เขียนทับข้อมูลเดิม
- ข้อมูลจาก JSON แสดงผลผ่าน `textContent` ไม่แทรกเป็น HTML
- บันทึกข้อมูลด้วย Local Storage ในขั้นตอนนี้ ยังไม่มี PHP หรือ Server API
