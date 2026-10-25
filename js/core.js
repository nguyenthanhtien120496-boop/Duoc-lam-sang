/*
 * Lõi ứng dụng: nạp dữ liệu, thanh bên, tìm kiếm, định tuyến theo hash.
 * Mỗi module tự đăng ký bằng CDSSApp.register(route, { title, crumb, render(view, param) })
 * và chỉ được ghi vào phần tử view được cấp.
 */
(function () {
  'use strict';

  var LS_MINI = 'cdss.sidebar.mini';
  var LS_CLOSED = 'cdss.sidebar.closedGroups';

  var routes = {};
  var data = { docs: null, formulas: null, error: null };
  var $ = function (id) { return document.getElementById(id); };

  var TOOLS = [
    { route: 'calc/crcl', label: 'Độ thanh thải creatinine (CrCl)', short: 'CrCl – Cockcroft-Gault', icon: 'kidney', tags: ['thận', 'cockcroft', 'gault', 'clcr', 'chỉnh liều'] },
    { route: 'calc/egfr', label: 'eGFR – CKD-EPI 2021 / Schwartz', short: 'eGFR người lớn & trẻ em', icon: 'flask', tags: ['thận', 'ckd-epi', 'schwartz', 'trẻ em', 'kdigo'] },
    { route: 'calc/body', label: 'BMI và diện tích da (BSA)', short: 'BMI · BSA Mosteller', icon: 'scale', tags: ['bmi', 'bsa', 'mosteller', 'béo phì', 'diện tích da'] }
  ];

  // ---------- Tiện ích ----------
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(name) { return '<svg class="i" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  function docUrl(doc) { return encodeURI(doc.file); }

  // ---------- Dữ liệu ----------
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ': HTTP ' + r.status);
      return r.json();
    });
  }
  function loadData() {
    return Promise.all([getJSON('data/documents.json'), getJSON('data/formulas.json')])
      .then(function (res) { data.docs = res[0]; data.formulas = res[1]; })
      .catch(function (e) { data.error = e; });
  }

  // ---------- Thanh bên ----------
  function navItem(route, label, iconName, search) {
    return '<li data-search="' + esc(norm(search || label)) + '"><a class="sb-link" href="#/' + esc(route) +
      '" data-route="' + esc(route) + '" title="' + esc(label) + '">' + icon(iconName) +
      '<span class="label">' + esc(label) + '</span></a></li>';
  }
  function navGroup(id, title, items) {
    var closed = lsGet(LS_CLOSED, []).indexOf(id) !== -1;
    return '<div class="sb-group' + (closed ? ' is-closed' : '') + '" data-group="' + esc(id) + '">' +
      '<button class="sb-group-btn" type="button" aria-expanded="' + !closed + '">' +
      '<svg class="i chev" aria-hidden="true"><use href="#i-chev"/></svg><span>' + esc(title) + '</span>' +
      '<span class="count" data-total="' + items.length + '">' + items.length + '</span></button>' +
      '<ul class="sb-list">' + items.join('') + '</ul></div>';
  }
  function buildNav() {
    var html = navGroup('overview', 'Tổng quan', [navItem('', 'Trang chủ', 'home', 'trang chu home')]);
    html += navGroup('tools', 'Công cụ tính', TOOLS.map(function (t) {
      return navItem(t.route, t.label, t.icon, t.label + ' ' + t.tags.join(' '));
    }));
    if (data.docs) {
      data.docs.categories.forEach(function (c) {
        var items = data.docs.records.filter(function (d) { return d.category === c.id; }).map(function (d) {
          return navItem('doc/' + d.id, d.short || d.title, c.icon, [d.title, d.short, c.name].concat(d.tags || []).join(' '));
        });
        if (items.length) html += navGroup('cat-' + c.id, c.name, items);
      });
    }
    html += navGroup('info', 'Thông tin', [navItem('about', 'Nguồn, phiên bản & bảo mật', 'info', 'nguon phien ban bao mat nghi dinh 13')]);
    html += '<p class="sb-empty" id="sb-empty" hidden>Không tìm thấy mục phù hợp.</p>';
    $('sb-nav').innerHTML = html;

    var foot = data.error
      ? '<span style="color:#f3b4c4">Không tải được dữ liệu tài liệu.</span>'
      : 'Dữ liệu v' + esc(data.docs.version) + ' · ' + esc(data.docs.updated) + ' · <a href="#/about">Chi tiết</a>';
    $('sb-foot').innerHTML = foot;
  }

  function onGroupToggle(e) {
    var btn = e.target.closest('.sb-group-btn');
    if (!btn) return;
    var g = btn.parentNode, id = g.getAttribute('data-group');
    var closed = g.classList.toggle('is-closed');
    btn.setAttribute('aria-expanded', String(!closed));
    var list = lsGet(LS_CLOSED, []).filter(function (x) { return x !== id; });
    if (closed) list.push(id);
    lsSet(LS_CLOSED, list);
  }

  function filterNav(q) {
    var nq = norm(q).trim(), any = false;
    var terms = nq.split(/\s+/).filter(Boolean);
    Array.prototype.forEach.call(document.querySelectorAll('#sb-nav .sb-group'), function (g) {
      var shown = 0;
      Array.prototype.forEach.call(g.querySelectorAll('li'), function (li) {
        var s = li.getAttribute('data-search');
        var hit = terms.every(function (t) { return s.indexOf(t) !== -1; });
        li.hidden = !hit;
        if (hit) shown++;
      });
      g.hidden = shown === 0;
      var count = g.querySelector('.count');
      count.textContent = nq ? shown + '/' + count.getAttribute('data-total') : count.getAttribute('data-total');
      if (nq && shown) g.classList.remove('is-closed');
      if (shown) any = true;
    });
    if (!nq) {
      // Khôi phục trạng thái đóng/mở người dùng đã chọn
      var closed = lsGet(LS_CLOSED, []);
      Array.prototype.forEach.call(document.querySelectorAll('#sb-nav .sb-group'), function (g) {
        g.classList.toggle('is-closed', closed.indexOf(g.getAttribute('data-group')) !== -1);
      });
    }
    if ($('sb-empty')) $('sb-empty').hidden = any;
  }

  function isMobile() { return window.matchMedia('(max-width: 900px)').matches; }
  function setDrawer(open) {
    var app = $('app');
    app.classList.toggle('is-open', open);
    $('menu-btn').setAttribute('aria-expanded', String(open));
    if (open) setTimeout(function () { $('sb-q').focus(); }, 50);
  }
  function setMini(mini) {
    // Ô tìm kiếm bị ẩn khi thu gọn: bỏ bộ lọc để không còn mục bị giấu mà người dùng không thấy lý do.
    if (mini && $('sb-q').value) { $('sb-q').value = ''; filterNav(''); }
    $('app').classList.toggle('is-mini', mini);
    $('sb-collapse').setAttribute('aria-expanded', String(!mini));
    $('sb-collapse').setAttribute('aria-label', mini ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên');
    lsSet(LS_MINI, mini);
  }

  // ---------- Định tuyến ----------
  function parseHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    if (h.indexOf('doc/') === 0) return { key: 'doc', param: h.slice(4), route: h };
    if (routes[h]) return { key: h, param: null, route: h };
    return { key: '', param: null, route: '' };
  }

  function route() {
    var r = parseHash();
    var mod = routes[r.key] || routes[''];
    var view = $('view');
    view.className = 'view';
    view.innerHTML = '';
    view.scrollTop = 0;
    var info = mod.render(view, r.param) || {};
    var title = info.title || mod.title || '';
    $('page-title').textContent = title;
    $('crumb').textContent = info.crumb || mod.crumb || '';
    document.title = title ? title + ' · Cổng Dược Lâm Sàng' : 'Cổng Dược Lâm Sàng';

    Array.prototype.forEach.call(document.querySelectorAll('.sb-link'), function (a) {
      if (a.getAttribute('data-route') === r.route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var cur = document.querySelector('.sb-link[aria-current="page"]');
    if (cur) {
      var g = cur.closest('.sb-group');
      if (g && g.classList.contains('is-closed')) { g.classList.remove('is-closed'); }
      if (cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    }
    if (isMobile()) setDrawer(false);
  }

  // ---------- Khởi động ----------
  function bindUI() {
    $('sb-nav').addEventListener('click', onGroupToggle);
    $('sb-q').addEventListener('input', function (e) { filterNav(e.target.value); });
    $('sb-q').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = document.querySelector('#sb-nav li:not([hidden]) .sb-link');
        var visibleGroup = first && !first.closest('.sb-group').hidden;
        if (first && visibleGroup) { location.hash = first.getAttribute('href'); }
      } else if (e.key === 'Escape') {
        e.target.value = ''; filterNav('');
      }
    });
    $('menu-btn').addEventListener('click', function () { setDrawer(true); });
    $('sb-close').addEventListener('click', function () { setDrawer(false); $('menu-btn').focus(); });
    $('overlay').addEventListener('click', function () { setDrawer(false); });
    $('sb-collapse').addEventListener('click', function () { setMini(!$('app').classList.contains('is-mini')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('app').classList.contains('is-open')) { setDrawer(false); $('menu-btn').focus(); }
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !e.target.isContentEditable) {
        e.preventDefault();
        if (isMobile()) setDrawer(true);
        else { if ($('app').classList.contains('is-mini')) setMini(false); $('sb-q').focus(); }
      }
    });
    window.addEventListener('hashchange', route);
  }

  function registerSW() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* chạy được khi không có SW */ });
    });
  }

  var App = {
    register: function (key, mod) { routes[key] = mod; },
    data: data,
    tools: TOOLS,
    util: { norm: norm, esc: esc, icon: icon, docUrl: docUrl },
    findDoc: function (id) {
      if (!data.docs) return null;
      for (var i = 0; i < data.docs.records.length; i++) if (data.docs.records[i].id === id) return data.docs.records[i];
      return null;
    },
    findCategory: function (id) {
      if (!data.docs) return null;
      for (var i = 0; i < data.docs.categories.length; i++) if (data.docs.categories[i].id === id) return data.docs.categories[i];
      return null;
    },
    start: function () {
      setMini(lsGet(LS_MINI, false) === true);
      bindUI();
      registerSW();
      loadData().then(function () { buildNav(); route(); });
    }
  };
  window.CDSSApp = App;
})();
