import React, { useState, useEffect } from "react";
import "./App.css"; // CSS 파일 import
// 구글 아이콘 이미지 import
//import axios from "axios"; // Axios import

function App() {
  const [activeMenu, setActiveMenu] = useState("홈");

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>강의실 예약 시스템</h1>
      </header>
      <div className="menu">
        <div
          className={`menu-item ${activeMenu === "대강의실" ? "active" : ""}`}
          onClick={() => handleMenuClick("대강의실")}
        >
          대강의실
        </div>
        <div
          className={`menu-item ${activeMenu === "소강의실" ? "active" : ""}`}
          onClick={() => handleMenuClick("소강의실")}
        >
          소강의실
        </div>
        <div
          className={`menu-item ${activeMenu === "내정보" ? "active" : ""}`}
          onClick={() => handleMenuClick("내정보")}
        >
          내정보
        </div>
      </div>
      <div className="content">
        {/* 조건부 렌더링 */}
        {activeMenu === "대강의실" && <BigReservation />}
        {activeMenu === "소강의실" && <SmallReservation />}
        {activeMenu === "내정보" && <UserInfoContent />}
      </div>
    </div>
  );
}
function BigReservation() {
  // 고정된 값 (이미지에 나와 있는 대로)
  // 드래그 기능이 있으니 크기를 크게하고 component크기를 딱 맞게
  const roomName = "제1열람실";
  const totalSeats = 407;
  const reservedSeats = 54;
  const availableSeats = totalSeats - reservedSeats;
  const percentage = (reservedSeats / totalSeats) * 100;

  return (
    <div className="seat-reservation">
      <svg className="seat-circle" viewBox="0 0 60 60" width="150" height="150">
        <circle className="background-circle" cx="18" cy="18" r="15.915" />
        <circle
          className="progress-circle"
          cx="18"
          cy="18"
          r="15.915"
          strokeDasharray={`${percentage} ${100 - percentage}`}
          strokeDashoffset="25"
        />
      </svg>
      <div className="seat-text">
        <div className="available-seats">{availableSeats}</div>
        <div className="seat-info">
          {reservedSeats} / {totalSeats}
        </div>
      </div>
      <div className="room-name">{roomName}</div>
    </div>
  );
}
function SmallReservation() {
  // 고정된 값 (이미지에 나와 있는 대로)
  const roomName = "제1열람실";
  const totalSeats = 407;
  const reservedSeats = 54;
  const availableSeats = totalSeats - reservedSeats;
  const percentage = (reservedSeats / totalSeats) * 100;

  return (
    <div className="seat-reservation">
      <svg className="seat-circle" viewBox="0 0 36 36">
        <circle className="background-circle" cx="18" cy="18" r="15.915" />
        <circle
          className="progress-circle"
          cx="18"
          cy="18"
          r="15.915"
          strokeDasharray={`${percentage} ${100 - percentage}`}
          strokeDashoffset="25"
        />
      </svg>
      <div className="seat-text">
        <div className="available-seats">{availableSeats}</div>
        <div className="seat-info">
          {reservedSeats} / {totalSeats}
        </div>
      </div>
      <div className="room-name">{roomName}</div>
    </div>
  );
}

function UserInfoContent() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");

  const handleLogin = () => {
    alert(`이름: ${name}, 학번: ${studentId}`);
    // 로그인 로직 추가
  };

  return (
    <div className="user-info">
      <h2>로그인</h2>
      <input
        type="text"
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="학번"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="input-field"
      />
      <button onClick={handleLogin} className="login-button">
        로그인
      </button>
    </div>
  );
}

// 모달 컴포넌트
function Modal({ title, content, closeModal }) {
  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <span className="close" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="modal-content">{content}</div>
      </div>
    </div>
  );
}

//구매 모달 컴포넌트
const Pmodal = ({ id, itemName, content, closeModal }) => {
  const handlePurchase = () => {
    axios
      .post("/api/items", { itemName })
      .then((response) => {
        alert(`${itemName}를 구매하였습니다!`);
        console.log("구매 요청 성공:", response.data);
      })
      .catch((error) => {
        console.error("구매 요청 중 오류 발생:", error);
      });
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-header">
          <h2>{itemName}</h2>
          <span className="close" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="modal-content">
          <p>{content}</p>
          <button className="purchase-button" onClick={handlePurchase}>
            구매
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
