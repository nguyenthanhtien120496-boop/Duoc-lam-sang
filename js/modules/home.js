/* Module: Trang chủ. */
(function () {
  'use strict';
  var App = window.CDSSApp, esc = App.util.esc, icon = App.util.icon;

  function loadErrorNotice() {
    return '<div class="notice negative">' + icon('alert') + '<p><b>Không tải được dữ liệu tài liệu.</b> ' +
      'Trình duyệt chặn đọc tệp JSON khi mở trực tiếp index.html (file://). Hãy mở qua máy chủ tĩnh, ví dụ chạy ' +
      '<code>python3 -m http.server</code> trong thư mục ứng dụng rồi vào http://localhost:8000, hoặc dùng bản GitHub Pages. ' +
      'Các công cụ tính vẫn dùng được nhưng chưa hiển thị nguồn.</p></div>';
  }

  App.register('', {
    title: 'Trang chủ',
    render: function (view) {
      var d = App.data.docs;
      var nDocs = d ? d.records.length : 0, nCats = d ? d.categories.length : 0;
      var html = '<div class="page">';
      if (App.data.error) html += loadErrorNotice();
      html += '<section class="hero"><h2>Cổng Dược Lâm Sàng</h2>' +
        '<p>Tra cứu tóm tắt guideline, thông tin thuốc, so sánh dược lý và công cụ tính chức năng thận, BMI, BSA. ' +
        'Dùng thanh bên trái để chuyển mục; nhấn <b>/</b> để tìm nhanh (không cần gõ dấu).</p>' +
        '<div class="stats"><div class="stat"><b>' + nDocs + '</b><span>tài liệu</span></div>' +
        '<div class="stat"><b>' + nCats + '</b><span>nhóm tài liệu</span></div>' +
        '<div class="stat"><b>' + App.tools.length + '</b><span>công cụ tính</span></div></div></section>';

      html += '<h2 class="section-title">Công cụ tính</h2><div class="grid cols-3">' +
        App.tools.map(function (t) {
          return '<a class="tile" href="#/' + t.route + '"><span class="ic">' + icon(t.icon) + '</span><span><b>' + esc(t.label) +
            '</b><span>' + esc(t.short) + '</span></span></a>';
        }).join('') + '</div>';

      if (d) {
        d.categories.forEach(function (c) {
          var docs = d.records.filter(function (r) { return r.category === c.id; });
          if (!docs.length) return;
          html += '<h2 class="section-title">' + esc(c.name) + ' (' + docs.length + ')</h2><div class="grid cols-3">' +
            docs.map(function (r) {
              return '<a class="tile" href="#/doc/' + esc(r.id) + '"><span class="ic">' + icon(c.icon) + '</span><span><b>' +
                esc(r.short || r.title) + '</b><span>' + esc(r.title) + '</span></span></a>';
            }).join('') + '</div>';
        });
      }

      html += '<div class="notice" style="margin-top:22px">' + icon('info') + '<p>Dữ liệu sức khỏe là dữ liệu cá nhân nhạy cảm (Nghị định 13/2023/NĐ-CP). ' +
        'Ứng dụng không thu thập, không gửi và không lưu thông tin người bệnh. <a href="#/about">Xem chi tiết</a>.</p></div></div>';
      view.innerHTML = html;
    }
  });
})();
