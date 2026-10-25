/* Module: CrCl Cockcroft-Gault. Chỉ ghi vào view được cấp. */
(function () {
  'use strict';
  var F = window.CDSSFormulas, UI = window.CDSSCalcUI;

  window.CDSSApp.register('calc/crcl', {
    title: 'Độ thanh thải creatinine (Cockcroft-Gault)',
    crumb: 'Công cụ tính ›',
    render: function (view) {
      UI.shell(view, {
        formulaIds: ['crcl', 'creatinine-unit'],
        fields:
          UI.numField('age', 'Tuổi', 'năm', 'Người lớn ≥ 18 tuổi.') +
          UI.numField('weight', 'Cân nặng', 'kg') +
          UI.creatinineField('scr') +
          UI.sexField('sex'),
        compute: function (v, out) {
          if (!UI.hasAnyInput(v, ['age', 'weight', 'scr'])) { UI.placeholder(out); return; }
          var r = F.cockcroftGault({ age: v.age, weightKg: v.weight, scr: v.scr, scrUnit: v['scr-unit'], sex: v.sex });
          var extra = r.ok
            ? '<p class="sub">Creatinine dùng để tính: ' + F.fmt(r.scrMgDl, 2) + ' mg/dL = ' +
              F.fmt(r.scrMgDl * F.CREAT_UMOL_PER_MGDL, 1) + ' µmol/L. ' +
              (v.sex === 'female' ? 'Đã nhân hệ số 0,85 cho nữ. ' : '') +
              'Kết quả tính bằng mL/phút, không chuẩn hóa theo 1,73 m² diện tích da.</p>'
            : '';
          UI.renderResult(out, r, 1, extra);
        }
      });
    }
  });
})();
