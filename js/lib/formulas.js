/*
 * Công thức lâm sàng thuần (không đụng DOM). Dùng chung cho giao diện và bộ ca kiểm thử.
 * Nguồn Vancouver: xem data/formulas.json (refs 1–6). Trạng thái: chưa kiểm chứng bởi người thứ hai.
 * Quy tắc: creatinine chỉ được quy đổi tại MỘT hàm creatinineToMgDl().
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CDSSFormulas = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 1 mg/dL = 88,4 µmol/L (KDIGO 2012, ref 6)
  var CREAT_UMOL_PER_MGDL = 88.4;

  // Chuỗi rỗng, null, chữ → NaN. Chấp nhận dấu thập phân kiểu Việt Nam "1,2".
  function parseNum(v) {
    if (v === '' || v === null || v === undefined) return NaN;
    if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
    var s = String(v).trim().replace(/\s/g, '');
    if (s === '') return NaN;
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    var n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  // ĐIỂM QUY ĐỔI DUY NHẤT cho creatinine. unit: 'umol' | 'mgdl'.
  function creatinineToMgDl(value, unit) {
    var v = parseNum(value);
    if (!Number.isFinite(v)) return NaN;
    if (unit === 'umol') return v / CREAT_UMOL_PER_MGDL;
    if (unit === 'mgdl') return v;
    return NaN;
  }

  // Phân loại dựa trên giá trị đã làm tròn 1 chữ số thập phân, khớp với số hiển thị.
  function round1(n) { return Math.round(n * 10) / 10; }

  function result() { return { ok: false, value: NaN, unit: '', errors: [], warnings: [] }; }

  // Kiểm tra creatinine chung; trả về giá trị mg/dL hoặc NaN (đã ghi lỗi).
  function checkScr(r, scr, scrUnit) {
    if (scrUnit !== 'umol' && scrUnit !== 'mgdl') { r.errors.push('Chưa chọn đơn vị creatinine.'); return NaN; }
    var mg = creatinineToMgDl(scr, scrUnit);
    if (!Number.isFinite(mg)) { r.errors.push('Creatinine huyết thanh chưa nhập hoặc không phải số.'); return NaN; }
    if (mg <= 0) { r.errors.push('Creatinine huyết thanh phải lớn hơn 0.'); return NaN; }
    // Ngoài khoảng sinh lý: gần như chắc chắn nhầm đơn vị (vd: nhập 1,0 mg/dL khi đang chọn µmol/L) → không tính.
    if (mg < 0.1 || mg > 25) {
      r.errors.push('Creatinine ' + fmt(mg, 3) + ' mg/dL (' + fmt(mg * CREAT_UMOL_PER_MGDL, 1) +
        ' µmol/L) nằm ngoài khoảng sinh lý. Kiểm tra lại giá trị và đơn vị đã chọn.');
      return NaN;
    }
    if (mg < 0.2 || mg > 15) {
      r.warnings.push('Creatinine ' + fmt(mg, 2) + ' mg/dL (' + fmt(mg * CREAT_UMOL_PER_MGDL, 0) +
        ' µmol/L) nằm ngoài khoảng thường gặp 0,2–15 mg/dL. Kiểm tra lại giá trị và đơn vị.');
    }
    return mg;
  }

  function checkSex(r, sex) {
    if (sex !== 'male' && sex !== 'female') { r.errors.push('Chưa chọn giới tính.'); return false; }
    return true;
  }

  function checkAdultAge(r, ageRaw, formulaName) {
    var age = parseNum(ageRaw);
    if (!Number.isFinite(age)) { r.errors.push('Tuổi chưa nhập hoặc không phải số.'); return NaN; }
    if (age < 18) { r.errors.push(formulaName + ' chỉ áp dụng cho người lớn ≥ 18 tuổi. Với trẻ em dùng công thức Schwartz.'); return NaN; }
    if (age > 120) { r.errors.push('Tuổi > 120 nằm ngoài khoảng sinh lý.'); return NaN; }
    return age;
  }

  function fmt(n, d) {
    if (!Number.isFinite(n)) return '—';
    // Không phân nhóm hàng nghìn: "7.288" dễ bị đọc nhầm là số thập phân.
    return n.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
  }

  // Cockcroft-Gault (ref 1). Kết quả mL/phút, không chuẩn hóa theo diện tích da.
  function cockcroftGault(p) {
    var r = result(); r.unit = 'mL/phút';
    var age = checkAdultAge(r, p.age, 'Cockcroft-Gault');
    var w = parseNum(p.weightKg);
    if (!Number.isFinite(w)) r.errors.push('Cân nặng chưa nhập hoặc không phải số.');
    else if (w <= 0) r.errors.push('Cân nặng phải lớn hơn 0.');
    else if (w < 30 || w > 200) r.warnings.push('Cân nặng ' + fmt(w, 1) + ' kg nằm ngoài khoảng thường gặp ở người lớn (30–200 kg).');
    var mg = checkScr(r, p.scr, p.scrUnit);
    var sexOk = checkSex(r, p.sex);
    if (r.errors.length || !sexOk) return r;
    var v = ((140 - age) * w) / (72 * mg);
    if (p.sex === 'female') v *= 0.85;
    r.ok = true; r.value = v; r.scrMgDl = mg;
    return r;
  }

  // CKD-EPI 2021, creatinine, không hệ số chủng tộc (ref 2). Kết quả mL/phút/1,73 m².
  function ckdEpi2021(p) {
    var r = result(); r.unit = 'mL/phút/1,73 m²';
    var age = checkAdultAge(r, p.age, 'CKD-EPI 2021');
    var mg = checkScr(r, p.scr, p.scrUnit);
    var sexOk = checkSex(r, p.sex);
    if (r.errors.length || !sexOk) return r;
    var female = p.sex === 'female';
    var k = female ? 0.7 : 0.9;
    var a = female ? -0.241 : -0.302;
    var ratio = mg / k;
    var v = 142 * Math.pow(Math.min(ratio, 1), a) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, age);
    if (female) v *= 1.012;
    r.ok = true; r.value = v; r.scrMgDl = mg; r.stage = kdigoGStage(round1(v));
    return r;
  }

  // Schwartz bedside 2009 (ref 3). Kết quả mL/phút/1,73 m².
  function schwartzBedside(p) {
    var r = result(); r.unit = 'mL/phút/1,73 m²';
    var age = parseNum(p.age);
    if (!Number.isFinite(age)) r.errors.push('Tuổi chưa nhập hoặc không phải số.');
    else if (age < 0) r.errors.push('Tuổi không được âm.');
    else if (age >= 18) r.errors.push('Người ≥ 18 tuổi: dùng CKD-EPI 2021.');
    else if (age < 1 || age > 16) r.warnings.push('Tuổi ngoài khoảng của nghiên cứu gốc CKiD (1–16 tuổi); độ chính xác chưa được xác lập.');
    var h = parseNum(p.heightCm);
    if (!Number.isFinite(h)) r.errors.push('Chiều cao chưa nhập hoặc không phải số.');
    else if (h <= 0) r.errors.push('Chiều cao phải lớn hơn 0.');
    else if (h < 45 || h > 200) r.warnings.push('Chiều cao ' + fmt(h, 1) + ' cm nằm ngoài khoảng thường gặp ở trẻ em (45–200 cm).');
    var mg = checkScr(r, p.scr, p.scrUnit);
    if (r.errors.length) return r;
    r.ok = true; r.value = 0.413 * h / mg; r.scrMgDl = mg; r.stage = kdigoGStage(round1(r.value));
    return r;
  }

  // Phân độ G theo KDIGO 2012 (ref 6).
  function kdigoGStage(egfr) {
    if (!Number.isFinite(egfr)) return null;
    if (egfr >= 90) return { code: 'G1', label: 'Bình thường hoặc cao' };
    if (egfr >= 60) return { code: 'G2', label: 'Giảm nhẹ' };
    if (egfr >= 45) return { code: 'G3a', label: 'Giảm nhẹ đến trung bình' };
    if (egfr >= 30) return { code: 'G3b', label: 'Giảm trung bình đến nặng' };
    if (egfr >= 15) return { code: 'G4', label: 'Giảm nặng' };
    return { code: 'G5', label: 'Suy thận' };
  }

  function checkBody(r, p) {
    var w = parseNum(p.weightKg), h = parseNum(p.heightCm);
    if (!Number.isFinite(w)) r.errors.push('Cân nặng chưa nhập hoặc không phải số.');
    else if (w <= 0) r.errors.push('Cân nặng phải lớn hơn 0.');
    else if (w < 0.4 || w > 250) r.warnings.push('Cân nặng ' + fmt(w, 1) + ' kg nằm ngoài khoảng sinh lý thường gặp (0,4–250 kg).');
    if (!Number.isFinite(h)) r.errors.push('Chiều cao chưa nhập hoặc không phải số.');
    else if (h <= 0) r.errors.push('Chiều cao phải lớn hơn 0.');
    else if (h < 30 || h > 230) r.warnings.push('Chiều cao ' + fmt(h, 1) + ' cm nằm ngoài khoảng sinh lý thường gặp (30–230 cm).');
    return { w: w, h: h };
  }

  // BMI + phân loại WHO người lớn (ref 5).
  function bmi(p) {
    var r = result(); r.unit = 'kg/m²';
    var b = checkBody(r, p);
    if (r.errors.length) return r;
    // w × 10000 / h² tránh sai số dấu phẩy động (64 kg, 160 cm phải ra đúng 25,0).
    r.ok = true; r.value = b.w * 10000 / (b.h * b.h); r.category = bmiCategoryWHO(round1(r.value));
    return r;
  }

  function bmiCategoryWHO(v) {
    if (!Number.isFinite(v)) return null;
    if (v < 18.5) return 'Thiếu cân';
    if (v < 25) return 'Bình thường';
    if (v < 30) return 'Tiền béo phì';
    if (v < 35) return 'Béo phì độ I';
    if (v < 40) return 'Béo phì độ II';
    return 'Béo phì độ III';
  }

  // Mosteller (ref 4).
  function bsaMosteller(p) {
    var r = result(); r.unit = 'm²';
    var b = checkBody(r, p);
    if (r.errors.length) return r;
    r.ok = true; r.value = Math.sqrt(b.h * b.w / 3600);
    return r;
  }

  return {
    CREAT_UMOL_PER_MGDL: CREAT_UMOL_PER_MGDL,
    parseNum: parseNum,
    creatinineToMgDl: creatinineToMgDl,
    cockcroftGault: cockcroftGault,
    ckdEpi2021: ckdEpi2021,
    schwartzBedside: schwartzBedside,
    kdigoGStage: kdigoGStage,
    bmi: bmi,
    bmiCategoryWHO: bmiCategoryWHO,
    bsaMosteller: bsaMosteller,
    round1: round1,
    fmt: fmt
  };
});
