const initialPortfolios = [
  {
    portfolioId: "portfolio-1",
    name: "Napat Wattanapong (Ploy)",
    whatIEnjoy: "Designing user-friendly web interfaces, building interactive frontend applications, and collaborating on creative student tech projects.",
    whatIveTried: "HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, Git/GitHub workflow, and Figma UI prototyping.",
    whatImCuriousAbout: "React.js, TypeScript, accessible web design (WCAG), and full-stack development with Node.js.",
    items: [
      {
        id: "item-101",
        title: "POWER UP! Learning Portfolio Web App",
        type: "Course Assignment",
        date: "2026-10-15",
        role: "Frontend Developer & UI Designer",
        description: "Developed a responsive single-page learning portfolio web application for CS100 using HTML5, Bootstrap 5, and vanilla JavaScript with localStorage persistence.",
        skills: [
          "HTML5",
          "CSS3",
          "Bootstrap 5",
          "JavaScript",
          "Git"
        ],
        reflection: {
          whatIDid: "Designed the pastel pink theme, structured the responsive layout with Bootstrap grid, and implemented form validation and localStorage state management.",
          whatILearned: "Learned how to manage structured JSON data in browser localStorage and coordinate Git branches with teammates without merge conflicts.",
          challenge: "Ensuring form inputs validated cleanly before saving and keeping the layout responsive on smaller mobile viewports.",
          nextStep: "Add search and filter capabilities by skill tags and support exporting portfolios as PDF or downloadable JSON files."
        },
        evidence: [
          "https://github.com/example/power-up-portfolio",
          "https://example.com/power-up-demo"
        ]
      },
      {
        id: "item-102",
        title: "Campus Sustainability Hackathon Prototype",
        type: "Competition",
        date: "2026-09-20",
        role: "UX Researcher & Prototyping Lead",
        description: "Created an interactive mobile prototype for tracking reusable cup rewards across campus cafes during a 48-hour student hackathon.",
        skills: [
          "Figma",
          "UX Research",
          "Wireframing",
          "Team Collaboration",
          "Pitching"
        ],
        reflection: {
          whatIDid: "Conducted quick interviews with 15 students, mapped user flows, and built a clickable high-fidelity prototype in Figma.",
          whatILearned: "Learned how to rapidly validate assumptions with real users and prioritize core features under strict time constraints.",
          challenge: "Balancing gamification features with a fast, frictionless QR scan checkout flow for busy coffee shop queues.",
          nextStep: "Build a working progressive web app (PWA) MVP and test it with one campus student-run cafe."
        },
        evidence: [
          "https://figma.com/file/example-campus-green-cup",
          "https://example.com/hackathon-pitch-deck"
        ]
      }
    ]
  },
  {
    portfolioId: "portfolio-2",
    name: "Thanawat Srisuk (Ton)",
    whatIEnjoy: "Solving algorithmic problems, automating repetitive workflows with Python, and exploring data visualization.",
    whatIveTried: "Python scripting, C programming, basic SQL queries, data cleaning with Pandas, and command-line Git.",
    whatImCuriousAbout: "Machine learning fundamentals, RESTful API design, Docker containers, and cloud deployment.",
    items: [
      {
        id: "item-201",
        title: "Smart Study Schedule & Deadline Tracker",
        type: "Personal Project",
        date: "2026-08-28",
        role: "Solo Developer",
        description: "Built a lightweight command-line and web dashboard tool that parses course syllabi dates and generates weekly study reminders.",
        skills: [
          "Python",
          "JavaScript",
          "JSON",
          "Data Parsing"
        ],
        reflection: {
          whatIDid: "Wrote a Python script to convert CSV deadline tables into structured JSON and rendered upcoming tasks on a clean web page.",
          whatILearned: "Learned how to handle date/time formatting across timezones and structure clean, reusable JSON schemas.",
          challenge: "Handling inconsistent date formats from different course syllabus documents without crashing the parser.",
          nextStep: "Integrate Google Calendar export (.ics) so reminders sync automatically to mobile devices."
        },
        evidence: [
          "https://github.com/example/study-deadline-tracker"
        ]
      },
      {
        id: "item-202",
        title: "Intro to Git & Open Source Workshop",
        type: "Club Activity",
        date: "2026-10-03",
        role: "Workshop Co-Facilitator",
        description: "Co-organized a hands-on workshop for 40 first-year computer science students covering Git fundamentals, branching, and pull requests.",
        skills: [
          "Git",
          "GitHub",
          "Public Speaking",
          "Mentoring",
          "Technical Documentation"
        ],
        reflection: {
          whatIDid: "Prepared the starter repository with practice issues, wrote a step-by-step cheat sheet, and guided participants through resolving merge conflicts.",
          whatILearned: "Learned that explaining technical concepts to beginners requires clear visual diagrams and patience when troubleshooting environment setup.",
          challenge: "Helping students fix SSH key and credential manager issues across both Windows and macOS laptops during the live session.",
          nextStep: "Record short 5-minute video walkthroughs for common Git commands to share before future club workshops."
        },
        evidence: [
          "https://github.com/example/cs-club-git-workshop",
          "https://example.com/git-workshop-slides"
        ]
      }
    ]
  }
];

document.addEventListener('DOMContentLoaded', function () {
  // 0. ตรวจสอบและเตรียมข้อมูลเริ่มต้นใน localStorage พร้อมปุ่ม Reset Data (Issue #12)
  if (!localStorage.getItem("portfolios")) {
    localStorage.setItem("portfolios", JSON.stringify(initialPortfolios));
  }

  const resetBtn = document.getElementById("btn-reset-data");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Are you sure you want to reset all data to default samples?")) {
        localStorage.setItem("portfolios", JSON.stringify(initialPortfolios));
        alert("Sample data has been reset successfully.");
        location.reload();
      }
    });
  }

  // 0.5 แสดงจำนวน Portfolio, ตัวเลือก Dropdown และข้อมูลรายละเอียด (Issue #11)
  const portfolioCountEl = document.getElementById("portfolio-count");
  const portfolioSelectEl = document.getElementById("portfolio-select");
  const viewWhatEnjoyEl = document.getElementById("view-what-enjoy");
  const viewWhatTriedEl = document.getElementById("view-what-tried");
  const viewWhatCuriousEl = document.getElementById("view-what-curious");
  const portfolioItemsCountEl = document.getElementById("portfolio-items-count");

  function getPortfoliosFromStorage() {
    try {
      return JSON.parse(localStorage.getItem("portfolios")) || [];
    } catch (e) {
      return [];
    }
  }

  function renderPortfolioView(portfolio) {
    if (!portfolio) {
      if (viewWhatEnjoyEl) viewWhatEnjoyEl.textContent = "-";
      if (viewWhatTriedEl) viewWhatTriedEl.textContent = "-";
      if (viewWhatCuriousEl) viewWhatCuriousEl.textContent = "-";
      if (portfolioItemsCountEl) portfolioItemsCountEl.textContent = "0";
      return;
    }
    if (viewWhatEnjoyEl) viewWhatEnjoyEl.textContent = portfolio.whatIEnjoy || "-";
    if (viewWhatTriedEl) viewWhatTriedEl.textContent = portfolio.whatIveTried || "-";
    if (viewWhatCuriousEl) viewWhatCuriousEl.textContent = portfolio.whatImCuriousAbout || "-";
    if (portfolioItemsCountEl) {
      const itemsLength = Array.isArray(portfolio.items) ? portfolio.items.length : 0;
      portfolioItemsCountEl.textContent = itemsLength;
    }
  }

  const portfolios = getPortfoliosFromStorage();

  if (portfolioCountEl) {
    portfolioCountEl.textContent = portfolios.length;
  }

  if (portfolioSelectEl) {
    portfolioSelectEl.innerHTML = '<option value="" disabled selected>-- เลือก Portfolio --</option>';
    portfolios.forEach(function (p) {
      const option = document.createElement("option");
      option.value = p.portfolioId;
      option.textContent = p.name;
      portfolioSelectEl.appendChild(option);
    });

    const savedPortfolioId = localStorage.getItem("currentPortfolioId");
    const initialSelectedPortfolio =
      portfolios.find(function (p) {
        return p.portfolioId === savedPortfolioId;
      }) || portfolios[0] || null;

    if (initialSelectedPortfolio) {
      portfolioSelectEl.value = initialSelectedPortfolio.portfolioId;
      localStorage.setItem("currentPortfolioId", initialSelectedPortfolio.portfolioId);
      renderPortfolioView(initialSelectedPortfolio);
    } else {
      renderPortfolioView(null);
    }

    portfolioSelectEl.addEventListener("change", function (event) {
      const selectedId = event.target.value;
      const currentPortfolios = getPortfoliosFromStorage();
      const selectedPortfolio = currentPortfolios.find(function (p) {
        return p.portfolioId === selectedId;
      });
      if (selectedPortfolio) {
        localStorage.setItem("currentPortfolioId", selectedPortfolio.portfolioId);
      }
      renderPortfolioView(selectedPortfolio);
    });
  }

  // 1. จัดการฟอร์มสร้าง Portfolio ด้านบน (ถ้ามี)
  const portfolioForm = document.getElementById('portfolio-form');
  if (portfolioForm) {
    portfolioForm.addEventListener('submit', function (event) {
      if (!portfolioForm.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        event.preventDefault();

        const newPortfolio = {
          portfolioId: "port-" + Date.now(),
          name: document.getElementById('p-name').value.trim(),
          whatIEnjoy: document.getElementById('p-enjoy').value.trim(),
          whatIveTried: document.getElementById('p-tried').value.trim(),
          whatImCuriousAbout: document.getElementById('p-curious').value.trim(),
          items: []
        };

        const currentPortfolios = getPortfoliosFromStorage();
        currentPortfolios.push(newPortfolio);
        localStorage.setItem("portfolios", JSON.stringify(currentPortfolios));
        localStorage.setItem("currentPortfolioId", newPortfolio.portfolioId);

        if (portfolioCountEl) {
          portfolioCountEl.textContent = currentPortfolios.length;
        }

        if (portfolioSelectEl) {
          const option = document.createElement("option");
          option.value = newPortfolio.portfolioId;
          option.textContent = newPortfolio.name;
          portfolioSelectEl.appendChild(option);
          portfolioSelectEl.value = newPortfolio.portfolioId;
        }

        renderPortfolioView(newPortfolio);

        // ตัวอย่างการแสดงสถานะเมื่อบันทึกสำเร็จๆ
        alert('บันทึกข้อมูล Portfolio สำเร็จเรียบร้อยแล้ว!');

        portfolioForm.reset();
        portfolioForm.classList.remove('was-validated');
        return;
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

// ตัวอย่างเมื่อบันทึกสำเร็จ
const statusMessage = document.getElementById('save-status-message');
if (statusMessage) {
  statusMessage.textContent = 'บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว!';
  statusMessage.className = 'alert alert-success mt-3'; // ใช้คลาสแจ้งเตือนสีเขียวของ Bootstrap
  statusMessage.style.display = 'block';
  
  // ซ่อนข้อความแจ้งเตือนอัตโนมัติหลังผ่านไป 3 วินาที
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}