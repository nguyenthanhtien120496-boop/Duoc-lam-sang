/*
 * Thành phần giao diện dùng chung cho các công cụ tính. Không chứa công thức (xem formulas.js).
 * Không lưu dữ liệu nhập vào localStorage/IndexedDB và không gửi đi đâu.
 */
(function () {
  'use strict';
  var App = window.CDSSApp, esc = App.util.esc, icon = App.util.icon, F = window.CDSSFormulas;

  function numField(id, label, unit, hint, attrs) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + (unit ? ' (' + esc(unit) + ')' : '') + '</label>' +
      '<input class="inp" id="' + id + '" name="' + id + '" inputmode="decimal" autocomplete="off" ' + (attrs || '') + '>' +
      (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') + '</div>';
  }

  function creatinineField(id) {
    return '<div class="field"><label for="' + id + '">Creatinine huyết thanh</label><div class="inp-row">' +
      '<input class="inp" id="' + id + '" name="' + id + '" inputmode="decimal" autocomplete="off" placeholder="vd: 80">' +
      '<label class="sr-only" for="' + id + '-unit">Đơn vị creatinine</label>' +
      '<select class="sel" id="' + id + '-unit" name="' + id + '-unit">' +
      '<option value="umol" selected>µmol/L</option><option value="mgdl">mg/dL</option></select></div>' +
      '<div class="hint">1 mg/dL = 88,4 µmol/L. Kiểm tra đúng đơn vị trên phiếu xét nghiệm.</div></div>';
  }

  function sexField(name) {
    return '<div class="field"><span class="lbl" id="' + name + '-lbl">Giới tính</span>' +
      '<div class="seg" role="radiogroup" aria-labelledby="' + name + '-lbl">' +
      '<input type="radio" id="' + name + '-m" name="' + name + '" value="male"><label for="' + name + '-m">Nam</label>' +
      '<input type="radio" id="' + name + '-f" name="' + name + '" value="female"><label for="' + name + '-f">Nữ</label></div></div>';
  }

  function sourceCard(ids) {
    var fd = App.data.formulas;
    if (!fd) {
      return '<section class="card source"><h2>Nguồn</h2><div class="notice negative">' + icon('alert') +
        '<p>Không tải được data/formulas.json nên chưa hiển thị được nguồn trích dẫn. Không dùng kết quả khi chưa đối chiếu nguồn.</p></div></section>';
    }
    var recs = fd.records.filter(function (r) { return ids.indexOf(r.id) !== -1; });
    var refNums = [];
    recs.forEach(function (r) { r.refs.forEach(function (n) { if (refNums.indexOf(n) === -1) refNums.push(n); }); });
    var refs = fd.references.filter(function (x) { return refNums.indexOf(x.n) !== -1; });
    var badge = fd.status === 'verified'
      ? '<span class="chip positive">Đã kiểm chứng</span>'
      : '<span class="chip caution">Chưa kiểm chứng</span>';
    var html = '<section class="card source"><h2>Công thức và nguồn ' + badge + '</h2>';
    recs.forEach(function (r) {
      html += '<h3>' + esc(r.name) + '</h3><code>' + esc(r.expression) + '</code>' +
        '<p style="margin:6px 0 12px">Đối tượng: ' + esc(r.population) + ' · Tài liệu tham khảo: ' + r.refs.join(', ') + '</p>';
    });
    html += '<ol>' + refs.map(function (x) { return '<li value="' + x.n + '">' + esc(x.text) + '</li>'; }).join('') + '</ol>';
    html += '<p style="margin-top:10px">Dữ liệu công thức v' + esc(fd.version) + ', cập nhật ' + esc(fd.updated) + '.</p></section>';
    return html;
  }

  // Dựng khung trang công cụ tính: cảnh báo + biểu mẫu + kết quả + nguồn.
  function shell(view, opts) {
    view.innerHTML = '<div class="page">' +
      '<div class="notice caution">' + icon('alert') + '<p><b>Công cụ hỗ trợ quyết định, không thay thế phán đoán lâm sàng.</b> ' +
      'Công thức chưa được người thứ hai (dược sĩ hoặc bác sĩ) đối chiếu với tài liệu gốc. Dữ liệu nhập chỉ được tính trên trình duyệt, không gửi đi và không lưu lại.</p></div>' +
      (opts.intro || '') +
      '<div class="grid cols-2">' +
      '<section class="card"><h2>Thông số</h2><form class="form" novalidate autocomplete="off">' + opts.fields +
      '<div><button class="btn" type="reset">Xóa dữ liệu</button></div></form></section>' +
      '<section class="card" aria-live="polite"><h2>Kết quả</h2><div class="result"><p class="placeholder">Nhập đủ thông số để xem kết quả.</p></div></section>' +
      '</div><div style="margin-top:14px">' + sourceCard(opts.formulaIds) + '</div></div>';
    var form = view.querySelector('form'), out = view.querySelector('.result');
    function update() { opts.compute(read(form), out); }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('reset', function () { setTimeout(update, 0); });
    form.addEventListener('submit', function (e) { e.preventDefault(); update(); });
    update();
    return { form: form, out: out };
  }

  function read(form) {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; else if (!(el.name in v)) v[el.name] = ''; }
      else v[el.name] = el.value;
    });
    return v;
  }

  function hasAnyInput(values, keys) {
    return keys.some(function (k) { return String(values[k] || '').trim() !== ''; });
  }

  function listHTML(cls, items) {
    if (!items.length) return '';
    return '<div class="notice ' + cls + '" style="margin:12px 0 0">' + icon(cls === 'negative' ? 'alert' : 'info') +
      '<ul style="margin:0;padding-left:18px">' + items.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>';
  }

  // Hiển thị kết quả chuẩn: số kèm đơn vị, lỗi, cảnh báo.
  function renderResult(out, r, digits, extra) {
    if (!r.ok) {
      out.innerHTML = '<p class="placeholder">Chưa tính được kết quả.</p>' + listHTML('negative', r.errors) + listHTML('caution', r.warnings);
      return;
    }
    out.innerHTML = '<div class="big">' + F.fmt(r.value, digits) + '<small>' + esc(r.unit) + '</small></div>' +
      (extra || '') + listHTML('caution', r.warnings);
  }

  function placeholder(out) { out.innerHTML = '<p class="placeholder">Nhập đủ thông số để xem kết quả.</p>'; }

  window.CDSSCalcUI = {
    numField: numField, creatinineField: creatinineField, sexField: sexField,
    shell: shell, renderResult: renderResult, placeholder: placeholder, hasAnyInput: hasAnyInput, sourceCard: sourceCard
  };
})();
