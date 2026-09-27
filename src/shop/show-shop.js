
function showShop() {
  if (!save.onboardingComplete || battle) return;
  hideMainScreens();
  els["shop-screen"].hidden = false;
  setActiveNav("shop-tab");
  renderShop();
}

