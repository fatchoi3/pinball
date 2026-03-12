#  Marble Race: 새벽 이슬 청년부 레이스

> **Matter.js 물리 엔진을 활용한 실시간 인터랙티브 경주 게임** > 본 프로젝트는 React와 Matter.js를 결합하여 역동적인 물리 시뮬레이션을 구현하고, AWS Amplify를 통해 배포된 웹 기반 게임입니다.

---

## Live Demo
 링크 : https://collid.d1dm4heup3st3b.amplifyapp.com/

---

## Key Features (주요 기능)

* **Real-time Physics Engine:** `Matter.js`를 이용한 정교한 중력, 마찰, 탄성 기반의 물리 레이스.
* **Custom Obstacle System:** * **3-Hit Breakable Blocks:** 3번 충돌 시 파괴되는 내구도 시스템.
    * **High-Velocity Bounce:** `setVelocity` 로직을 이용해 공을 반대 방향으로 강력하게 튕겨내는 기믹.
* **Dynamic Group Settings:** 팀 이름, 공의 개수, 우승 순위(Target Rank)를 자유롭게 설정 가능.
* **Smart Layout:** 공의 개수에 상관없이 캔버스 중앙을 기준으로 배치되는 동적 그리드 알고리즘.
* **Auto-Tracking:** 선두 공이 결승선에 근접하거나 골인 시 자동으로 화면을 하단으로 이동시키는 스무스 스크롤.

---

## Tech Stack (기술 스택)

| Category | Tech |
| :--- | :--- |
| **Library** | React (v18+) |
| **Physics** | Matter.js |
| **Build Tool** | Vite |
| **Deployment** | AWS Amplify (CI/CD) |
| **Styling** | CSS3 (Flexbox/Grid, Canvas API) |

---

## Technical Challenges & Improvements (기술적 도전 및 해결)

### 1. React와 외부 물리 엔진의 통합
React의 선언적 렌더링 환경과 Matter.js의 명령형 물리 엔진 간의 충돌을 방지하기 위해 `useRef`를 사용하여 엔진 상태를 유지하고, `useEffect` 내에서 정교한 **Cleanup 함수**를 구현하여 메모리 누수를 방지했습니다.

### 2. 렌더링 최적화
수십 개의 공 위에 실시간으로 팀 이름을 렌더링하기 위해 React DOM 대신 **Canvas API의 `afterRender` 이벤트**를 사용했습니다. 이를 통해 수십 개의 물리 객체가 동시에 움직여도 60FPS의 부드러운 화면을 유지했습니다.

### 3. 물리 반동 로직 설계
단순한 `applyForce` 대신 `setVelocity`를 사용하여 입사각에 따른 즉각적인 속도 변화를 주었습니다. 이는 게임의 박진감을 높이고 '역전 상황'을 유도하는 게임 디자인적 요소로 활용되었습니다.

---

## Installation & Setup

1.  **Repository Clone**
    ```bash
    git clone [https://github.com/fatchoi3/canvas-core.git](https://github.com/fatchoi3/canvas-core.git)
    cd canvas-core
    ```

2.  **Dependencies Install**
    ```bash
    npm install
    ```

3.  **Local Run**
    ```bash
    npm run dev
    ```

4.  **Build**
    ```bash
    npm run build
    ```

---
