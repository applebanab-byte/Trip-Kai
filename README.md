# Trip Planner (index.html + Google Sheet)

## ติดตั้ง (ประมาณ 5 นาที)
1. สร้าง Google Sheet ใหม่ (ชื่ออะไรก็ได้)
2. เมนู **ส่วนขยาย > Apps Script** ลบโค้ดเดิม แล้ววางเนื้อหาจาก `Code.gs` บันทึก
3. (ไม่บังคับ) ตั้ง `PASSCODE` ใน `Code.gs` และใน `index.html` ให้ตรงกัน
4. กด **Deploy > New deployment** > ประเภท **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วอนุญาตสิทธิ์ (Advanced > Go to project) คัดลอก URL ที่ลงท้าย `/exec`
5. ใส่ URL ที่ค่า `API_URL` บนสุดของ `<script>` ใน `index.html` (ไม่มีหน้าตั้งค่าในเว็บ เพื่อนเปิดใช้ได้ทันที)
6. แชร์ไฟล์ (หรือโฮสต์บน GitHub Pages) ให้เพื่อน ทุกคนเห็นข้อมูลชุดเดียวกัน

## หมายเหตุ
- แก้ `Code.gs` แล้วต้อง Deploy > Manage deployments > Edit > New version ใหม่ทุกครั้ง
- ข้อมูลอยู่ในแท็บ Places / Votes / Expenses / Members ของ Sheet แก้ไขตรงๆ ได้
- ใครมี URL ก็เขียนข้อมูลได้ ถ้าห่วงให้ใช้ PASSCODE (ป้องกันแบบพื้นฐาน เพราะรหัสอยู่ในไฟล์ html)
