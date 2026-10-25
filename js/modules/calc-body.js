/* Module: BMI (phân loại WHO người lớn) và BSA Mosteller. */
(function () {
  'use strict';
  var App = window.CDSSApp, F = window.CDSSFormulas, UI = window.CDSSCalcUI, esc = App.util.esc;

  var BMI_ROWS = [
    ['Thiếu cân', '< 18,5'],
    ['Bình thường', '18,5–24,9'],
    ['Tiền béo phì', '25,0–29,9'],
    ['Béo phì độ I', '30,0–34,9'],
    ['Béo phì độ II', '35,0–39,9'],
    ['Béo phì độ III', '≥ 40,0']
  ];

  App.register('calc/body', {
    title: 'BMI và diện tích da (BSA)',
    crumb: 'Công cụ tính ›',
    render: function (view) {
      UI.shell(view, {
        formulaIds: ['bsa-mosteller', 'bmi-who'],
        fields: UI.numField('weight', 'Cân nặng', 'kg') + UI.numField('height', 'Chiều cao', 'cm', 'Nhập bằng cm, vd: 160.'),
        compute: function (v, out) {
          if (!UI.hasAnyInput(v, ['weight', 'height'])) { UI.placeholder(out); return; }
          var bsa = F.bsaMosteller({ weightKg: v.weight, heightCm: v.height });
          var bmi = F.bmi({ weightKg: v.weight, heightCm: v.height });
          if (!bsa.ok) { UI.renderResult(out, bsa, 2); return; }
          var table = '<table class="kv"><caption class="sr-only">Phân loại BMI người lớn theo WHO</caption>' +
            '<thead><tr><th scope="col">Phân loại WHO (người lớn)</th><th scope="col">BMI (kg/m²)</th></tr></thead><tbody>' +
            BMI_ROWS.map(function (row) {
              var hit = row[0] === bmi.category;
              return '<tr' + (hit ? ' class="is-hit"' : '') + '><th scope="row">' + esc(row[0]) + (hit ? ' ◀ kết quả' : '') + '</th><td>' + row[1] + '</td></tr>';
            }).join('') + '</tbody></table>';
          var extra = '<p class="sub">Diện tích da (Mosteller)</p>' +
            '<div class="big" style="margin-top:14px">' + F.fmt(bmi.value, 1) + '<small>kg/m²</small></div>' +
            '<p class="sub">Chỉ số khối cơ thể (BMI) · <span class="hl">' + esc(bmi.category) + '</span></p>' + table +
            '<p class="sub">Phân loại WHO chỉ áp dụng cho người lớn. Trẻ em đánh giá BMI theo tuổi và giới (biểu đồ tăng trưởng).</p>';
          UI.renderResult(out, bsa, 2, extra);
        }
      });
    }
  });
})();
