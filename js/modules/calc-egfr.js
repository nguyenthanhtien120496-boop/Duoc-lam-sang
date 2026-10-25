/* Module: eGFR – CKD-EPI 2021 (người lớn) và Schwartz bedside (trẻ em), kèm phân độ KDIGO G. */
(function () {
  'use strict';
  var App = window.CDSSApp, F = window.CDSSFormulas, UI = window.CDSSCalcUI, esc = App.util.esc;

  var STAGES = [
    ['G1', '≥ 90', 'Bình thường hoặc cao'],
    ['G2', '60–89', 'Giảm nhẹ'],
    ['G3a', '45–59', 'Giảm nhẹ đến trung bình'],
    ['G3b', '30–44', 'Giảm trung bình đến nặng'],
    ['G4', '15–29', 'Giảm nặng'],
    ['G5', '< 15', 'Suy thận']
  ];

  function stageTable(code) {
    return '<table class="kv"><caption class="sr-only">Phân độ G theo KDIGO 2012</caption>' +
      '<thead><tr><th scope="col">Độ</th><th scope="col">eGFR (mL/phút/1,73 m²) – mô tả</th></tr></thead><tbody>' +
      STAGES.map(function (s) {
        var hit = s[0] === code;
        return '<tr' + (hit ? ' class="is-hit"' : '') + '><th scope="row">' + s[0] + (hit ? ' ◀ kết quả' : '') + '</th><td>' +
          s[1] + ' – ' + esc(s[2]) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p class="sub">Phân độ chỉ dựa trên một lần đo. Chẩn đoán bệnh thận mạn theo KDIGO 2012 cần bất thường kéo dài trên 3 tháng.</p>';
  }

  function adultForm() {
    return UI.numField('age', 'Tuổi', 'năm', 'Người lớn ≥ 18 tuổi.') + UI.creatinineField('scr') + UI.sexField('sex');
  }
  function childForm() {
    return UI.numField('age', 'Tuổi', 'năm', 'Dưới 18 tuổi. Có thể nhập số lẻ, vd: 2,5.') +
      UI.numField('height', 'Chiều cao', 'cm') + UI.creatinineField('scr');
  }

  App.register('calc/egfr', {
    title: 'eGFR – CKD-EPI 2021 / Schwartz',
    crumb: 'Công cụ tính ›',
    render: function (view) {
      var mode = 'adult';
      function draw() {
        var intro = '<div class="tabs" role="tablist" aria-label="Đối tượng">' +
          '<button type="button" role="tab" data-mode="adult" aria-selected="' + (mode === 'adult') + '">Người lớn – CKD-EPI 2021</button>' +
          '<button type="button" role="tab" data-mode="child" aria-selected="' + (mode === 'child') + '">Trẻ em – Schwartz bedside</button></div>';
        UI.shell(view, {
          intro: intro,
          formulaIds: mode === 'adult' ? ['egfr-ckdepi-2021', 'kdigo-g-stage', 'creatinine-unit'] : ['egfr-schwartz-2009', 'kdigo-g-stage', 'creatinine-unit'],
          fields: mode === 'adult' ? adultForm() : childForm(),
          compute: function (v, out) {
            var keys = mode === 'adult' ? ['age', 'scr'] : ['age', 'height', 'scr'];
            if (!UI.hasAnyInput(v, keys)) { UI.placeholder(out); return; }
            var r = mode === 'adult'
              ? F.ckdEpi2021({ age: v.age, scr: v.scr, scrUnit: v['scr-unit'], sex: v.sex })
              : F.schwartzBedside({ age: v.age, heightCm: v.height, scr: v.scr, scrUnit: v['scr-unit'] });
            var extra = r.ok
              ? '<p class="sub">Creatinine dùng để tính: ' + F.fmt(r.scrMgDl, 2) + ' mg/dL = ' +
                F.fmt(r.scrMgDl * F.CREAT_UMOL_PER_MGDL, 1) + ' µmol/L.</p>' +
                '<p class="sub"><span class="hl">' + r.stage.code + ' – ' + esc(r.stage.label) + '</span></p>' + stageTable(r.stage.code)
              : '';
            UI.renderResult(out, r, 1, extra);
          }
        });
        Array.prototype.forEach.call(view.querySelectorAll('[data-mode]'), function (b) {
          b.addEventListener('click', function () {
            if (mode === b.getAttribute('data-mode')) return;
            mode = b.getAttribute('data-mode');
            draw();
            var t = view.querySelector('[data-mode="' + mode + '"]');
            if (t) t.focus();
          });
        });
      }
      draw();
    }
  });
})();
