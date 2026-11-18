"use strict";

// ---------- ตรวจสอบ Portfolio Item JSON ----------
function validatePortfolioItemJson(text, existingExchangeIds = []) {
  const errors = [];
  let data;

  // 1. ตรวจสอบ JSON Syntax
  try {
    data = JSON.parse(text);
  } catch {
    return {
      valid: false,
      errors: ["ไฟล์ JSON ไม่ถูกต้อง หรืออ่านข้อมูลไม่ได้"],
      data: null
    };
  }

  // 2. ตรวจสอบว่า JSON หลักเป็น Object
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      valid: false,
      errors: ["ข้อมูล JSON ต้องเป็น Object"],
      data
    };
  }

  // 3. ตรวจสอบ Wrapper
  if (data.schema !== "powerup-portfolio-item") {
    errors.push("schema ไม่ถูกต้อง");
  }

  if (data.version !== 1) {
    errors.push("version ต้องเป็น 1");
  }

  // 4. ตรวจสอบ exchangeId และรหัสซ้ำ
  if (!Array.isArray(existingExchangeIds)) {
    errors.push("รายการ exchangeId ที่มีอยู่ต้องเป็น Array");
  } else if (typeof data.exchangeId !== "string" || !data.exchangeId.trim()) {
    errors.push("exchangeId จำเป็นต้องมีข้อมูล");
  } else if (existingExchangeIds.includes(data.exchangeId)) {
    errors.push(`exchangeId "${data.exchangeId}" ถูกใช้งานแล้ว`);
  }

  // 5. ตรวจสอบวันที่ส่งออก
  if (
    typeof data.issuedAt !== "string" ||
    Number.isNaN(Date.parse(data.issuedAt))
  ) {
    errors.push("issuedAt ต้องเป็นวันที่ที่ถูกต้อง");
  }

  // 6. ตรวจสอบ Source
  if (
    !data.source ||
    typeof data.source !== "object" ||
    Array.isArray(data.source)
  ) {
    errors.push("source ต้องเป็น Object");
  } else {
    ["group", "booth", "challenge", "host"].forEach(field => {
      if (
        typeof data.source[field] !== "string" ||
        !data.source[field].trim()
      ) {
        errors.push(`source.${field} จำเป็นต้องมีข้อมูล`);
      }
    });
  }

  // 7. ตรวจสอบ Portfolio Item
  if (
    !data.item ||
    typeof data.item !== "object" ||
    Array.isArray(data.item)
  ) {
    errors.push("item ต้องเป็น Object");
  } else if (typeof validatePortfolioItemData === "function") {
    validatePortfolioItemData(data.item).forEach(error => {
      errors.push(`item: ${error}`);
    });
  } else {
    errors.push("ไม่พบฟังก์ชัน validatePortfolioItemData");
  }

  // 8. ส่งผลลัพธ์กลับ
  return {
    valid: errors.length === 0,
    errors,
    data
  };
}


// ---------- Unit Tests ----------
function runPortfolioItemValidationTests() {
  const sample = {
    schema: "powerup-portfolio-item",
    version: 1,
    exchangeId: "test-exchange-001",
    issuedAt: "2026-11-18T10:00:00.000Z",

    source: {
      group: "Test Group",
      booth: "Test Booth",
      challenge: "Test Challenge",
      host: "Test Host"
    },

    item: {
      id: "test-item-001",
      title: "Test Portfolio Item",
      type: "Course Assignment",
      date: "2026-11-18",
      role: "Developer",
      description: "Testing JSON validation",
      skills: ["JavaScript", "JSON"],

      reflection: {
        whatIDid: "Created a test",
        whatILearned: "Learned JSON validation",
        challenge: "Testing errors",
        nextStep: "Write more tests"
      },

      evidence: []
    }
  };

  const tests = [
    {
      name: "Valid JSON",
      input: JSON.stringify(sample),
      expected: true
    },
    {
      name: "Invalid JSON syntax",
      input: "{ invalid json }",
      expected: false
    },
    {
      name: "Missing exchangeId",
      input: JSON.stringify({
        ...sample,
        exchangeId: ""
      }),
      expected: false
    },
    {
      name: "Duplicate exchangeId",
      input: JSON.stringify(sample),
      existingExchangeIds: ["test-exchange-001"],
      expected: false
    },
    {
      name: "Unique exchangeId",
      input: JSON.stringify(sample),
      existingExchangeIds: ["another-exchange-001"],
      expected: true
    },
    {
      name: "Wrong schema",
      input: JSON.stringify({
        ...sample,
        schema: "wrong-schema"
      }),
      expected: false
    },
    {
      name: "Wrong version",
      input: JSON.stringify({
        ...sample,
        version: 2
      }),
      expected: false
    },
    {
      name: "Missing source field",
      input: JSON.stringify({
        ...sample,
        source: {
          ...sample.source,
          host: ""
        }
      }),
      expected: false
    },
    {
      name: "Missing item",
      input: JSON.stringify({
        ...sample,
        item: null
      }),
      expected: false
    },
    {
      name: "Invalid issuedAt",
      input: JSON.stringify({
        ...sample,
        issuedAt: "not-a-date"
      }),
      expected: false
    },
    {
      name: "Invalid date format",
      input: JSON.stringify({
        ...sample,
        item: {
          ...sample.item,
          date: "2026/11/18"
        }
      }),
      expected: false
    },
    {
      name: "Empty input",
      input: "",
      expected: false
    },
    {
      name: "JSON array instead of object",
      input: JSON.stringify([sample]),
      expected: false
    },
    {
      name: "Wrong title type",
      input: JSON.stringify({
        ...sample,
        item: {
          ...sample.item,
          title: 123
        }
      }),
      expected: false
    },
    {
      name: "Wrong skills type",
      input: JSON.stringify({
        ...sample,
        item: {
          ...sample.item,
          skills: "JavaScript"
        }
      }),
      expected: false
    }
  ];

  // แสดงผล Unit Tests ใน Browser Console
  console.table(
    tests.map(test => {
      const result = validatePortfolioItemJson(
        test.input,
        test.existingExchangeIds || []
      );

      return {
        Test: test.name,
        Expected: test.expected,
        Actual: result.valid,
        Passed: result.valid === test.expected
      };
    })
  );
}


// ทำให้เรียก Unit Tests จาก Browser Console ได้
window.runPortfolioItemValidationTests =
  runPortfolioItemValidationTests;
