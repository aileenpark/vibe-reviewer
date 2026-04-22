/**
 * Vibe Review — Shared Header Component
 * URL 기반으로 현재 페이지를 감지하여 헤더와 모바일 메뉴를 동적으로 주입합니다.
 */
(function () {
  // ── 현재 페이지 감지 ──────────────────────────────────────────────────────
  const path = window.location.pathname;
  let activePage = 'analysis'; // 기본값: 코드 분석 (index, results)
  if (path.includes('history')) activePage = 'history';
  else if (path.includes('guide'))  activePage = 'guide';

  const navItems = [
    { id: 'analysis', label: '코드 분석', href: 'index.html',   icon: 'code'      },
    { id: 'history',  label: '리뷰 기록', href: 'history.html', icon: 'history'   },
    { id: 'guide',    label: '가이드',    href: 'guide.html',   icon: 'menu_book' },
  ];

  // ── CSS 주입 ──────────────────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    #vr-mobile-menu { pointer-events: none; }
    #vr-mobile-menu.menu-open { pointer-events: auto; }
    #vr-mobile-backdrop {
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    #vr-mobile-menu.menu-open #vr-mobile-backdrop { opacity: 1; }
    #vr-mobile-panel {
      transform: translateY(-8px);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
    }
    #vr-mobile-menu.menu-open #vr-mobile-panel {
      transform: translateY(0);
      opacity: 1;
    }
    #vr-hamburger-icon { transition: transform 0.2s ease; }
    .vr-menu-open-icon { transform: rotate(90deg); }
  `;
  document.head.appendChild(styleEl);

  // ── 데스크톱 nav 아이템 렌더링 ────────────────────────────────────────────
  function desktopNavItem(item) {
    const isActive = item.id === activePage;
    const href = isActive ? '#' : item.href;
    if (isActive) {
      return `<a
          class="text-primary font-emphasis-bold after:content-[''] after:block after:h-px after:bg-primary after:w-full hover:text-secondary transition-all duration-300"
          href="${href}">${item.label}</a>`;
    }
    return `<a
        class="text-slate-400 font-emphasis hover:text-secondary transition-all duration-300"
        href="${href}">${item.label}</a>`;
  }

  // ── 모바일 nav 아이템 렌더링 ──────────────────────────────────────────────
  function mobileNavItem(item) {
    const isActive = item.id === activePage;
    const href = isActive ? '#' : item.href;
    const rowCls = isActive
      ? 'text-primary font-emphasis-bold hover:bg-primary/5 active:bg-primary/10'
      : 'text-on-surface-variant font-emphasis hover:bg-white/[0.04] hover:text-on-surface active:bg-white/[0.07]';
    const chevronCls = isActive ? 'text-primary/50' : 'text-on-surface-variant/40';
    const closeAttr = isActive ? ' id="vr-mobile-same-page"' : '';
    return `
      <a href="${href}"${closeAttr}
        class="flex items-center gap-3 px-4 py-3.5 rounded-xl ${rowCls} transition-all duration-200">
        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1;">${item.icon}</span>
        ${item.label}
        <span class="ml-auto material-symbols-outlined text-[14px] ${chevronCls}">chevron_right</span>
      </a>`;
  }

  // ── HTML 빌드 ─────────────────────────────────────────────────────────────
  const html = `
<header id="vr-header" class="fixed top-0 w-full z-50 bg-[#0e0e13]/80 backdrop-blur-2xl border-b border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
  <div class="flex items-center justify-between px-4 md:px-12 h-16 md:h-20 w-full max-w-7xl mx-auto">
    <div class="flex items-center gap-10">
      <a class="text-2xl font-light italic text-primary font-brand tracking-tight" href="index.html">Vibe Review</a>
      <nav class="hidden md:flex items-center gap-8">
        ${navItems.map(desktopNavItem).join('\n        ')}
      </nav>
    </div>
    <button id="vr-hamburger-btn"
      class="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200"
      aria-label="메뉴 열기" aria-expanded="false" aria-controls="vr-mobile-menu">
      <span class="material-symbols-outlined text-[22px]" id="vr-hamburger-icon">menu</span>
    </button>
  </div>
</header>

<div id="vr-mobile-menu" class="fixed inset-0 z-40 md:hidden" aria-hidden="true">
  <div id="vr-mobile-backdrop" class="absolute inset-0 bg-[#0e0e13]/60 backdrop-blur-sm"></div>
  <div id="vr-mobile-panel"
    class="absolute top-16 left-0 right-0 bg-[#0e0e13]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_24px_64px_0_rgba(0,0,0,0.6)]">
    <nav class="flex flex-col px-4 py-4 gap-1 max-w-7xl mx-auto">
      ${navItems.map(mobileNavItem).join('\n      ')}
    </nav>
    <div class="h-px mx-4 bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2"></div>
    <p class="font-label text-[10px] tracking-[0.2em] text-on-surface-variant/30 uppercase text-center pb-4">Vibe Review · AI 코드 분석</p>
  </div>
</div>`;

  document.body.insertAdjacentHTML('afterbegin', html);

  // ── 햄버거 메뉴 로직 ──────────────────────────────────────────────────────
  const hamburgerBtn  = document.getElementById('vr-hamburger-btn');
  const hamburgerIcon = document.getElementById('vr-hamburger-icon');
  const mobileMenu    = document.getElementById('vr-mobile-menu');
  const mobileBackdrop = document.getElementById('vr-mobile-backdrop');

  function openMenu() {
    mobileMenu.classList.add('menu-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerIcon.textContent = 'close';
    hamburgerIcon.classList.add('vr-menu-open-icon');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('menu-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerIcon.textContent = 'menu';
    hamburgerIcon.classList.remove('vr-menu-open-icon');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.contains('menu-open') ? closeMenu() : openMenu();
  });
  mobileBackdrop.addEventListener('click', closeMenu);

  // 같은 페이지 링크 클릭 시 메뉴 닫기
  const samePageLink = document.getElementById('vr-mobile-same-page');
  if (samePageLink) samePageLink.addEventListener('click', closeMenu);

  // md 이상 창 크기에서는 메뉴 자동 닫기
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMenu();
  });
})();
