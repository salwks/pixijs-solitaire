// PixiJS 솔리테어 - 토스트 UI

export class ToastUI {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // 토스트 상태
    this.isVisible = false;
    this.currentToast = null;
    this.hideTimeout = null;

    // 화면 크기
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  // 토스트 메시지 표시
  showToast(message, duration = 5000) {
    // 기존 토스트가 있으면 제거
    this.hideToast();

    // 토스트 컨테이너 생성
    const toastContainer = new PIXI.Container();

    // 텍스트 먼저 생성하여 크기 측정
    const text = new PIXI.Text(message, {
      fontFamily: "Arial, sans-serif",
      fontSize: 16,
      fill: 0xffffff,
      fontWeight: "bold",
      align: "center",
    });

    // 텍스트 크기에 맞춰 배경 크기 계산 (여백 포함)
    const padding = 20;
    const minWidth = 200;
    const backgroundWidth = Math.max(minWidth, text.width + padding * 2);
    const backgroundHeight = text.height + padding * 2;

    // 배경 (텍스트 크기에 맞춰 동적 생성)
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.8);
    background.drawRoundedRect(0, 0, backgroundWidth, backgroundHeight, 10);
    background.endFill();
    toastContainer.addChild(background);

    // 텍스트를 배경 중앙에 배치
    text.anchor.set(0.5, 0.5);
    text.x = backgroundWidth / 2;
    text.y = backgroundHeight / 2;
    toastContainer.addChild(text);

    // 하단 중앙에 위치
    toastContainer.x = (this.screenWidth - backgroundWidth) / 2;
    toastContainer.y = this.screenHeight - 100;

    // 애니메이션: 아래에서 위로 슬라이드
    toastContainer.y = this.screenHeight;
    toastContainer.alpha = 0;

    this.container.addChild(toastContainer);
    this.currentToast = toastContainer;
    this.isVisible = true;

    // 슬라이드 인 애니메이션
    const targetY = this.screenHeight - 100;
    const animate = () => {
      if (this.currentToast && this.currentToast.y > targetY) {
        this.currentToast.y -= 10;
        this.currentToast.alpha += 0.1;
        requestAnimationFrame(animate);
      }
    };
    animate();

    // 자동 숨김 타이머 (5초)
    this.hideTimeout = setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  // 토스트 숨기기
  hideToast() {
    if (this.currentToast && this.isVisible && this.currentToast.parent) {
      // 아래로 슬라이드 아웃 애니메이션 (나온 방향 반대로)
      const animate = () => {
        if (this.currentToast && this.currentToast.y < this.screenHeight) {
          this.currentToast.y += 10;
          this.currentToast.alpha -= 0.1;
          requestAnimationFrame(animate);
        } else {
          if (this.currentToast && this.currentToast.parent) {
            this.container.removeChild(this.currentToast);
          }
          this.currentToast = null;
          this.isVisible = false;
        }
      };
      animate();
    } else {
      // 토스트가 없거나 이미 제거된 경우 상태만 정리
      this.currentToast = null;
      this.isVisible = false;
    }

    // 타이머 클리어
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  // 화면 크기 변경 시 호출
  resize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;

    // 현재 토스트 위치 업데이트 (동적 크기에 맞춰)
    if (this.currentToast) {
      const background = this.currentToast.children[0]; // 배경이 첫 번째 자식
      if (background && background.width) {
        this.currentToast.x = (this.screenWidth - background.width) / 2;
      }
    }
  }

  // 정리
  destroy() {
    this.hideToast();
    if (this.container) {
      this.app.stage.removeChild(this.container);
      this.container = null;
    }
  }
}
