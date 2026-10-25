/*
 * Bộ ca kiểm thử chuẩn cho js/lib/formulas.js.
 * Chạy: node tests/formulas.test.js   hoặc mở tests/index.html qua máy chủ tĩnh.
 * Giá trị mong đợi được tính độc lập bằng Python (cài đặt riêng, không dùng mã JS này).
 */
(function (root) {
  'use strict';
  var F = (typeof require === 'function' && typeof module === 'object')
    ? require('../js/lib/formulas.js') : root.CDSSFormulas;
  var log = [], pass = 0, fail = 0;

  function line(ok, name, extra) {
    ok ? pass++ : fail++;
    log.push((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' | ' + extra));
  }
  function near(name, actual, expected, tol) {
    line(Number.isFinite(actual) && Math.abs(actual - expected) <= tol, name, 'nhận ' + actual + ', mong đợi ' + expected);
  }
  function eq(name, actual, expected) {
    line(actual === expected, name, 'nhận ' + JSON.stringify(actual) + ', mong đợi ' + JSON.stringify(expected));
  }
  function invalid(name, r) { line(r.ok === false && r.errors.length > 0, name, 'phải báo lỗi, nhận ok=' + r.ok); }
  function warned(name, r) { line(r.warnings.length > 0, name, 'phải có cảnh báo'); }

  // --- Quy đổi creatinine (một điểm duy nhất) ---
  near('88,4 µmol/L → 1,00 mg/dL', F.creatinineToMgDl(88.4, 'umol'), 1.0, 1e-9);
  near('1 mg/dL giữ nguyên', F.creatinineToMgDl(1, 'mgdl'), 1.0, 0);
  near('"1,2" (dấu phẩy) mg/dL → 1,2', F.creatinineToMgDl('1,2', 'mgdl'), 1.2, 1e-9);
  eq('Rỗng → NaN', Number.isNaN(F.creatinineToMgDl('', 'umol')), true);
  eq('Chữ → NaN', Number.isNaN(F.creatinineToMgDl('abc', 'mgdl')), true);
  eq('"1.2.3" → NaN', Number.isNaN(F.creatinineToMgDl('1.2.3', 'mgdl')), true);
  eq('Đơn vị lạ → NaN', Number.isNaN(F.creatinineToMgDl(1, 'mmol')), true);

  // --- Hiển thị số ---
  eq('fmt 7288,4 không phân nhóm hàng nghìn', F.fmt(7288.4, 1), '7288,4');
  eq('fmt NaN → —', F.fmt(NaN, 1), '—');

  // --- Cockcroft-Gault ---
  near('CG nam 60 t, 72 kg, 1,0 mg/dL = 80,0', F.cockcroftGault({ age: 60, weightKg: 72, scr: 1, scrUnit: 'mgdl', sex: 'male' }).value, 80.0, 0.01);
  near('CG nữ cùng thông số = 68,0', F.cockcroftGault({ age: 60, weightKg: 72, scr: 1, scrUnit: 'mgdl', sex: 'female' }).value, 68.0, 0.01);
  near('CG nam 60 t, 72 kg, 88,4 µmol/L = 80,0 (tương đương đơn vị)', F.cockcroftGault({ age: 60, weightKg: 72, scr: 88.4, scrUnit: 'umol', sex: 'male' }).value, 80.0, 0.01);
  near('CG nữ 85 t, 50 kg, 2,0 mg/dL (suy thận, cao tuổi) = 16,23', F.cockcroftGault({ age: 85, weightKg: 50, scr: 2, scrUnit: 'mgdl', sex: 'female' }).value, 16.233, 0.01);
  near('CG nam 18 t (ngưỡng tuổi), 70 kg, 0,8 mg/dL = 148,26', F.cockcroftGault({ age: 18, weightKg: 70, scr: 0.8, scrUnit: 'mgdl', sex: 'male' }).value, 148.264, 0.01);
  invalid('CG 17 tuổi (trẻ em) → lỗi', F.cockcroftGault({ age: 17, weightKg: 50, scr: 0.6, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CG creatinine 0 → lỗi', F.cockcroftGault({ age: 50, weightKg: 70, scr: 0, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CG creatinine âm → lỗi', F.cockcroftGault({ age: 50, weightKg: 70, scr: -1, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CG cân nặng rỗng → lỗi', F.cockcroftGault({ age: 50, weightKg: '', scr: 1, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CG chưa chọn giới → lỗi', F.cockcroftGault({ age: 50, weightKg: 70, scr: 1, scrUnit: 'mgdl', sex: '' }));
  invalid('CG tuổi 121 → lỗi', F.cockcroftGault({ age: 121, weightKg: 70, scr: 1, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CG nhập 88 nhưng chọn nhầm mg/dL → lỗi, không ra kết quả', F.cockcroftGault({ age: 50, weightKg: 70, scr: 88, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CG nhập 1,0 nhưng đang chọn µmol/L → lỗi, không ra kết quả', F.cockcroftGault({ age: 50, weightKg: 70, scr: '1,0', scrUnit: 'umol', sex: 'male' }));
  near('CG ngưỡng trên 25 mg/dL vẫn tính', F.cockcroftGault({ age: 50, weightKg: 70, scr: 25, scrUnit: 'mgdl', sex: 'male' }).value, 3.5, 0.01);
  invalid('CG 25,1 mg/dL → lỗi', F.cockcroftGault({ age: 50, weightKg: 70, scr: 25.1, scrUnit: 'mgdl', sex: 'male' }));
  warned('CG 18 mg/dL → tính được nhưng cảnh báo', F.cockcroftGault({ age: 50, weightKg: 70, scr: 18, scrUnit: 'mgdl', sex: 'male' }));
  warned('CG 0,15 mg/dL → tính được nhưng cảnh báo', F.cockcroftGault({ age: 50, weightKg: 70, scr: 0.15, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CG 0,09 mg/dL → lỗi', F.cockcroftGault({ age: 50, weightKg: 70, scr: 0.09, scrUnit: 'mgdl', sex: 'male' }));
  warned('CG cân nặng 250 kg → cảnh báo', F.cockcroftGault({ age: 50, weightKg: 250, scr: 1, scrUnit: 'mgdl', sex: 'male' }));

  // --- CKD-EPI 2021 ---
  near('CKD-EPI nam 50 t, 1,0 mg/dL = 91,69', F.ckdEpi2021({ age: 50, scr: 1, scrUnit: 'mgdl', sex: 'male' }).value, 91.691, 0.01);
  near('CKD-EPI nam 50 t, 88,4 µmol/L = 91,69 (tương đương đơn vị)', F.ckdEpi2021({ age: 50, scr: 88.4, scrUnit: 'umol', sex: 'male' }).value, 91.691, 0.01);
  near('CKD-EPI nữ 50 t, 0,7 mg/dL (Scr = κ) = 105,30', F.ckdEpi2021({ age: 50, scr: 0.7, scrUnit: 'mgdl', sex: 'female' }).value, 105.298, 0.01);
  near('CKD-EPI nữ 40 t, 0,5 mg/dL (Scr < κ) = 121,52', F.ckdEpi2021({ age: 40, scr: 0.5, scrUnit: 'mgdl', sex: 'female' }).value, 121.519, 0.01);
  near('CKD-EPI nam 70 t, 2,0 mg/dL = 35,24', F.ckdEpi2021({ age: 70, scr: 2, scrUnit: 'mgdl', sex: 'male' }).value, 35.243, 0.01);
  near('CKD-EPI nữ 65 t, 1,5 mg/dL = 38,43', F.ckdEpi2021({ age: 65, scr: 1.5, scrUnit: 'mgdl', sex: 'female' }).value, 38.434, 0.01);
  near('CKD-EPI nam 18 t (ngưỡng), 0,9 mg/dL = 126,96', F.ckdEpi2021({ age: 18, scr: 0.9, scrUnit: 'mgdl', sex: 'male' }).value, 126.961, 0.01);
  near('CKD-EPI nam 80 t, 4,0 mg/dL = 14,42', F.ckdEpi2021({ age: 80, scr: 4, scrUnit: 'mgdl', sex: 'male' }).value, 14.415, 0.01);
  eq('CKD-EPI nam 80 t, 4,0 mg/dL → G5', F.ckdEpi2021({ age: 80, scr: 4, scrUnit: 'mgdl', sex: 'male' }).stage.code, 'G5');
  eq('CKD-EPI nam 70 t, 2,0 mg/dL → G3b', F.ckdEpi2021({ age: 70, scr: 2, scrUnit: 'mgdl', sex: 'male' }).stage.code, 'G3b');
  invalid('CKD-EPI 10 tuổi → lỗi (dùng Schwartz)', F.ckdEpi2021({ age: 10, scr: 0.5, scrUnit: 'mgdl', sex: 'male' }));
  invalid('CKD-EPI tuổi chữ → lỗi', F.ckdEpi2021({ age: 'abc', scr: 1, scrUnit: 'mgdl', sex: 'male' }));

  // --- Phân độ KDIGO, sát ngưỡng ---
  [[90, 'G1'], [89.9, 'G2'], [60, 'G2'], [59.9, 'G3a'], [45, 'G3a'], [44.9, 'G3b'], [30, 'G3b'], [29.9, 'G4'], [15, 'G4'], [14.9, 'G5'], [0, 'G5']]
    .forEach(function (c) { eq('KDIGO ' + c[0] + ' → ' + c[1], F.kdigoGStage(c[0]).code, c[1]); });

  // --- Schwartz bedside ---
  near('Schwartz 8 t, 100 cm, 0,5 mg/dL = 82,6', F.schwartzBedside({ age: 8, heightCm: 100, scr: 0.5, scrUnit: 'mgdl' }).value, 82.6, 0.01);
  near('Schwartz 12 t, 120 cm, 44,2 µmol/L = 99,12', F.schwartzBedside({ age: 12, heightCm: 120, scr: 44.2, scrUnit: 'umol' }).value, 99.12, 0.01);
  invalid('Schwartz 18 tuổi → lỗi (dùng CKD-EPI)', F.schwartzBedside({ age: 18, heightCm: 170, scr: 0.8, scrUnit: 'mgdl' }));
  invalid('Schwartz chiều cao 0 → lỗi', F.schwartzBedside({ age: 8, heightCm: 0, scr: 0.5, scrUnit: 'mgdl' }));
  warned('Schwartz 0,5 tuổi → cảnh báo ngoài khoảng nghiên cứu', F.schwartzBedside({ age: 0.5, heightCm: 65, scr: 0.3, scrUnit: 'mgdl' }));
  warned('Schwartz 17 tuổi → cảnh báo ngoài khoảng nghiên cứu', F.schwartzBedside({ age: 17, heightCm: 170, scr: 0.8, scrUnit: 'mgdl' }));

  // --- BSA Mosteller ---
  near('BSA 180 cm, 80 kg = 2,00', F.bsaMosteller({ heightCm: 180, weightKg: 80 }).value, 2.0, 1e-9);
  near('BSA 160 cm, 60 kg = 1,633', F.bsaMosteller({ heightCm: 160, weightKg: 60 }).value, 1.633, 0.001);
  near('BSA sơ sinh 50 cm, 3,5 kg = 0,220', F.bsaMosteller({ heightCm: 50, weightKg: 3.5 }).value, 0.2205, 0.001);
  invalid('BSA cân nặng 0 → lỗi', F.bsaMosteller({ heightCm: 160, weightKg: 0 }));
  invalid('BSA chiều cao rỗng → lỗi', F.bsaMosteller({ heightCm: '', weightKg: 60 }));

  // --- BMI + phân loại WHO, sát ngưỡng ---
  near('BMI 80 kg, 180 cm = 24,69', F.bmi({ weightKg: 80, heightCm: 180 }).value, 24.691, 0.001);
  eq('BMI 64 kg, 160 cm = đúng 25,0 → Tiền béo phì (bẫy dấu phẩy động)', F.bmi({ weightKg: 64, heightCm: 160 }).category, 'Tiền béo phì');
  eq('BMI 18,4 → Thiếu cân', F.bmiCategoryWHO(18.4), 'Thiếu cân');
  eq('BMI 18,5 → Bình thường', F.bmiCategoryWHO(18.5), 'Bình thường');
  eq('BMI 24,9 → Bình thường', F.bmiCategoryWHO(24.9), 'Bình thường');
  eq('BMI 25,0 → Tiền béo phì', F.bmiCategoryWHO(25), 'Tiền béo phì');
  eq('BMI 30,0 → Béo phì độ I', F.bmiCategoryWHO(30), 'Béo phì độ I');
  eq('BMI 35,0 → Béo phì độ II', F.bmiCategoryWHO(35), 'Béo phì độ II');
  eq('BMI 40,0 → Béo phì độ III', F.bmiCategoryWHO(40), 'Béo phì độ III');
  eq('BMI 24,96 hiển thị 25,0 → phân loại theo số hiển thị: Tiền béo phì', F.bmi({ weightKg: 63.9, heightCm: 160 }).category, 'Tiền béo phì');
  invalid('BMI chiều cao âm → lỗi', F.bmi({ weightKg: 60, heightCm: -160 }));
  warned('BMI chiều cao 1,6 (nhập nhầm mét) → cảnh báo', F.bmi({ weightKg: 60, heightCm: 1.6 }));

  log.push('', 'Tổng: ' + pass + ' đạt, ' + fail + ' lỗi');
  var out = { pass: pass, fail: fail, log: log };
  if (typeof module === 'object' && module.exports && typeof require === 'function' && require.main === module) {
    console.log(log.join('\n'));
    process.exit(fail ? 1 : 0);
  } else {
    root.CDSSTestResult = out;
  }
})(typeof self !== 'undefined' ? self : this);
