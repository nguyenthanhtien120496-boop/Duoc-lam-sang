/* Module: Trình xem tài liệu HTML trong khung, kèm thanh công cụ và điều hướng trước/sau trong cùng nhóm. */
(function () {
  'use strict';
  var App = window.CDSSApp, esc = App.util.esc, icon = App.util.icon;

  function notFound(view, id) {
    view.innerHTML = '<div class="page"><div class="notice negative">' + icon('alert') + '<p>Không tìm thấy tài liệu "' + esc(id) +
      '". ' + (App.data.error ? 'Dữ liệu danh mục chưa tải được. ' : '') + '<a href="#/">Về trang chủ</a>.</p></div></div>';
    return { title: 'Không tìm thấy tài liệu' };
  }

  App.register('doc', {
    title: 'Tài liệu',
    render: function (view, id) {
      var doc = App.findDoc(id);
      if (!doc) return notFound(view, id);
      var cat = App.findCategory(doc.category) || { name: '', icon: 'doc' };
      var sibs = App.data.docs.records.filter(function (r) { return r.category === doc.category; });
      var i = sibs.indexOf(doc), prev = sibs[i - 1], next = sibs[i + 1];
      var url = App.util.docUrl(doc);

      view.classList.add('is-doc');
      view.innerHTML =
        '<div class="doc-bar"><div class="meta"><span class="chip">' + esc(cat.name) + '</span>' +
        '<span class="chip caution" title="Nội dung do tài liệu gốc cung cấp; ứng dụng chưa đối chiếu">Nội dung chưa kiểm chứng</span></div>' +
        '<div class="actions">' +
        (prev ? '<a class="btn" href="#/doc/' + esc(prev.id) + '" title="' + esc(prev.title) + '" aria-label="Tài liệu trước: ' + esc(prev.short) + '">‹<span class="txt">Trước</span></a>' : '') +
        (next ? '<a class="btn" href="#/doc/' + esc(next.id) + '" title="' + esc(next.title) + '" aria-label="Tài liệu sau: ' + esc(next.short) + '"><span class="txt">Sau</span>›</a>' : '') +
        '<button class="btn" type="button" data-act="reload" aria-label="Tải lại tài liệu">' + icon('reload') + '<span class="txt">Tải lại</span></button>' +
        '<a class="btn primary" href="' + url + '" target="_blank" rel="noopener" aria-label="Mở tài liệu trong tab mới">' + icon('external') + '<span class="txt">Mở tab mới</span></a>' +
        '</div></div>' +
        '<div class="doc-frame-wrap"><div class="doc-loading">Đang tải tài liệu…</div>' +
        '<iframe class="doc-frame" title="' + esc(doc.title) + '" src="' + url + '" loading="eager"></iframe></div>';

      var frame = view.querySelector('iframe'), loading = view.querySelector('.doc-loading');
      frame.addEventListener('load', function () { loading.hidden = true; });
      view.querySelector('[data-act="reload"]').addEventListener('click', function () {
        loading.hidden = false;
        frame.src = url;
      });
      return { title: doc.short || doc.title, crumb: cat.name + ' ›' };
    }
  });
})();
