/* Module: Nguồn, phiên bản dữ liệu và bảo mật. */
(function () {
  'use strict';
  var App = window.CDSSApp, esc = App.util.esc, icon = App.util.icon;

  function statusChip(s) {
    return s === 'verified' ? '<span class="chip positive">Đã kiểm chứng</span>' : '<span class="chip caution">Chưa kiểm chứng</span>';
  }

  App.register('about', {
    title: 'Nguồn, phiên bản và bảo mật',
    crumb: 'Thông tin ›',
    render: function (view) {
      var d = App.data.docs, f = App.data.formulas;
      var rows = [['Danh mục tài liệu (data/documents.json)', d], ['Công thức và nguồn (data/formulas.json)', f]].map(function (x) {
        return '<tr><th scope="row">' + x[0] + '</th><td>' + (x[1]
          ? 'v' + esc(x[1].version) + ' · cập nhật ' + esc(x[1].updated) + ' · ' + statusChip(x[1].status)
          : '<span class="chip caution">Không tải được</span>') + '</td></tr>';
      }).join('');
      var offline = ('serviceWorker' in navigator) && /^https?:$/.test(location.protocol)
        ? 'Có. Sau lần mở đầu tiên khi có mạng, ứng dụng và tài liệu được lưu đệm để dùng ngoại tuyến.'
        : 'Không (đang mở trực tiếp từ tệp hoặc trình duyệt không hỗ trợ). Cần mở qua http(s) để dùng ngoại tuyến.';

      view.innerHTML = '<div class="page"><div class="grid">' +
        '<section class="card"><h2>Bảo mật dữ liệu người bệnh</h2>' +
        '<div class="notice caution">' + icon('alert') + '<p>Dữ liệu sức khỏe là dữ liệu cá nhân nhạy cảm theo Nghị định 13/2023/NĐ-CP. ' +
        'Đơn vị triển khai chịu trách nhiệm pháp lý và nên đối chiếu với bộ phận pháp chế. Nội dung dưới đây là danh sách kiểm, không thay tư vấn pháp lý.</p></div>' +
        '<ul><li>Mọi phép tính chạy trên trình duyệt; không gửi dữ liệu nhập lên máy chủ.</li>' +
        '<li>Không có ô nhập họ tên, số hồ sơ hay thông tin định danh.</li>' +
        '<li>Không lưu dữ liệu nhập vào localStorage hoặc IndexedDB. Trình duyệt chỉ ghi nhớ trạng thái thu gọn của thanh bên.</li>' +
        '<li>Tài liệu và phông chữ có thể tải từ CDN bên thứ ba (Google Fonts, cdnjs, jsDelivr, Tailwind) khi có mạng; các yêu cầu này không chứa dữ liệu người bệnh.</li></ul></section>' +
        '<section class="card"><h2>Phiên bản dữ liệu</h2><table class="kv"><tbody>' + rows +
        '<tr><th scope="row">Dùng ngoại tuyến</th><td>' + offline + '</td></tr></tbody></table></section>' +
        '<section class="card"><h2>Kiểm soát chất lượng</h2><ul>' +
        '<li>Công thức nằm trong <code>js/lib/formulas.js</code>, có bộ ca kiểm thử tại <a href="tests/index.html" target="_blank" rel="noopener">tests/index.html</a>.</li>' +
        '<li>Nhật ký thay đổi công thức: <code>CHANGELOG-cong-thuc.md</code>.</li>' +
        '<li>Công thức dùng trên người bệnh thật cần một dược sĩ hoặc bác sĩ khác đối chiếu với tài liệu gốc. Người dùng là người duyệt cuối.</li>' +
        '<li>Nội dung ' + (d ? d.records.length + ' ' : '') + 'tài liệu HTML do tài liệu gốc cung cấp; ứng dụng chỉ hiển thị, không chỉnh sửa và chưa đối chiếu.</li></ul></section>' +
        (f ? window.CDSSCalcUI.sourceCard(f.records.map(function (r) { return r.id; })) : '') +
        '</div></div>';
    }
  });
})();
